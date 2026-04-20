import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Building, Navigation, ArrowRight, Store, Heart, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'DONOR', 
    phone: '', address: '', latitude: '', longitude: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setRole = (role) => {
    setFormData({ ...formData, role });
  };

  const getLocation = () => {
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocating(false);
      },
      (err) => {
        console.error(err);
        setError("Location access denied or timed out. Please enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Quick validation
    if (!formData.latitude || !formData.longitude) {
      setError("Please detect or enter your location coordinates. This is required for proximity matching.");
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please check all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 py-12 overflow-hidden bg-surface">
      {/* FLOATING AMBIENT BACKGROUND GRADIENT BLOBS */}
      <div className="absolute top-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-brand-200/40 blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-300/25 blur-[120px] animate-float-reverse pointer-events-none" />

      {/* INNER CONTENT */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-2xl p-8 sm:p-10 rounded-3xl bg-white/70 border border-white/60 shadow-soft backdrop-blur-md"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-brand-500 text-white p-3 rounded-2xl shadow-glow mb-4 hover:scale-105 transition-transform duration-300">
            <Building size={28} />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-brand-900 tracking-tight leading-none mb-2">
            Join FoodLoop
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Create your zero-waste organization profile
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl text-xs font-semibold text-center mb-6"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          
          {/* INTERACTIVE ROLE CARDS */}
          <div className="space-y-2">
            <label className="block text-xs uppercase font-extrabold tracking-wider text-brand-800/80 mb-2">
              Select Profile Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Donor Card */}
              <div 
                onClick={() => setRole('DONOR')}
                className={`cursor-pointer group p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 relative overflow-hidden bg-white/60 ${
                  formData.role === 'DONOR' 
                    ? 'border-brand-500 bg-brand-50/20 shadow-sm shadow-brand-500/10' 
                    : 'border-gray-150 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                  formData.role === 'DONOR' ? 'bg-brand-500 text-white shadow-glow' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                }`}>
                  <Store size={22} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-sm text-brand-900 leading-snug">Food Donor</h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">Restaurants, cafeterias, markets posting surplus food.</p>
                </div>
                {formData.role === 'DONOR' && (
                  <CheckCircle2 size={18} className="absolute top-4 right-4 text-brand-500" />
                )}
              </div>

              {/* NGO Card */}
              <div 
                onClick={() => setRole('NGO')}
                className={`cursor-pointer group p-5 rounded-2xl border-2 transition-all duration-300 flex items-start gap-4 relative overflow-hidden bg-white/60 ${
                  formData.role === 'NGO' 
                    ? 'border-brand-500 bg-brand-50/20 shadow-sm shadow-brand-500/10' 
                    : 'border-gray-150 hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                  formData.role === 'NGO' ? 'bg-brand-500 text-white shadow-glow' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                }`}>
                  <Heart size={22} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-sm text-brand-900 leading-snug">Receiver / NGO</h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">Shelters, pantries, food drives claiming meals.</p>
                </div>
                {formData.role === 'NGO' && (
                  <CheckCircle2 size={18} className="absolute top-4 right-4 text-brand-500" />
                )}
              </div>
            </div>
          </div>

          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="group relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input type="text" name="name" placeholder="Organization Name" onChange={handleChange} required value={formData.name}
                className="w-full bg-surface/80 pl-12 pr-4 py-3 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium" />
            </div>

            <div className="group relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required value={formData.email}
                className="w-full bg-surface/80 pl-12 pr-4 py-3 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium" />
            </div>

            <div className="group relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} required value={formData.phone}
                className="w-full bg-surface/80 pl-12 pr-4 py-3 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium" />
            </div>

            <div className="group relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input type="password" name="password" placeholder="Password" onChange={handleChange} required value={formData.password}
                className="w-full bg-surface/80 pl-12 pr-4 py-3 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium" />
            </div>
          </div>

          <div className="group relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input type="text" name="address" placeholder="Full Street Address" onChange={handleChange} required value={formData.address}
              className="w-full bg-surface/80 pl-12 pr-4 py-3 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm font-medium" />
          </div>

          {/* COORDINATES DETECTOR */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-brand-50/45 p-4 rounded-2xl border border-brand-100/60 shadow-inner">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600/80 pl-1">Latitude</span>
                <input 
                  type="number" 
                  step="any" 
                  name="latitude" 
                  placeholder="e.g. 19.1136" 
                  value={formData.latitude} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-gray-150 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" 
                />
              </div>
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-600/80 pl-1">Longitude</span>
                <input 
                  type="number" 
                  step="any" 
                  name="longitude" 
                  placeholder="e.g. 72.8397" 
                  value={formData.longitude} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-gray-150 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" 
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={getLocation} 
              disabled={locating}
              className="px-5 py-4 sm:py-0 sm:h-full flex flex-row sm:flex-col items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm font-bold disabled:opacity-75 disabled:pointer-events-none"
            >
              <Navigation size={18} className={locating ? "animate-pulse" : ""} />
              <span className="text-xs">{locating ? 'Locating...' : 'Auto Detect'}</span>
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-800 text-white font-bold py-4 rounded-2xl hover:bg-brand-900 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none mt-4 group"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Creating Ecosystem...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700 transition-colors hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;