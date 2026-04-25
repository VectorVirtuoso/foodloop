import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, ShieldCheck, CheckCircle, Store, Truck, Sparkles, PlusCircle, Trash, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client'; // <-- NEW
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PinInput from '../components/PinInput';
import ChatDrawer from '../components/ChatDrawer';

const DashboardDonor = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Active pickups & state
  const [activePickups, setActivePickups] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);

  // Dynamic multi-item list state
  const [itemsList, setItemsList] = useState([{ title: '', quantity: '' }]);

  // Chat coordination state
  const [chatPickupId, setChatPickupId] = useState(null);
  const [chatPartnerName, setChatPartnerName] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: '', foodType: 'VEG',
    expiryTime: '', pickupWindowStart: '', pickupWindowEnd: '',
    isFreshlyPrepared: false, storedCorrectly: false, hygieneVerified: false,
  });

  const fetchPickups = async () => {
    try {
      const { data } = await API.get('/pickups/active');
      setActivePickups(data.data);
    } catch (err) {
      console.error("Failed to fetch pickups", err);
    }
  };

  // 1. Fetch active handovers & listen for Socket alerts
  useEffect(() => {
    fetchPickups();

    // Setup private WebSocket room for instant claim arrivals
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    
    // Register private room
    socket.emit('registerUser', user._id);

    // Listen for incoming claim handovers
    socket.on('incomingPickup', (newPickup) => {
      console.log("Incoming Claim Detected live via Websocket:", newPickup);
      setActivePickups((prev) => {
        // Prevent duplicate loads
        if (prev.some(p => p._id === newPickup._id)) return prev;
        return [newPickup, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user._id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const setFoodType = (type) => {
    setFormData({ ...formData, foodType: type });
  };

  // Multi-item list helpers
  const handleItemChange = (index, field, value) => {
    const updated = [...itemsList];
    updated[index][field] = value;
    setItemsList(updated);
  };

  const addItemRow = () => {
    setItemsList([...itemsList, { title: '', quantity: '' }]);
  };

  const removeItemRow = (index) => {
    if (itemsList.length === 1) return;
    setItemsList(itemsList.filter((_, i) => i !== index));
  };

  const handleVerifyPin = async (pickupId, pin) => {
    setVerifyingId(pickupId);
    try {
      await API.post(`/pickups/verify/${pickupId}`, { pin });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
      fetchPickups();
    } catch (err) {
      alert(err.response?.data?.message || "Invalid PIN. Please try again.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate items
      const cleanItems = itemsList.filter(item => item.title.trim() && item.quantity.trim());
      if (cleanItems.length === 0) {
        setError("Please add at least one valid item in your list.");
        setIsLoading(false);
        return;
      }

      const mainTitle = cleanItems.map(item => `${item.quantity} ${item.title}`).join(', ');
      const mainQty = `${cleanItems.length} items total`;

      await API.post('/listings', {
        ...formData,
        title: mainTitle,
        quantity: mainQty,
        items: cleanItems
      });

      setSuccess(true);
      setFormData({
        description: '', foodType: 'VEG',
        expiryTime: '', pickupWindowStart: '', pickupWindowEnd: '',
        isFreshlyPrepared: false, storedCorrectly: false, hygieneVerified: false,
      });
      setItemsList([{ title: '', quantity: '' }]);
      setTimeout(() => setSuccess(false), 4500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post food listing. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerChat = (pickupId, ngoName) => {
    setChatPickupId(pickupId);
    setChatPartnerName(ngoName);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        
        {/* WELCOME BANNER */}
        <div className="bg-gradient-to-r from-brand-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15)_0%,transparent_60%)]" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full mb-3 inline-block">
                Terminal Live
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
                Hello, {user?.name || 'Partner'}
              </h2>
              <p className="text-emerald-100/70 text-sm mt-1 font-medium">
                Create new surplus listings or coordinate and verify NGO driver collections below.
              </p>
            </div>
            <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl hidden md:block">
              <Store size={36} className="text-brand-300" />
            </div>
          </div>
        </div>

        {/* TWO-COLUMN SIDE-BY-SIDE GRID (Desktop) / STACKED (Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: POST SURPLUS FOOD FORM (7 cols on desktop) */}
          <section className="lg:col-span-7 bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-soft text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <PlusCircle size={120} className="text-brand-500" />
            </div>
            
            <div className="mb-6 pb-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-extrabold text-brand-900">Post Surplus Food</h2>
                <p className="text-gray-500 text-xs font-semibold mt-1">
                  List multiple food items. Proximity alerts will trigger automatically.
                </p>
              </div>
              <div className="text-brand-500 bg-brand-50 p-2 rounded-xl">
                <Sparkles size={20} />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl text-xs font-semibold mb-6">
                {error}
              </div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-brand-50 text-brand-700 border border-brand-100 p-4 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2"
              >
                <CheckCircle size={18} className="text-brand-500" /> Transaction complete! Food listing broadcasted live.
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
               {/* Section 1: Multi-Item Array Form List */}
               <div className="space-y-4">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-800/80">
                  Surplus Food Items List
                </label>
                
                <div className="space-y-3">
                  {itemsList.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Item Title (e.g. Rice & Curry)" 
                          value={item.title}
                          onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                          required
                          className="w-full bg-surface/60 px-4 py-2.5 rounded-xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 transition-all text-xs font-semibold text-brand-900"
                        />
                        <input 
                          type="text" 
                          placeholder="Quantity (e.g. Serves 20)" 
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          className="w-full bg-surface/60 px-4 py-2.5 rounded-xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 transition-all text-xs font-semibold text-brand-900"
                        />
                      </div>
                      {itemsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl text-xs font-bold transition-all border border-brand-100"
                >
                  <PlusCircle size={14} />
                  Add Another Item
                </button>
               </div>

               {/* Classification */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-800/80 mb-2">
                      Dietary Classification
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFoodType('VEG')}
                        className={`py-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          formData.foodType === 'VEG'
                            ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700 font-extrabold'
                            : 'border-gray-150 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Vegetarian
                      </button>
                      <button
                        type="button"
                        onClick={() => setFoodType('NON-VEG')}
                        className={`py-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          formData.foodType === 'NON-VEG'
                            ? 'border-amber-500 bg-amber-50/20 text-amber-700 font-extrabold'
                            : 'border-gray-150 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Non-Veg
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-800/80 mb-2">
                      Allergens & Pickup Notes
                    </label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      placeholder="Allergen details, packaging tips, or gate codes..." 
                      rows="1" 
                      required 
                      className="w-full bg-surface/60 px-4 py-3 rounded-xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 transition-all text-xs font-semibold text-brand-900"
                    />
                  </div>
               </div>

              {/* Time windows */}
              <div className="bg-brand-50/45 p-5 rounded-2xl border border-brand-100/60 space-y-4">
                <div className="flex items-center gap-2 text-brand-950 font-bold text-xs uppercase tracking-wider">
                  <Clock size={16} className="text-brand-500" /> Logistics & Time Window
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-brand-800 uppercase pl-1 mb-1">
                    Absolute Expiry Limit
                  </label>
                  <input 
                    type="datetime-local" 
                    name="expiryTime" 
                    value={formData.expiryTime} 
                    onChange={handleChange} 
                    required 
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-gray-150 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-800 uppercase pl-1 mb-1">
                      Pickup Window Start
                    </label>
                    <input 
                      type="datetime-local" 
                      name="pickupWindowStart" 
                      value={formData.pickupWindowStart} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-gray-150 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-800 uppercase pl-1 mb-1">
                      Pickup Window End
                    </label>
                    <input 
                      type="datetime-local" 
                      name="pickupWindowEnd" 
                      value={formData.pickupWindowEnd} 
                      onChange={handleChange} 
                      required 
                      className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-gray-150 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" 
                    />
                  </div>
                </div>
              </div>

              {/* Safety declarations */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={16} className="text-brand-500" /> Food Safety Declarations
                </div>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { name: 'isFreshlyPrepared', label: 'Food is prepared fresh (not table leftovers or touched plate food)' },
                    { name: 'storedCorrectly', label: 'Maintained at regulated hot/cold temperatures (refrigerated/insulated hot cases)' },
                    { name: 'hygieneVerified', label: 'Handled under certified sanitization and kitchen hygiene rules' }
                  ].map((item) => (
                    <label 
                      key={item.name} 
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        formData[item.name] 
                          ? 'border-brand-500 bg-brand-50/5 text-brand-900 font-medium' 
                          : 'border-transparent hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        name={item.name} 
                        checked={formData[item.name]} 
                        onChange={handleChange} 
                        className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500 cursor-pointer" 
                      />
                      <span className="text-xs text-left">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-brand-800 hover:bg-brand-900 text-white font-bold py-4 rounded-2xl active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none text-base"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Listing surplus food...</span>
                  </>
                ) : (
                  <>
                    <Package size={20} />
                    List Food on Live Radar
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT COLUMN: ACTIVE HANDOVERS QUEUE (5 cols on desktop) */}
          <section className="lg:col-span-5 space-y-4 text-left">
            <h2 className="text-lg font-display font-extrabold text-brand-900 flex items-center gap-2 px-1">
              <Truck size={20} className="text-brand-500" /> Active Deliveries ({activePickups.length})
            </h2>

            {activePickups.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-gray-400 shadow-soft">
                <Truck size={36} className="mx-auto mb-2 opacity-45" />
                <p className="text-xs font-bold">No active collections</p>
                <p className="text-[10px] opacity-75 max-w-[200px] mx-auto mt-1">Handovers appear here instantly when claimed by an NGO.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {activePickups.map((pickup) => (
                    <motion.div 
                      key={pickup._id} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layoutId={pickup._id}
                      className="bg-white border border-gray-150 rounded-2xl p-5 shadow-soft flex flex-col gap-4 relative overflow-hidden hover:border-brand-500/25 transition-all"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold bg-brand-50 text-brand-600 border border-brand-100 px-2 py-0.5 rounded uppercase tracking-wider">
                            Ready for Handover
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping" />
                        </div>
                        
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900 leading-snug">{pickup.ngo.name}</h3>
                          <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Contact: {pickup.ngo.phone}</p>
                        </div>

                        {/* Display items claimed */}
                        {pickup.claimedItems && pickup.claimedItems.length > 0 ? (
                          <div className="bg-surface p-2.5 rounded-xl border border-gray-150 space-y-1 text-left">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                              Claimed Items:
                            </p>
                            {pickup.claimedItems.map((ci, idx) => (
                              <div key={idx} className="text-[11px] font-semibold text-gray-700 flex justify-between">
                                <span>{ci.title}</span>
                                <span className="text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded text-[10px] border border-brand-100/50 font-bold">{ci.quantity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 font-semibold flex items-center gap-1.5">
                            <Package size={16} className="text-gray-400" /> {pickup.listing.title} ({pickup.listing.quantity})
                          </p>
                        )}
                      </div>
                      
                      {/* OTP Segment PIN Input & Chat coordination buttons */}
                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-150 flex flex-col items-center gap-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                          Enter 4-Digit NGO PIN
                        </span>
                        
                        {verifyingId === pickup._id ? (
                          <div className="h-14 flex items-center justify-center">
                            <span className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></span>
                          </div>
                        ) : (
                          <PinInput 
                            length={4} 
                            onComplete={(pin) => handleVerifyPin(pickup._id, pin)} 
                          />
                        )}
                        
                        <div className="flex gap-2 w-full mt-2 border-t border-gray-100 pt-3">
                          <button
                            onClick={() => triggerChat(pickup._id, pickup.ngo.name)}
                            className="flex-1 py-2 text-xs font-bold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-lg transition-all flex justify-center items-center gap-1.5"
                          >
                            <MessageSquare size={13} />
                            Chat with NGO
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

        </div>

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

export default DashboardDonor;