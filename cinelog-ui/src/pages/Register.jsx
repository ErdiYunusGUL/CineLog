import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/Auth/register', { username, email, password });
            setMessage(response.data.message);
            setError('');
            // 2 saniye sonra giriş sayfasına at
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Kayıt başarısız.");
            setMessage('');
        }
    };

    return (
        <div className="row justify-content-center mt-5">
            <div className="col-md-4">
                <div className="card shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: 'none' }}>
                    <div className="card-body p-4">
                        <h3 className="text-center text-light mb-4">Yeni Kayıt</h3>
                        {error && <div className="alert alert-danger">{error}</div>}
                        {message && <div className="alert alert-success">{message}</div>}
                        <form onSubmit={handleRegister}>
                            <div className="mb-3">
                                <label className="text-light">Kullanıcı Adı</label>
                                <input type="text" className="form-control bg-dark text-light border-secondary" required 
                                    value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
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
                            <button type="submit" className="btn btn-danger w-100">Kayıt Ol</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
