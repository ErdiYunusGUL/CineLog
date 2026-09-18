import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import Discover from './pages/Discover';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Community from './pages/Community';
import PublicProfile from './pages/PublicProfile';
import Stats from './pages/Stats';
import AdminDashboard from './pages/AdminDashboard'; // YENÝ
import CineBot from './components/CineBot';
import api from './api';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Microsoft Role Claim Type'ý "role" veya uzun schema adý olarak gelebiliyor
        const userRole = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
        setUser({ username: decoded.unique_name, role: userRole });
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
      <nav className="navbar navbar-expand-lg navbar-dark navbar-glass mb-4 sticky-top shadow-sm py-3">
        <div className="container">
          <Link className="navbar-brand text-danger fw-bold fs-4 text-glow" to="/"><i className="bi bi-film"></i> CineLog</Link>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link text-light ms-4" to="/discover"><i className="bi bi-compass"></i> Keþfet</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-info ms-4" to="/community"><i className="bi bi-people-fill"></i> Topluluk</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-warning ms-4" to="/onboarding"><i className="bi bi-magic"></i> Sinema Profili</Link>
              </li>
            </ul>
            
            <form className="d-flex me-4 w-50" onSubmit={(e) => { e.preventDefault(); window.location.href = `/?search=${e.target.search.value}`; }}>
              <input name="search" className="form-control form-control-sm bg-dark text-light border-secondary" type="search" placeholder="Film Ara..." aria-label="Search" />
              <button className="btn btn-outline-danger btn-sm ms-2" type="submit"><i className="bi bi-search"></i></button>
            </form>

            {user ? (
              <div className="d-flex align-items-center">
                {user.role === 'Admin' && (
                  <Link className="btn btn-danger btn-sm me-3 fw-bold" to="/admin">
                      <i className="bi bi-shield-lock-fill"></i> Admin Paneli
                  </Link>
                )}
                <Link className="btn btn-outline-info btn-sm me-3" to="/profile">
                    <i className="bi bi-person-circle"></i> Profilim
                </Link>
                <span className="text-light me-3">Hoþgeldin, {user.username}</span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Çýkýþ Yap</button>
              </div>
            ) : (
              <div className="d-flex align-items-center flex-shrink-0">
                <Link to="/login" className="btn btn-outline-danger btn-sm me-2">Giriþ Yap</Link>
                <Link to="/register" className="btn btn-danger btn-sm">Kayýt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container mt-4 mb-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setAuthUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/community" element={<Community />} />
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route path="/onboarding" element={<Onboarding />} />
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
