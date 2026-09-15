import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Stats() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('director'); // Hook'lar EN ÜSTTE olmalı!

    useEffect(() => {
        api.get('/Interactions/profile-data')
           .then(res => {
               setProfileData(res.data);
               setLoading(false);
           })
           .catch(err => {
               console.error(err);
               setLoading(false);
           });
    }, []);

    if (loading) return <h4 className="text-center mt-5 text-light">Veriler Çarpıştırılıyor... <div className="spinner-border text-danger"></div></h4>;
    if (!profileData) return <h4 className="text-center mt-5 text-danger">Lütfen giriş yapın.</h4>;

    // ==========================================
    // VERİ BİLİMİ (JOIN İŞLEMİ VE ALGORİTMALAR)
    // ==========================================
    const { watchedMovies, userReviews } = profileData;

    // 1. Kullanıcının verdiği puanları MovieId üzerinden hızlıca bulabilmek için Sözlük (Map) yapıyoruz
    const reviewMap = {};
    if (userReviews) {
        userReviews.forEach(r => {
            // Eğer puan eski düzense (Örn 85) onu 10 üzerinden (8.5) şekline çevirerek kaydediyoruz
            reviewMap[r.movieId] = r.rating > 10 ? r.rating / 10 : r.rating;
        });
    }

    // 2. Dinamik Lig Hesaplama Fonksiyonu (Yönetmen, Oyuncu, Yıl için ortak çalışır)
    const calculateLeague = (key, minCount = 2) => {
        const stats = {};
        
        // Tüm izlenen filmleri dönüyoruz
        watchedMovies.forEach(movie => {
            const val = movie[key];
            // Eğer veri yoksa veya 'Bilinmiyor' ise pas geç
            if (!val || val === "Bilinmiyor" || val === "") return;

            if (!stats[val]) stats[val] = { name: val, count: 0, totalRating: 0, ratedCount: 0 };
            
            stats[val].count += 1; // İzleme sayısını artır
            
            // Eğer kullanıcı bu filme puan verdiyse ortalamaya kat
            if (reviewMap[movie.movieId]) {
                stats[val].totalRating += reviewMap[movie.movieId];
                stats[val].ratedCount += 1;
            }
        });

        // Objeyi Diziye çevir, minCount (Örn: En az 2 film) filtresinden geçir ve Puan Ortalamasına göre sırala
        return Object.values(stats)
            .filter(item => item.count >= minCount && item.ratedCount > 0) // Sadece puan verdiklerini ve en az X tane izlediklerini al
            .map(item => ({
                ...item,
                avgRating: (item.totalRating / item.ratedCount).toFixed(1)
            }))
            .sort((a, b) => b.avgRating - a.avgRating); // En yüksek puan alan en üste (Azalan sıralama)
    };

    // Şampiyonlar Ligleri (Test edebilmeniz için barajı şimdilik "En az 2 film" olarak ayarladım)
    const directorLeague = calculateLeague('director', 2);
    const actorLeague = calculateLeague('leadActor', 2);
    const yearLeague = calculateLeague('releaseYear', 2);

    return (
        <div className="container mt-4 mb-5 text-light">
            
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold text-glow"><i className="bi bi-graph-up-arrow text-danger"></i> Tüm Zamanlar (All-Time Stats)</h2>
                    <p className="text-muted">CineLog Pro Analizleri (Minimum 2 Film Barajı)</p>
                </div>
                <Link to="/profile" className="btn btn-outline-light rounded-pill"><i className="bi bi-arrow-left"></i> Profile Dön</Link>
            </div>

            {/* YENİ: SEKME (TAB) MENÜSÜ */}
            <div className="d-flex justify-content-center mb-5 gap-3 flex-wrap">
                <button 
                    className={`btn ${activeTab === 'director' ? 'btn-warning text-dark' : 'btn-outline-warning text-light'} px-4 py-2 rounded-pill fw-bold`}
                    onClick={() => setActiveTab('director')}>
                    <i className="bi bi-megaphone-fill me-2"></i> Yönetmen Ligi
                </button>
                <button 
                    className={`btn ${activeTab === 'actor' ? 'btn-info text-dark' : 'btn-outline-info text-light'} px-4 py-2 rounded-pill fw-bold`}
                    onClick={() => setActiveTab('actor')}>
                    <i className="bi bi-person-star me-2"></i> Başrol Ligi
                </button>
                <button 
                    className={`btn ${activeTab === 'year' ? 'btn-success text-dark' : 'btn-outline-success text-light'} px-4 py-2 rounded-pill fw-bold`}
                    onClick={() => setActiveTab('year')}>
                    <i className="bi bi-calendar-check-fill me-2"></i> Favori Yıllar
                </button>
            </div>

            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    {/* 1. YÖNETMEN LİGİ */}
                    {activeTab === 'director' && (
                        <div className="card bg-dark glass-card border-0 p-4 shadow-lg" style={{ animation: 'fadeIn 0.5s' }}>
                            <h4 className="text-warning fw-bold text-center mb-4 border-bottom border-secondary pb-3">
                                <i className="bi bi-megaphone-fill"></i> En İyi Yönetmenler
                            </h4>
                            {directorLeague.length === 0 ? <p className="text-muted text-center fs-5 mt-4">Yeterli veri yok.</p> : (
                                <ul className="list-group list-group-flush bg-transparent">
                                    {directorLeague.map((d, index) => (
                                        <li key={index} className="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center border-secondary py-3">
                                            <div className="fs-5">
                                                <span className="fw-bold me-3 text-warning">#{index + 1}</span> {d.name}
                                                <small className="d-block text-light opacity-75 fs-6 mt-1"><i className="bi bi-film"></i> {d.count} Film İzlediniz</small>
                                            </div>
                                            <span className="badge bg-danger fs-5 px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-star-fill text-warning"></i> {d.avgRating}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* 2. OYUNCU LİGİ */}
                    {activeTab === 'actor' && (
                        <div className="card bg-dark glass-card border-0 p-4 shadow-lg" style={{ animation: 'fadeIn 0.5s' }}>
                            <h4 className="text-info fw-bold text-center mb-4 border-bottom border-secondary pb-3">
                                <i className="bi bi-person-star"></i> En İyi Başroller
                            </h4>
                            {actorLeague.length === 0 ? <p className="text-muted text-center fs-5 mt-4">Yeterli veri yok.</p> : (
                                <ul className="list-group list-group-flush bg-transparent">
                                    {actorLeague.map((a, index) => (
                                        <li key={index} className="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center border-secondary py-3">
                                            <div className="fs-5">
                                                <span className="fw-bold me-3 text-info">#{index + 1}</span> {a.name}
                                                <small className="d-block text-light opacity-75 fs-6 mt-1"><i className="bi bi-film"></i> {a.count} Film İzlediniz</small>
                                            </div>
                                            <span className="badge bg-danger fs-5 px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-star-fill text-warning"></i> {a.avgRating}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* 3. YIL LİGİ */}
                    {activeTab === 'year' && (
                        <div className="card bg-dark glass-card border-0 p-4 shadow-lg" style={{ animation: 'fadeIn 0.5s' }}>
                            <h4 className="text-success fw-bold text-center mb-4 border-bottom border-secondary pb-3">
                                <i className="bi bi-calendar-check-fill"></i> Favori Sinema Yılları
                            </h4>
                            {yearLeague.length === 0 ? <p className="text-muted text-center fs-5 mt-4">Yeterli veri yok.</p> : (
                                <ul className="list-group list-group-flush bg-transparent">
                                    {yearLeague.map((y, index) => (
                                        <li key={index} className="list-group-item bg-transparent text-light d-flex justify-content-between align-items-center border-secondary py-3">
                                            <div className="fs-5">
                                                <span className="fw-bold me-3 text-success">#{index + 1}</span> {y.name}
                                                <small className="d-block text-light opacity-75 fs-6 mt-1"><i className="bi bi-film"></i> {y.count} Film İzlediniz</small>
                                            </div>
                                            <span className="badge bg-danger fs-5 px-3 py-2 rounded-pill shadow-sm"><i className="bi bi-star-fill text-warning"></i> {y.avgRating}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

export default Stats;
