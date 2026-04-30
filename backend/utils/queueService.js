import { Queue, Worker } from 'bullmq';
import schedule from 'node-schedule';
import net from 'net';
import FoodListing from '../models/FoodListing.js';
import User from '../models/User.js';
import sendEmail from './sendEmail.js';

const REDIS_HOST = '127.0.0.1';
const REDIS_PORT = 6379;

let useRedis = false;
let expiryWarningQueue = null;
let expiryWarningWorker = null;

// Socket.io instance reference (will be injected at server startup)
let ioInstance = null;

// TCP Port connection test to verify if Redis is running locally
const checkRedisConnection = () => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    
    socket.once('error', () => {
      resolve(false);
    });
    
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(REDIS_PORT, REDIS_HOST);
  });
};

// Emergency Warning alert trigger logic
export const triggerWarningAlert = async (listingId, coordinates) => {
  console.log(`⏰ [ALARM] Warning check triggered for listing: ${listingId}`);
  try {
    const listing = await FoodListing.findById(listingId).populate('donor', 'name');
    if (!listing) return;

    // Only alert if there is at least one item still AVAILABLE
    const hasAvailableItems = listing.items.some(item => item.status === 'AVAILABLE');
    const isStillAvailable = listing.status === 'AVAILABLE';

    if (!hasAvailableItems || !isStillAvailable) {
      console.log(`Listing ${listingId} is already fully claimed or completed. Alert canceled.`);
      return;
    }

    // 1. Mark listing as CRITICAL
    listing.isCritical = true;
    await listing.save();
    console.log(`Listing ${listingId} is now marked as CRITICAL.`);

    // 2. Broadcast socket update to connected clients
    if (ioInstance) {
      ioInstance.emit('foodCriticalAlert', {
        listingId,
        title: listing.title,
        message: `🚨 Emergency Alert: "${listing.title}" expires soon and is still available!`,
      });
    }

    // 3. Search for NGOs within a tighter 2km radius
    const radiusInMeters = 2000;
    const nearbyNGOs = await User.find({
      role: 'NGO',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates // [lng, lat]
          },
          $maxDistance: radiusInMeters
        }
      }
    });

    console.log(`[URGENT] Found ${nearbyNGOs.length} NGOs within 2km of critical listing ${listingId}. Dispatching alert emails.`);

    // 4. Send email blasts
    const emailPromises = nearbyNGOs.map(ngo => {
      const message = `
        <div style="font-family: Arial, sans-serif; padding: 25px; border: 2px solid #ef4444; border-radius: 12px; max-width: 600px; background-color: #fef2f2; text-align: left;">
          <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">🚨 URGENT ALARM: Food Expiring Soon Near You!</h2>
          <p><strong>${listing.donor.name}</strong> has surplus food listed on the radar that will expire in less than 2 hours!</p>
          <div style="background-color: #ffffff; padding: 15px; border: 1px solid #fee2e2; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Food:</strong> ${listing.title}</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${listing.quantity}</p>
            <p style="margin: 5px 0; color: #dc2626;"><strong>Expires at:</strong> ${new Date(listing.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <p style="font-weight: bold; color: #b91c1c;">Please claim this listing on the dashboard immediately to prevent waste.</p>
          <a href="http://localhost:5173/login" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Claim Now on Radar</a>
        </div>
      `;

      return sendEmail({
        email: ngo.email,
        subject: `URGENT ALERT: Food expiring near you: ${listing.title}`,
        message
      });
    });

    Promise.all(emailPromises).catch(err => console.error("Emergency email dispatch failed:", err));
  } catch (error) {
    console.error("Error running warning trigger:", error);
  }
};

// Initialize the Queue Service
export const initQueueService = async (io) => {
  ioInstance = io;
  
  console.log("🔍 Checking local Redis server status...");
  const isRedisOnline = await checkRedisConnection();

  if (isRedisOnline) {
    console.log("🟢 Redis is active! Initializing BullMQ queues...");
    useRedis = true;

    // Create the BullMQ Expiry Warning Queue
    expiryWarningQueue = new Queue('ExpiryWarningQueue', {
      connection: { host: REDIS_HOST, port: REDIS_PORT }
    });

    // Create the BullMQ Expiry Warning Worker
    expiryWarningWorker = new Worker('ExpiryWarningQueue', async (job) => {
      const { listingId, coordinates } = job.data;
      await triggerWarningAlert(listingId, coordinates);
    }, {
      connection: { host: REDIS_HOST, port: REDIS_PORT }
    });

    expiryWarningWorker.on('failed', (job, err) => {
      console.error(`❌ BullMQ Job ${job?.id} failed with error:`, err);
    });
  } else {
    console.log("⚠️ Redis is offline. Gracefully falling back to in-memory 'node-schedule'.");
    useRedis = false;
  }
};

// Schedule the expiry warning alert (2 hours before expiryTime)
export const scheduleExpiryWarning = async (listingId, expiryTime, coordinates) => {
  const expiryDate = new Date(expiryTime);
  // Calculate warning date: 2 hours before absolute expiry
  const warningDate = new Date(expiryDate.getTime() - 2 * 60 * 60 * 1000);
  
  const delayMs = warningDate.getTime() - Date.now();

  console.log(`Scheduler: Listing ${listingId} warning set for ${warningDate.toLocaleString()}`);

  if (delayMs <= 0) {
    console.log(`Warning time has already passed for listing ${listingId}. Skipping warning queue.`);
    return;
  }

  if (useRedis && expiryWarningQueue) {
    // Add job to BullMQ with delay
    try {
      await expiryWarningQueue.add(
        'warning', 
        { listingId, coordinates }, 
        { delay: delayMs, jobId: `warn_${listingId}` }
      );
      console.log(`🎯 Scheduled BullMQ warning job for listing ${listingId} with ${Math.round(delayMs / 60000)}m delay.`);
    } catch (err) {
      console.error("Failed to add job to BullMQ. Falling back to node-schedule.", err);
      scheduleInMemory(listingId, warningDate, coordinates);
    }
  } else {
    // Fallback directly to node-schedule
    scheduleInMemory(listingId, warningDate, coordinates);
  }
};

const scheduleInMemory = (listingId, warningDate, coordinates) => {
  schedule.scheduleJob(`warn_${listingId}`, warningDate, async () => {
    await triggerWarningAlert(listingId, coordinates);
  });
  console.log(`🎯 Scheduled in-memory node-schedule warning job for listing ${listingId}.`);
};

// Cancel warning jobs if listing gets fully claimed early
export const cancelExpiryWarning = async (listingId) => {
  if (useRedis && expiryWarningQueue) {
    try {
      const job = await expiryWarningQueue.getJob(`warn_${listingId}`);
      if (job) {
        await job.remove();
        console.log(`Removed BullMQ warning job for listing ${listingId}.`);
      }
    } catch (err) {
      console.error(`Failed to remove BullMQ job: warn_${listingId}`, err);
    }
  } else {
    const myJob = schedule.scheduledJobs[`warn_${listingId}`];
    if (myJob) {
      myJob.cancel();
      console.log(`Cancelled in-memory node-schedule warning job for listing ${listingId}.`);
    }
  }
};
