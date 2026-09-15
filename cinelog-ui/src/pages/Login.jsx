import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/Auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            // Anasayfaya yönlendir ve sayfayı yenile ki üst menü güncellensin
            window.location.href = "/"; 
        } catch (err) {
            setError(err.response?.data?.message || "Giriş başarısız.");
        }
    };

    return (
        <div className="row justify-content-center mt-5">
            <div className="col-md-4">
                <div className="card shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: 'none' }}>
                    <div className="card-body p-4">
                        <h3 className="text-center text-light mb-4">Giriş Yap</h3>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleLogin}>
                            <div className="mb-3">
                                <label className="text-light">E-posta</label>
                                <input type="email" className="form-control bg-dark text-light border-secondary" required 
                                    value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <label className="text-light">Şifre</label>
                                <input type="password" className="form-control bg-dark text-light border-secondary" required 
                                    value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-danger w-100">Giriş Yap</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
