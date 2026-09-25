import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import PersonDetail from './pages/PersonDetail';
import Discover from './pages/Discover';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Community from './pages/Community';
import PublicProfile from './pages/PublicProfile';
import Stats from './pages/Stats';
import AdminDashboard from './pages/AdminDashboard';
import AIMatchmaker from './pages/AIMatchmaker';
import CineBot from './components/CineBot';
import { Header1 } from './components/ui/header'; // YENİ MODERN HEADER
import api from './api';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp < currentTime) {
            // Token süresi dolmuşsa çıkış yap
            localStorage.removeItem('token');
            setUser(null);
        } else {
            const userRole = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
            setUser({ username: decoded.unique_name, role: userRole });
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = "/";
  };

  return (
    <Router>
      {/* 21st.dev Tailwind + Shadcn Modern Header */}
      <Header1 user={user} handleLogout={handleLogout} />

      <div className="container mt-24 mb-5 pt-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setAuthUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/person/:id" element={<PersonDetail />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/community" element={<Community />} />
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/matchmaker" element={<AIMatchmaker />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/stats" element={<Stats />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
        </Routes>
      </div>

      <CineBot />
    </Router>
  );
}

export default App;


