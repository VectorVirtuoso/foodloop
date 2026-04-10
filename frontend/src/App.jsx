// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardNGO from './pages/DashboardNGO';
import DashboardDonor from './pages/DashboardDonor';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

// The Traffic Cop Component
const DashboardRouter = () => {
  const { user } = useContext(AuthContext);
  
  if (user?.role === 'NGO') return <DashboardNGO />;
  if (user?.role === 'DONOR') return <DashboardDonor />;
  
  return <Navigate to="/login" />;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Routes>
      {/* If logged in, go to dashboard. If not, show login */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      
      {/* Protect the dashboard route and let the Traffic Cop handle the specific view */}
      <Route path="/dashboard" element={user ? <DashboardRouter /> : <Navigate to="/login" />} />
      
      {/* NEW: Protect the analytics route */}
      <Route path="/analytics" element={user ? <AnalyticsDashboard /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;