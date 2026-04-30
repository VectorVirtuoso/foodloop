import { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { Send, X, MessageSquare, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const ChatDrawer = ({ pickupId, isOpen, onClose, partnerName }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const chatBottomRef = useRef(null);

  // Fetch Message history & setup socket
  useEffect(() => {
    if (!isOpen || !pickupId) return;

    setIsChatClosed(false);
    setLoading(true);

    // 1. Fetch old history
    const fetchHistory = async () => {
      try {
        const { data } = await API.get(`/chat/history/${pickupId}`);
        setMessages(data.data);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // 2. Initialize Socket Connection
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('joinChat', { pickupId });

    // Listen for new messages
    newSocket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for chat termination (PIN verified)
    newSocket.on('chatClosed', () => {
      setIsChatClosed(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, pickupId]);

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || isChatClosed) return;

    socket.emit('sendMessage', {
      pickupId,
      senderId: user._id,
      message: inputText.trim(),
    });
    setInputText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Chat Panel Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-gray-150 shadow-2xl z-50 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <div className="bg-brand-50 p-2 rounded-xl text-brand-500">
                  <MessageSquare size={18} />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-extrabold text-sm text-brand-900 leading-none mb-1">
                    Pickup Coordination
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Partner: {partnerName || 'Loading...'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/50">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <MessageSquare size={32} className="opacity-40" />
                  <p className="text-xs font-semibold">Coordination chat room is active.</p>
                  <p className="text-[10px] opacity-80 text-center max-w-[200px]">Send a message to coordinate gate codes, packaging, or arrival times.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div 
                      key={msg._id || Math.random()} 
                      className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1 px-1">
                        {isMe ? 'You' : msg.sender.name}
                      </span>
                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                        isMe 
                          ? 'bg-brand-800 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-150 text-brand-900 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[8px] text-gray-400 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-gray-150 bg-white">
              {isChatClosed ? (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex items-center gap-2 text-xs font-semibold text-left">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>Handover completed. This chat session is closed.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type coordination message..."
                    className="flex-1 bg-surface px-4 py-2.5 rounded-xl border border-gray-150 text-xs font-semibold focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;
