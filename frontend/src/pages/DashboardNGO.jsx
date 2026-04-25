import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Navigation, CheckCircle, Package, Star, Filter, Search, Copy, Check, MessageSquare, AlertTriangle } from 'lucide-react';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import RadarScanner from '../components/RadarScanner';
import ChatDrawer from '../components/ChatDrawer';

const DashboardNGO = () => {
  const { user } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [claimStatus, setClaimStatus] = useState({ id: null, pin: null, loading: false });
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeClaims, setActiveClaims] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState('ALL'); // ALL, VEG, NON-VEG
  const [copiedPin, setCopiedPin] = useState(false);

  // Selected items checkboxes mapping: listingId -> array of itemIds
  const [selectedItems, setSelectedItems] = useState({});

  // Chat coordination state
  const [chatPickupId, setChatPickupId] = useState(null);
  const [chatPartnerName, setChatPartnerName] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. Fetch Location & Food
  const fetchData = async () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false);
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await API.get(`/listings/nearby?lat=${latitude}&lng=${longitude}&radius=10`);
          setListings(data.data);
          
          const reviewData = await API.get('/pickups/reviews/pending');
          setPendingReviews(reviewData.data.data);

          // Fetch active claims
          fetchActiveClaims();
        } catch (error) {
          console.error('Failed to fetch nearby food', error);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Location denied", err);
        setLocating(false);
        setLoading(false);
      }
    );
  };

  const fetchActiveClaims = async () => {
    try {
      const { data } = await API.get('/pickups/ngo/active');
      setActiveClaims(data.data);
    } catch (err) {
      console.error("Failed to fetch active claims", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // 2. Socket.io Live Radar & Private Handover Alerts
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    // Register user private WebSocket channel
    socket.emit('registerUser', user._id);

    socket.on('newFoodRadar', (newFoodItem) => {
      setListings((prevListings) => {
        const index = prevListings.findIndex(item => item._id === newFoodItem._id);
        if (index !== -1) {
          const updated = [...prevListings];
          updated[index] = newFoodItem;
          return updated;
        }
        return [newFoodItem, ...prevListings];
      });
    });

    socket.on('foodExpired', (expiredId) => {
      setListings((prevListings) => prevListings.filter(item => item._id !== expiredId));
    });

    // Listen for critical warning triggers
    socket.on('foodCriticalAlert', ({ listingId, message }) => {
      setListings((prevListings) => 
        prevListings.map(item => item._id === listingId ? { ...item, isCritical: true } : item)
      );
      console.log(`⚠️ EMERGENCY SIGNAL: ${message}`);
    });

    // Listen for live dropoffs to trigger reviews instantly
    socket.on('pickupDelivered', (deliveredPickup) => {
      console.log("Handover completed! Opening rating banner instantly:", deliveredPickup);
      setPendingReviews((prev) => {
        // Prevent duplicate reviewer prompts
        if (prev.some(p => p._id === deliveredPickup._id)) return prev;
        return [deliveredPickup, ...prev];
      });
      // Refresh active coordination list
      fetchActiveClaims();
    });

    return () => socket.disconnect();
  }, [user._id]);

  // Checkbox toggling helper
  const toggleItemSelection = (listingId, itemId) => {
    const currentSelected = selectedItems[listingId] || [];
    if (currentSelected.includes(itemId)) {
      setSelectedItems({
        ...selectedItems,
        [listingId]: currentSelected.filter(id => id !== itemId)
      });
    } else {
      setSelectedItems({
        ...selectedItems,
        [listingId]: [...currentSelected, itemId]
      });
    }
  };

  // 3. Claiming Transaction
  const handleClaim = async (listingId) => {
    setClaimStatus({ id: listingId, pin: null, loading: true });
    try {
      const selectedIds = selectedItems[listingId] || [];
      const { data } = await API.post(`/pickups/claim/${listingId}`, { itemIds: selectedIds });
      setClaimStatus({ id: listingId, pin: data.data.verificationPin, loading: false });
      
      // Clear checklist
      setSelectedItems({ ...selectedItems, [listingId]: [] });
      
      // Refresh feeds
      fetchData();
      fetchActiveClaims();
    } catch (error) {
      console.error('Claim failed', error);
      setClaimStatus({ id: null, pin: null, loading: false });
      alert(error.response?.data?.message || 'Failed to claim food');
    }
  };

  // 4. Rating Handover
  const handleRating = async (pickupId, listingId, score) => {
    try {
      await API.post(`/pickups/${pickupId}/rate`, { rating: score });
      setPendingReviews(prev => prev.filter(review => review._id !== pickupId));
      fetchActiveClaims();
      if (listingId) {
        setListings(prev => prev.filter(item => item._id !== listingId));
      }
    } catch (err) {
      alert("Failed to submit rating.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const triggerChat = (pickupId, donorName) => {
    setChatPickupId(pickupId);
    setChatPartnerName(donorName);
    setIsChatOpen(true);
  };

  // Filter listings based on Search Query and Diet classification
  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = dietFilter === 'ALL' ? true : item.foodType === dietFilter;
    
    const hasAvailableItems = item.items && item.items.some(sub => sub.status === 'AVAILABLE');
    
    return matchesSearch && matchesDiet && hasAvailableItems && item.status === 'AVAILABLE';
  });

  const getExpiryLabel = (expiryTime, isCritical) => {
    const diffMs = new Date(expiryTime) - Date.now();
    if (diffMs <= 0) return { label: 'Expired', color: 'bg-red-50 text-red-600 border-red-100' };
    
    const diffMins = Math.floor(diffMs / 60000);
    if (isCritical || diffMins < 120) {
      return { label: `Critical: ${diffMins}m left`, color: 'bg-red-50 text-red-600 border-red-200 animate-pulse font-extrabold shadow-sm' };
    }
    
    const diffHours = (diffMs / 3600000).toFixed(1);
    if (diffHours < 3) {
      return { label: `Expires in ${diffHours}h`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    
    return { label: `Expires in ${Math.round(diffHours)}h`, color: 'bg-green-50 text-green-700 border-green-200' };
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* RADAR OVERVIEW SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <RadarScanner activeCount={filteredListings.length} />
          </div>
          
          <div className="lg:col-span-7 space-y-6 text-left self-center">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-brand-500/20 text-brand-700 border border-brand-500/30 px-3 py-1 rounded-full mb-3 inline-block">
                NGO Live Radar Feed
              </span>
              <h2 className="text-3xl font-display font-extrabold text-brand-900 tracking-tight leading-tight">
                Rescue Selected Items Around You
              </h2>
              <p className="text-gray-500 text-sm mt-2 font-medium max-w-lg leading-relaxed">
                Connect directly with nearby donors. Select specific items to rescue, claim them, and coordinate coordinates pickup details via coordinate chat!
              </p>
            </div>

            {/* SEARCH & FILTERS PANEL */}
            <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-soft space-y-3.5 max-w-lg">
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search listings (e.g. Rice, Biryani, Pasta)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface pl-11 pr-4 py-2.5 rounded-xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-xs font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mr-2 flex items-center gap-1">
                  <Filter size={12} /> Filter:
                </span>
                {['ALL', 'VEG', 'NON-VEG'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setDietFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${
                      dietFilter === type
                        ? 'bg-brand-500 text-white shadow-glow'
                        : 'bg-surface border border-gray-150 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE CLAIMS & CHAT LEDGER */}
        <AnimatePresence>
          {activeClaims.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              className="mb-8 space-y-4 text-left"
            >
              <h2 className="text-sm font-extrabold text-brand-900 flex items-center gap-2 px-1">
                <Package className="text-brand-500 animate-pulse" size={16} /> Active Claims Coordination ({activeClaims.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeClaims.map((claim) => (
                  <div key={claim._id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-soft flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold bg-brand-50 text-brand-700 border border-brand-100 px-2 py-0.5 rounded uppercase tracking-wider">
                          Claim Active
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          PIN: <strong className="text-brand-900 tracking-wide text-xs">{claim.verificationPin}</strong>
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">{claim.listing?.donor?.name || 'Partner Donor'}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">Address: {claim.listing?.address}</p>
                      </div>

                      <div className="bg-surface p-2.5 rounded-xl border border-gray-150 space-y-1">
                        {claim.claimedItems.map((ci, idx) => (
                          <div key={idx} className="text-[11px] font-semibold text-gray-700 flex justify-between">
                            <span>{ci.title}</span>
                            <span className="text-brand-700 bg-brand-50 border border-brand-100 px-1 py-0.2 rounded text-[9px]">{ci.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => triggerChat(claim._id, claim.listing?.donor?.name)}
                        className="flex-1 py-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-xl transition-all flex justify-center items-center gap-1.5"
                      >
                        <MessageSquare size={14} /> Coordinate Chat
                      </button>
                      <button
                        onClick={() => copyToClipboard(claim.verificationPin)}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-500 hover:text-brand-700"
                        title="Copy Handover PIN"
                      >
                        {copiedPin ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* PENDING REVIEWS BANNER */}
        <AnimatePresence>
          {pendingReviews.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 space-y-3 text-left"
            >
              <h2 className="text-sm font-extrabold text-brand-900 flex items-center gap-2 px-1">
                <Star className="text-amber-500 fill-current" size={16} /> Rate Your Recent Pickups
              </h2>
              {pendingReviews.map(review => (
                <div key={review._id} className="bg-gradient-to-r from-amber-500/5 to-orange-500/10 border border-amber-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-bold text-sm text-brand-955">How was the donation handover?</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Please rate <strong>{review.listing?.donor?.name}</strong> for: {review.listing?.title}</p>
                  </div>
                  <div className="flex gap-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => handleRating(review._id, review.listing?._id, star)}
                        className="p-2 bg-white rounded-xl border border-gray-150 hover:border-amber-400 hover:scale-105 hover:bg-amber-50/20 active:scale-95 transition-all shadow-sm text-amber-400 hover:text-amber-500"
                      >
                        <Star size={20} className="fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        {/* RADAR GRIDS */}
        <section className="text-left space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-display font-extrabold text-brand-900">
              Radar Listings ({filteredListings.length})
            </h3>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              10KM RADIUS
            </span>
          </div>

          {/* LOADING & EMPTY STATES */}
          {locating && (
            <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-150 rounded-3xl space-y-3">
              <Navigation size={36} className="text-brand-500 animate-bounce" />
              <p className="text-xs font-semibold text-gray-500">Acquiring GPS location lock...</p>
            </div>
          )}

          {!locating && loading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <h2 className="text-base font-bold text-gray-700">Radar Area Clear</h2>
              <p className="text-xs text-gray-400 mt-1">No surplus meals available within this range.</p>
            </div>
          )}

          {/* ACTIVE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item, index) => {
              const timer = getExpiryLabel(item.expiryTime, item.isCritical);
              const selectedCount = (selectedItems[item._id] || []).length;
              return (
                <motion.div 
                  key={item._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-3xl p-6 shadow-soft border flex flex-col justify-between hover:-translate-y-1 hover:shadow-glow transition-all duration-300 relative overflow-hidden ${
                    item.isCritical ? 'border-red-200 shadow-glow-emerald ring-2 ring-red-400/25' : 'border-gray-150 hover:border-brand-500/35'
                  }`}
                >
                  {/* Glowing warning tag for critical listings */}
                  {item.isCritical && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 flex items-center gap-1 rounded-bl-xl shadow-sm">
                      <AlertTriangle size={10} /> Critical
                    </div>
                  )}

                  <div>
                    {/* Top tags */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-md ${
                        item.foodType === 'VEG' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {item.foodType}
                      </span>
                      <span className={`px-2.5 py-1 text-[10px] font-semibold border rounded-md ${timer.color}`}>
                        <Clock size={12} className="inline mr-1" />
                        {timer.label}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-gray-900 leading-snug mb-1.5">{item.donor.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>

                    {/* Checkbox item selections for partial claims */}
                    {item.items && item.items.length > 0 && (
                      <div className="bg-surface p-3 rounded-2xl border border-gray-150 space-y-2 mb-4">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 text-left">
                          Check Items to Claim:
                        </p>
                        {item.items.map((subItem) => {
                          const isClaimed = subItem.status === 'CLAIMED' || subItem.status === 'COMPLETED';
                          const isChecked = (selectedItems[item._id] || []).includes(subItem._id.toString());
                          
                          return (
                            <label 
                              key={subItem._id} 
                              className={`flex items-center justify-between text-xs font-semibold p-2 rounded-xl border transition-all ${
                                isClaimed 
                                  ? 'opacity-50 line-through bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' 
                                  : isChecked 
                                    ? 'border-brand-500 bg-brand-50/10 text-brand-900' 
                                    : 'border-transparent hover:bg-gray-50 text-gray-750 cursor-pointer'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  disabled={isClaimed}
                                  checked={isChecked}
                                  onChange={() => toggleItemSelection(item._id, subItem._id.toString())}
                                  className="w-3.5 h-3.5 text-brand-500 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                                />
                                <span>{subItem.title}</span>
                              </span>
                              <span className="text-[9px] text-gray-450 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                {subItem.quantity}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-2.5 mb-6 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center text-xs text-gray-600 truncate">
                          <MapPin size={14} className="mr-2.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate font-semibold text-gray-700">{item.address}</span>
                        </div>
                        
                        {/* Rating block */}
                        {item.donor.totalRatings > 0 ? (
                          <div className="flex items-center text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-150 flex-shrink-0">
                            <Star size={10} className="mr-0.5 fill-current text-amber-500" />
                            {Number(item.donor.rating).toFixed(1)} 
                            <span className="text-gray-400 ml-0.5 font-normal">({item.donor.totalRatings})</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50/50 px-2 py-0.5 rounded border border-brand-100/50 flex-shrink-0">
                            New Donor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Claim Button */}
                  {claimStatus.id === item._id && claimStatus.pin ? (
                    <div className="bg-brand-50/65 rounded-2xl p-4 text-center border border-brand-100">
                      <p className="text-[10px] text-brand-700 font-extrabold uppercase tracking-widest mb-1.5">
                        Verification PIN
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl font-display font-black tracking-widest text-brand-900 pl-4">
                          {claimStatus.pin}
                        </span>
                        <button
                          onClick={() => copyToClipboard(claimStatus.pin)}
                          className="p-1.5 text-brand-600 hover:bg-brand-100 rounded-lg transition-all"
                        >
                          {copiedPin ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium leading-tight mt-2">
                        Present this PIN to donor at dropoff
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleClaim(item._id)}
                      disabled={claimStatus.loading}
                      className="w-full bg-brand-800 hover:bg-brand-900 text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-all shadow-md flex justify-center items-center gap-2"
                    >
                      {claimStatus.loading && claimStatus.id === item._id ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          {selectedCount > 0 ? `Claim ${selectedCount} Selected` : 'Claim Available'}
                        </>
                      )}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

      </main>

      {/* CHAT DRAWER PORTAL CONTAINER */}
      <ChatDrawer 
        pickupId={chatPickupId} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        partnerName={chatPartnerName} 
      />
    </div>
  );
};

export default DashboardNGO;