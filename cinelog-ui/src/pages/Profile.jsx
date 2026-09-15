import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // YENİ: ÖZEL LİSTELER HAFIZASI
    const [customLists, setCustomLists] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');

    useEffect(() => {
        // 1. Profil ve Geçmiş verileri
        api.get('/Interactions/profile-data')
           .then(res => {
               setProfileData(res.data);
               setLoading(false);
           })
           .catch(err => {
               console.error(err);
               setLoading(false);
           });

        // 2. Özel Listeler
        api.get('/Interactions/custom-lists')
           .then(res => setCustomLists(res.data))
           .catch(err => console.error(err));
    }, []);

    // YENİ: YENİ LİSTE OLUŞTURMA FONKSİYONU
    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName) return alert("Liste adı boş olamaz!");
        
        try {
            const res = await api.post('/Interactions/custom-lists', {
                title: newListName,
                description: newListDesc
            });
            // Oluşan listeyi mevcutların başına ekle
            setCustomLists([res.data, ...customLists]);
            setNewListName('');
            setNewListDesc('');
            // Modalı kapatmak için HTML5 hilesi (Bootstrap kapatsın)
            document.getElementById('closeModalBtn').click();
        } catch (err) {
            console.error(err);
            alert("Liste oluşturulurken hata oluştu.");
        }
    };

    if (loading) return <h4 className="text-center mt-5 text-light">Profil Yükleniyor... <div className="spinner-border text-danger"></div></h4>;
    if (!profileData) return <h4 className="text-center mt-5 text-danger">Lütfen giriş yapın.</h4>;

    // YENİ: VERİ BİLİMİ (DATA SCIENCE) ALGORİTMASI
    // Gönderilen listedeki en çok tekrar eden değeri (Yönetmen, Oyuncu, Yıl) bulur
    const getTopFrequency = (arr, key) => {
        if (!arr || arr.length === 0) return { name: "Yok", count: 0 };
        const counts = {};
        arr.forEach(item => {
            const val = item[key];
            if (val && val !== "Bilinmiyor" && val !== 0 && val !== "") {
                counts[val] = (counts[val] || 0) + 1;
            }
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? { name: sorted[0][0], count: sorted[0][1] } : { name: "Belirsiz", count: 0 };
    };

    const topDirector = getTopFrequency(profileData.watchedMovies, 'director');
    const topActor = getTopFrequency(profileData.watchedMovies, 'leadActor');
    const topYear = getTopFrequency(profileData.watchedMovies, 'releaseYear');

    return (
        <div className="container mt-4 mb-5 text-light">
            {/* ÜST BİLGİ KARTI */}
            <div className="card bg-dark glass-card p-4 mb-5 text-light border-0">
                <div className="row align-items-center">
                    {/* Profil Resmi */}
                    <div className="col-md-2 text-center mb-3 mb-md-0">
                        <img src="https://ui-avatars.com/api/?name=Cine+Log&background=e50914&color=fff&size=120" 
                             className="rounded-circle border border-3 border-danger shadow-lg" 
                             alt="Profil" 
                        />
                    </div>
                    {/* İstatistikler */}
                    <div className="col-md-10">
                        <h3 className="fw-bold mb-4 text-center text-md-start text-glow">Sinema Profiliniz</h3>
                        <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start align-items-center">
                            <div className="text-center px-3">
                                <h2 className="text-danger fw-bold m-0 text-glow">{profileData.watchedMovies.length}</h2>
                                <small className="text-light text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>İzlenen</small>
                            </div>
                            <div className="text-center px-4 border-start border-secondary">
                                <h2 className="text-info fw-bold m-0 text-glow">{profileData.totalWatchHours}</h2>
                                <small className="text-light text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Saat</small>
                            </div>
                            <div className="text-center px-4 border-start border-secondary">
                                <h2 className="text-warning fw-bold m-0 text-glow">{profileData.watchlist.length}</h2>
                                <small className="text-light text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Listede</small>
                            </div>
                            <div className="text-center px-4 border-start border-secondary">
                                <h2 className="text-success fw-bold m-0 text-glow">
                                    {profileData.tasteProfile ? profileData.tasteProfile.favoriteGenreName : "Belirsiz"}
                                </h2>
                                <small className="text-light text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Favori Tür</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ALL-TIME STATS BUTONU */}
            <div className="text-center mb-5 mt-5">
                <Link to="/profile/stats" className="btn btn-danger btn-lg px-5 py-3 shadow-lg fs-5 fw-bold text-glow" style={{ borderRadius: '30px', letterSpacing: '1px' }}>
                    <i className="bi bi-bar-chart-steps me-2"></i> All-Time Stats (Detaylı İstatistikler)
                </Link>
            </div>

            {/* YENİ: VERİ BİLİMİ (TÜR İSTATİSTİKLERİ) */}
            {profileData.genreAverageRatings && Object.keys(profileData.genreAverageRatings).length > 0 && (
                <div className="mb-5">
                    <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2">
                        <i className="bi bi-bar-chart-line-fill text-info"></i> Türlere Göre Puan Ortalamalarım
                    </h4>
                    <div className="row g-4">
                        {Object.entries(profileData.genreAverageRatings)
                            .sort((a, b) => b[1] - a[1]) 
                            .map(([genre, avgRating]) => {
                                // Eski yorumlar 100 üzerindendi, yeniler 10. Dengelemek için:
                                const normalizedRating = avgRating > 10 ? avgRating / 10 : avgRating;
                                return (
                                <div key={genre} className="col-md-6 col-lg-4">
                                    <div className="card bg-dark glass-card p-3 h-100 border-0">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-light fw-bold">{genre}</span>
                                            <span className="badge bg-primary fs-6 shadow-sm"><i className="bi bi-star-fill text-warning"></i> {normalizedRating.toFixed(1)} / 10</span>
                                        </div>
                                        <div className="progress" style={{ height: '8px', backgroundColor: '#333', borderRadius: '10px' }}>
                                            <div className={`progress-bar ${normalizedRating >= 8 ? 'bg-success' : normalizedRating >= 5 ? 'bg-warning' : 'bg-danger'}`}
                                                 role="progressbar" 
                                                 style={{ width: `${(normalizedRating / 10) * 100}%`, borderRadius: '10px' }} 
                                                 aria-valuenow={normalizedRating} aria-valuemin="0" aria-valuemax="10">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})}
                    </div>
                </div>
            )}

            {/* YENİ: SİNEMATİK TERCİHLER (YÖNETMEN, OYUNCU, YIL) */}
            <div className="mb-5 mt-5">
                <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2">
                    <i className="bi bi-person-video3 text-danger"></i> Sinematik Tercihlerim (Veri Analizi)
                </h4>
                <div className="row g-4">
                    {/* Yönetmen Kartı */}
                    <div className="col-md-4">
                        <div className="card bg-dark glass-card p-4 text-center h-100 border-0" style={{ transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <h5 className="text-light opacity-75 text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>Favori Yönetmen</h5>
                            <h2 className="text-light fw-bold text-glow mb-2">{topDirector.name}</h2>
                            <span className="badge bg-danger fs-6">{topDirector.count} Film İzlediniz</span>
                        </div>
                    </div>
                    {/* Oyuncu Kartı */}
                    <div className="col-md-4">
                        <div className="card bg-dark glass-card p-4 text-center h-100 border-0" style={{ transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <h5 className="text-light opacity-75 text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>Favori Başrol</h5>
                            <h2 className="text-light fw-bold text-glow mb-2">{topActor.name}</h2>
                            <span className="badge bg-primary fs-6">{topActor.count} Film İzlediniz</span>
                        </div>
                    </div>
                    {/* Yıl Kartı */}
                    <div className="col-md-4">
                        <div className="card bg-dark glass-card p-4 text-center h-100 border-0" style={{ transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <h5 className="text-light opacity-75 text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>Favori Çıkış Yılı</h5>
                            <h2 className="text-light fw-bold text-glow mb-2">{topYear.name}</h2>
                            <span className="badge bg-warning text-dark fs-6">{topYear.count} Film İzlediniz</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* YENİ: ÖZEL KOLEKSİYONLAR (LİSTELER) */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-2 mt-5">
                <h4 className="fw-bold m-0"><i className="bi bi-collection-play-fill text-info"></i> Özel Koleksiyonlarım</h4>
                <button className="btn btn-outline-info btn-sm" data-bs-toggle="modal" data-bs-target="#createListModal">
                    <i className="bi bi-plus-lg"></i> Yeni Liste
                </button>
            </div>
            
            <div className="row row-cols-1 row-cols-md-3 g-4 mb-5">
                {customLists.length === 0 && <p className="text-muted ms-2">Henüz özel bir koleksiyonunuz yok.</p>}
                {customLists.map(list => (
                    <div key={list.id} className="col">
                        <div className="card bg-dark glass-card h-100 p-3 border-info shadow-lg" style={{ border: '1px solid rgba(13, 202, 240, 0.3)' }}>
                            <h5 className="text-info fw-bold">{list.title}</h5>
                            <p className="text-light opacity-75 small">{list.description || "Açıklama yok."}</p>
                            <div className="mt-auto d-flex justify-content-between align-items-center">
                                <span className="badge bg-secondary">{list.movies?.length || 0} Film</span>
                                <small className="text-muted">{new Date(list.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* İZLEME LİSTESİ */}
            <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2"><i className="bi bi-bookmark-fill text-warning"></i> İzleme Listem ({profileData.watchlist.length})</h4>
            <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3 mb-5">
                {profileData.watchlist.length === 0 && <p className="text-muted ms-2">Listeniz şu an boş.</p>}
                {profileData.watchlist.map(item => (
                    <div key={item.id} className="col">
                        <Link to={`/movie/${item.movieId}`} className="text-decoration-none">
                            <div className="card h-100 bg-transparent border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                <img src={item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Image'} className="rounded shadow-sm" alt={item.movieTitle} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
                                <h6 className="text-light mt-2 text-truncate" style={{ fontSize: '0.9rem' }}>{item.movieTitle}</h6>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* İZLENEN FİLMLER */}
            <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2"><i className="bi bi-check-all text-success"></i> İzleme Geçmişim ({profileData.watchedMovies.length})</h4>
            <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3">
                {profileData.watchedMovies.length === 0 && <p className="text-muted ms-2">Henüz film izlemediniz.</p>}
                {profileData.watchedMovies.map(item => (
                    <div key={item.id} className="col">
                        <Link to={`/movie/${item.movieId}`} className="text-decoration-none">
                            <div className="card h-100 bg-transparent border-0" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                <img src={item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Image'} className="rounded shadow-sm" alt={item.movieTitle} style={{ width: '100%', height: 'auto', objectFit: 'cover', opacity: 0.8 }} />
                                <h6 className="text-light mt-2 text-truncate" style={{ fontSize: '0.9rem' }}>{item.movieTitle}</h6>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
            
            {/* YENİ: MODAL (YENİ LİSTE OLUŞTURMA) */}
            <div className="modal fade" id="createListModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark text-light" style={{ border: '1px solid #444' }}>
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title text-info"><i className="bi bi-collection-play"></i> Yeni Koleksiyon</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" id="closeModalBtn"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCreateList}>
                                <div className="mb-3">
                                    <label className="form-label">Liste Adı</label>
                                    <input type="text" className="form-control bg-dark text-light border-secondary" placeholder="Örn: Ağlatan Filmler" value={newListName} onChange={e => setNewListName(e.target.value)} required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Açıklama (İsteğe Bağlı)</label>
                                    <textarea className="form-control bg-dark text-light border-secondary" rows="3" placeholder="Bu liste ne hakkında?" value={newListDesc} onChange={e => setNewListDesc(e.target.value)}></textarea>
                                </div>
                                <button type="submit" className="btn btn-info w-100 fw-bold">Oluştur</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Profile;
