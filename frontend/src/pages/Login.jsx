import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Mail, Lock, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-surface">
      {/* FLOATING AMBIENT BACKGROUND GRADIENT BLOBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-200/40 blur-[120px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-brand-300/25 blur-[120px] animate-float-reverse pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[35%] h-[35%] rounded-full bg-amber-100/40 blur-[100px] animate-float-slow pointer-events-none" />

      {/* INNER CONTENT */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px] p-8 sm:p-10 rounded-3xl bg-white/70 border border-white/60 shadow-soft backdrop-blur-md"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-brand-500 text-white p-3 rounded-2xl shadow-glow mb-4 hover:scale-105 transition-transform duration-300">
            <Leaf size={28} className="fill-current" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-brand-900 tracking-tight leading-none mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Sign in to the FoodLoop platform
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

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email input field */}
          <div className="group relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-250" size={18} />
            <input 
              type="email" 
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface/80 pl-12 pr-4 py-3.5 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all duration-250 text-sm font-medium placeholder:text-gray-400 text-brand-900"
            />
          </div>

          {/* Password input field */}
          <div className="group relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors duration-250" size={18} />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-surface/80 pl-12 pr-4 py-3.5 rounded-2xl border border-gray-150 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all duration-250 text-sm font-medium placeholder:text-gray-400 text-brand-900"
            />
          </div>

          {/* Login Submit button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-800 text-white font-bold py-4 rounded-2xl hover:bg-brand-900 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none mt-2 group"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700 transition-colors hover:underline underline-offset-4">
            Register your organization
          </Link>
        </p>

        {/* ECO BRAND FOOTER */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center gap-6 text-[10px] uppercase tracking-wider font-bold text-gray-400/80">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-brand-500" /> Secure Encryption
          </span>
          <span className="flex items-center gap-1">
            <Heart size={12} className="text-brand-500 fill-current" /> Zero Waste
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;