import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

function Home() {
    const [movies, setMovies] = useState([]);
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [favoriteGenreName, setFavoriteGenreName] = useState('');
    const [loading, setLoading] = useState(true);
    
    // YENİ: AKILLI BİLDİRİM HAFIZASI
    const [dashboardNotifications, setDashboardNotifications] = useState([]);

    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search'); 

    useEffect(() => {
        setLoading(true);
        
        // 1. Kullanıcının Zevk Profilini ve AKILLI PANOSUNU Getir
        if (!searchQuery) {
            // Akıllı Pano
            api.get('/Interactions/smart-dashboard')
               .then(res => {
                   if (res.data && res.data.notifications) {
                       setDashboardNotifications(res.data.notifications);
                   }
               })
               .catch(err => { /* login değilse sessizce geç */ });

            // Zevk Profili
            api.get('/Interactions/my-taste')
                .then(res => {
                    const profile = res.data;
                    setFavoriteGenreName(profile.favoriteGenreName);
                    // 2. Profili varsa o türe ait filmleri Mega Filtre motorumuzdan çek!
                    return api.get(`/Movies/discover?genreId=${profile.favoriteGenreId}`);
                })
                .then(res => {
                    // 3. Sadece en iyi 6 öneriyi al ve şeride koy
                    if(res && res.data) {
                        setRecommendedMovies(res.data.slice(0, 6)); 
                    }
                })
                .catch(err => {
                    // Kullanıcı login değilse veya zevk profili yoksa hata verir, sorun yok gizli kalır.
                });
        }

        // ESKİ KOD: Eğer URL'de bir kelime (searchQuery) varsa ARAMA kapısına git
        if (searchQuery) {
            api.get(`/Movies/search?query=${searchQuery}`)
                .then(response => {
                    setMovies(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Arama yapılırken hata oluştu:", error);
                    setLoading(false);
                });
        } 
        // Arama kelimesi yoksa (normal ana sayfadaysak) POPÜLER filmleri getir
        else {
            api.get('/Movies/popular')
                .then(response => {
                    setMovies(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Filmler çekilirken hata oluştu:", error);
                    setLoading(false);
                });
        }
    }, [searchQuery]);
    
      if (loading) return <h4 className="text-center mt-5 text-danger">Filmler Yükleniyor... <div className="spinner-border text-danger"></div></h4>;

      return (
        <div>
            {/* YENİ: AKILLI BİLDİRİMLER (SMART DASHBOARD) */}
            {dashboardNotifications.length > 0 && !searchQuery && (
                <div className="mb-4">
                    {dashboardNotifications.map((note, index) => (
                        <div key={index} className="alert alert-info bg-dark text-info border-info shadow-sm d-flex align-items-center" role="alert" style={{ borderLeft: '5px solid #0dcaf0' }}>
                            <i className="bi bi-robot fs-4 me-3"></i>
                            <div dangerouslySetInnerHTML={{ __html: note }}></div>
                        </div>
                    ))}
                </div>
            )}

            {/* YENİ: ÖNERİLENLER ŞERİDİ (Netflix Tarzı) */}
            {recommendedMovies.length > 0 && !searchQuery && (
                <div className="mb-5 p-4 rounded shadow-lg" style={{ backgroundColor: '#121212', border: '1px solid #e50914' }}>
                    <h4 className="text-light fw-bold mb-4">
                        <i className="bi bi-stars text-warning"></i> Sizin İçin Önerilenler <span className="badge bg-danger ms-2">{favoriteGenreName}</span>
                    </h4>
                    <div className="row g-3">
                        {recommendedMovies.map(movie => (
                            <div key={movie.id} className="col-6 col-md-4 col-lg-2">
                                <Link to={`/movie/${movie.id}`} state={{ movie }} className="text-decoration-none">
                                    <div className="card bg-dark text-white h-100 shadow-sm movie-poster-card" style={{ border: 'none', transition: 'transform 0.2s', cursor: 'pointer' }} 
                                         onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                        <img 
                                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                                            className="card-img-top rounded" 
                                            alt={movie.title} 
                                        />
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ESKİ: POPÜLER / ARAMA SONUÇLARI */}
            <h4 className="text-light fw-bold mb-4">{searchQuery ? "Arama Sonuçları" : "Popüler Filmler"}</h4>
            <div className="row row-cols-1 row-cols-md-4 g-4">
                {movies.map(movie => (
                    <div key={movie.id} className="col">
                        <Link to={`/movie/${movie.id}`} state={{ movie: movie }} style={{ textDecoration: 'none' }}>
                        <div className="card h-100 shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer' }}>
                            <img 
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                                className="card-img-top" 
                                alt={movie.title} 
                                style={{ height: '350px', objectFit: 'cover' }}
                            />
                            <div className="card-body">
                                <h6 className="card-title text-light fw-bold text-truncate" title={movie.title}>{movie.title}</h6>
                                <div className="d-flex justify-content-between align-items-center mt-2">
                                    <span className="badge bg-danger"><i className="bi bi-star-fill text-warning"></i> {movie.vote_average.toFixed(1)}</span>
                                    <small className="text-muted">{movie.release_date ? movie.release_date.substring(0,4) : ''}</small>
                                </div>
                            </div>
                        </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;