import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import chatRoutes from './routes/chatRoutes.js'; // <-- NEW
import analyticsRoutes from './routes/analyticsRoutes.js';
import { initQueueService } from './utils/queueService.js'; // <-- NEW
import ChatMessage from './models/ChatMessage.js'; // <-- NEW

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas / Local
connectDB();

const app = express();

// Create the HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Your Vite frontend URL
    methods: ['GET', 'POST']
  }
});

// Make 'io' accessible inside our controllers!
app.set('io', io);

// Initialize background warning queues (BullMQ with Node-Schedule fallback)
initQueueService(io);

// Socket.io connection & Chat Rooms logic
io.on('connection', (socket) => {
  console.log(`📡 New Radar Connection: ${socket.id}`);

  // Register private user room mapping
  socket.on('registerUser', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📡 Registered private user room: user_${userId}`);
  });

  // Join a specific pickup coordination chat room
  socket.on('joinChat', ({ pickupId }) => {
    socket.join(`pickup_chat_${pickupId}`);
    console.log(`👤 Socket ${socket.id} joined room: pickup_chat_${pickupId}`);
  });

  // Handle message sending, save to DB, and broadcast
  socket.on('sendMessage', async ({ pickupId, senderId, message }) => {
    try {
      const msg = await ChatMessage.create({
        pickupRequest: pickupId,
        sender: senderId,
        message: message.trim()
      });

      const populatedMsg = await ChatMessage.findById(msg._id).populate('sender', 'name role');
      
      // Broadcast back to all clients in the room
      io.to(`pickup_chat_${pickupId}`).emit('newMessage', populatedMsg);
    } catch (err) {
      console.error("WebSocket sendMessage error:", err);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Radar Disconnected: ${socket.id}`);
  });
});

// Standard Security & Body Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/chat', chatRoutes); // <-- NEW
app.use('/api/analytics', analyticsRoutes);

// Base Route to Verify Server Status
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));