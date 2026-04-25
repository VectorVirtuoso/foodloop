import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Star, CheckCircle, Activity, Calendar, ArrowLeft, TrendingUp, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await API.get('/analytics');
        setData(response.data.data);
      } catch (err) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-red-500 font-bold p-6">
        {error}
      </div>
    );
  }

  // Dietary values mapping for the Pie/Donut Chart colors
  const dietaryData = data.charts.dietaryBreakdown.map((item) => {
    const fill = item.name === 'Vegetarian' ? '#10b981' : '#f59e0b';
    return { ...item, fill };
  });

  return (
    <div className="min-h-screen bg-surface pb-16 text-left">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        
        {/* BACK ACTION & HEADER */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2.5 bg-white border border-gray-150 text-gray-500 hover:text-brand-900 hover:border-gray-300 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-brand-900 tracking-tight leading-tight">
              Impact Analytics
            </h1>
            <p className="text-gray-500 text-xs font-semibold mt-0.5">
              Live statistics showing your carbon footprint offset and rescued food volume
            </p>
          </div>
        </div>

        {/* 1. HERO METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Rescues */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br from-emerald-600 to-teal-800 shadow-lg border border-emerald-500/20 ${user?.role === 'NGO' ? 'md:col-span-2' : ''}`}
          >
            {/* Ambient glows inside cards */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100/80 bg-white/10 px-2.5 py-1 rounded-md">
                  Active Rescues
                </span>
                <h2 className="text-5xl sm:text-6xl font-display font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] pt-2">
                  {data.hero.totalHandovers}
                </h2>
              </div>
              <div className="bg-white/10 border border-white/10 p-3 rounded-2xl">
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-emerald-100/70 mt-6 font-medium">
              Verified food handovers successfully routed and claimed.
            </p>
          </motion.div>

          {/* Trust Score (Only Visible to Donors) */}
          {user?.role === 'DONOR' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.05 }} 
              className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg border border-amber-400/20"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08)_0%,transparent_50%)]" />
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-100/80 bg-white/10 px-2.5 py-1 rounded-md">
                    Trust Rating
                  </span>
                  <h2 className="text-5xl sm:text-6xl font-display font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] pt-2">
                    {Number(data.hero.trustScore).toFixed(1)}
                  </h2>
                </div>
                <div className="bg-white/10 border border-white/10 p-3 rounded-2xl">
                  <Star size={24} className="text-white fill-current" />
                </div>
              </div>
              <p className="text-xs text-amber-100/70 mt-6 font-medium">
                Calculated based on positive reviews left by verified NGO drivers.
              </p>
            </motion.div>
          )}
        </div>

        {/* 2. VISUAL GRAPH CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Meals Rescued over last 7 days */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.1 }} 
            className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft lg:col-span-2"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-display font-extrabold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-500" /> Meals Saved (Last 7 Days)
              </h3>
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400">
                DAILY VOLUME
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.impactOverTime} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dx={-5} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(240,253,244,0.3)' }} 
                    contentStyle={{ borderRadius: '14px', border: '1px solid rgba(16,185,129,0.1)', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', backgroundColor: '#ffffff', padding: '12px' }} 
                  />
                  <Bar dataKey="meals" fill="url(#barColor)" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Dietary Breakdown */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.15 }} 
            className="bg-white rounded-3xl p-6 border border-gray-150 shadow-soft flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-display font-extrabold text-gray-900 flex items-center gap-2">
                  <Compass size={18} className="text-brand-500" /> Dietary Breakdown
                </h3>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400">
                  RATIO
                </span>
              </div>
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={dietaryData} 
                      innerRadius={55} 
                      outerRadius={75} 
                      paddingAngle={5} 
                      dataKey="value" 
                      stroke="none"
                    >
                      {dietaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Visual indicator in center of donut */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-display font-black text-brand-950">
                    {data.charts.dietaryBreakdown.reduce((acc, curr) => acc + curr.value, 0)}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    LISTINGS
                  </span>
                </div>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="flex justify-center gap-6 mt-2 pt-4 border-t border-gray-100">
              {dietaryData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 3. TRANSACTION TIMELINE / LEDGER */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-soft"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-base font-display font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-brand-500" /> Recent Handovers Ledger
            </h3>
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-gray-400">
              TIMELINE
            </span>
          </div>

          {data.ledger.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-xs font-semibold">No recent transactions to display yet.</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-brand-100 space-y-8 text-left">
              {data.ledger.map((item) => (
                <div key={item.id} className="relative space-y-2">
                  
                  {/* Glowing Node Point on timeline */}
                  <span className="absolute -left-[31px] top-1 flex items-center justify-center w-4 h-4 bg-white rounded-full border-2 border-brand-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                  </span>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-surface rounded-2xl border border-gray-150 gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 leading-snug">{item.title}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Partner Organization: <strong>{item.partnerName}</strong>
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 mt-2 sm:mt-0">
                      <span className="bg-brand-50 text-brand-700 border border-brand-100 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                        {item.quantity}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-2 sm:pl-0">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        
      </main>
    </div>
  );
};

export default AnalyticsDashboard;