import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, LogOut, Activity, LayoutDashboard, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    {
      label: user?.role === 'NGO' ? 'Live Radar' : 'Donor Terminal',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      label: 'Impact Report',
      path: '/analytics',
      icon: Activity
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-4">
      <nav className="max-w-7xl mx-auto bg-white/70 border border-white/40 shadow-soft backdrop-blur-md rounded-2xl md:rounded-3xl px-6 py-3 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="bg-brand-500 text-white p-2 rounded-xl shadow-glow group-hover:scale-105 transition-all duration-300">
            <Leaf size={20} className="fill-current" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-brand-900 group-hover:text-brand-700 transition-colors">
            Food<span className="text-brand-500 font-extrabold">Loop</span>
          </span>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-1.5 bg-gray-100/55 p-1.5 rounded-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
                  active 
                    ? 'text-brand-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(6,78,59,0.03)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={16} className={`relative z-10 ${active ? 'text-brand-500' : 'text-gray-400'}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* PROFILE CARD & LOGOUT */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-gray-150">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold font-display text-brand-700 text-base shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-brand-900 leading-none mb-1">{user?.name}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100/60 max-w-fit leading-none">
                {user?.role}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 group"
            title="Log Out"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-500 hover:text-brand-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute left-4 right-4 mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg p-5 flex flex-col gap-4 md:hidden z-40"
          >
            {/* User Info mobile */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center font-bold font-display text-brand-700">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-brand-900 leading-none mb-1">{user?.name}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-500 bg-brand-50 px-2 py-0.5 rounded border border-brand-100/60 max-w-fit">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${
                      active 
                        ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-500' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-brand-500' : 'text-gray-400'} />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Logout Mobile */}
            <button
              onClick={handleLogout}
              className="mt-2 w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
