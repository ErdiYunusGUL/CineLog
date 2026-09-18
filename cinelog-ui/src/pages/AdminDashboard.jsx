import { useState, useEffect } from 'react';
import api from '../api';

function AdminDashboard({ user }) {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Eğer kullanıcı Admin değilse hiç istek atma (Güvenlik)
        if (user && user.role !== 'Admin') {
            setError("Bu sayfayı görüntülemek için Admin yetkisine sahip olmalısınız.");
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await api.get('/Admin/stats');
                setStats(res.data);
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    setError("Yetki reddedildi (403 Forbidden). Admin değilsiniz!");
                } else {
                    setError("Sistem verileri çekilirken bir hata oluştu.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user]);

    if (!user) return <div className="text-light">Lütfen giriş yapın...</div>;
    if (loading) return <div className="text-light">Sistem Verileri Yükleniyor...</div>;

    if (error) {
        return (
            <div className="alert alert-danger shadow-lg">
                <h4><i className="bi bi-shield-x"></i> Erişim Engellendi</h4>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="container text-light animate__animated animate__fadeIn">
            <h2 className="text-danger fw-bold mb-4">
                <i className="bi bi-shield-lock-fill"></i> CineLog Sistem Yönetimi (RBAC)
            </h2>
            <p className="text-muted">Hoş geldin, <strong>{user.username}</strong>! Sistem kontrolleri sende.</p>

            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card bg-dark border-danger mb-4 shadow">
                        <div className="card-body text-center">
                            <h5 className="card-title text-danger">Toplam Kullanıcı</h5>
                            <h1 className="display-4 fw-bold">{stats?.totalUsers || 0}</h1>
                            <p className="card-text text-muted">Sisteme kayıtlı üye sayısı.</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card bg-dark border-info mb-4 shadow">
                        <div className="card-body text-center">
                            <h5 className="card-title text-info">Toplam Yorum</h5>
                            <h1 className="display-4 fw-bold">{stats?.totalReviews || 0}</h1>
                            <p className="card-text text-muted">Filmlere yapılan toplam eleştiri.</p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card bg-dark border-warning mb-4 shadow">
                        <div className="card-body text-center">
                            <h5 className="card-title text-warning">Toplam Favori</h5>
                            <h1 className="display-4 fw-bold">{stats?.totalFavorites || 0}</h1>
                            <p className="card-text text-muted">Kullanıcıların kalp bıraktığı filmler.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="alert alert-success mt-4">
                <i className="bi bi-activity"></i> Sistem Durumu: <strong>{stats?.systemStatus}</strong> - {stats?.message}
            </div>
        </div>
    );
}

export default AdminDashboard;