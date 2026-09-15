import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function PublicProfile() {
    const { id } = useParams(); // URL'den gelen kullanıcı ID'si
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/Community/user/${id}/profile')
           .then(res => setProfile(res.data))
           .catch(err => setError('Kullanıcı profili yüklenirken hata oluştu.'))
           .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="text-light mt-5 text-center fs-4"><i className="bi bi-hourglass-split"></i> Profil yükleniyor...</div>;
    if (error) return <div className="text-danger mt-5 text-center fs-4">{error}</div>;
    if (!profile) return null;

    return (
        <div className="mt-4 mb-5">
            {/* ÜST BİLGİ KARTI */}
            <div className="card bg-dark text-light border-secondary shadow-lg mb-5">
                <div className="card-body d-flex align-items-center p-4">
                    <i className="bi bi-person-bounding-box text-info" style={{ fontSize: '5rem' }}></i>
                    <div className="ms-4">
                        <h1 className="fw-bold m-0">{profile.username}</h1>
                        <p className="fs-5 text-warning mt-2 m-0">{profile.badgeTitle}</p>
                        {profile.tasteProfile?.favoriteGenreName && (
                            <span className="badge bg-danger mt-2 fs-6">
                                <i className="bi bi-heart-pulse-fill"></i> Favori Tür: {profile.tasteProfile.favoriteGenreName}
                            </span>
                        )}
                    </div>
                    {/* İleride "Takip Et" butonu buraya gelebilir */}
                    <button className="btn btn-outline-info ms-auto btn-lg" disabled>
                        <i className="bi bi-person-plus"></i> Takip Et
                    </button>
                </div>
            </div>

            <div className="row g-4">
                {/* SOL PANEL: SON İZLEDİKLERİ */}
                <div className="col-md-7">
                    <h3 className="text-light mb-4"><i className="bi bi-clock-history text-danger"></i> Son İzlediği Filmler</h3>
                    <div className="row g-3">
                        {profile.recentWatches.length === 0 ? (
                            <p className="text-light opacity-75">Bu kullanıcı henüz hiçbir film izlememiş.</p>
                        ) : (
                            profile.recentWatches.map(movie => (
                                <div key={movie.id} className="col-4 col-sm-3 col-md-4 col-lg-3">
                                    <Link to={`/movie/${movie.movieId}`} className="text-decoration-none">
                                        <div className="card bg-transparent border-0 h-100" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                            <img 
                                                src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                                                className="card-img-top rounded shadow" 
                                                alt={movie.movieTitle} 
                                            />
                                        </div>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SAĞ PANEL: ÖZEL KOLEKSİYONLARI */}
                <div className="col-md-5">
                    <h3 className="text-light mb-4"><i className="bi bi-collection-play text-warning"></i> Koleksiyonları</h3>
                    {profile.customLists.length === 0 ? (
                        <p className="text-light opacity-75">Bu kullanıcı henüz özel bir liste oluşturmamış.</p>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {profile.customLists.map(list => (
                                <div key={list.id} className="card bg-dark text-light border-secondary shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title text-info m-0">{list.title}</h5>
                                        {list.description && <p className="card-text text-muted small mt-2 m-0">{list.description}</p>}
                                        <div className="mt-3 text-end">
                                            <span className="badge bg-secondary">İçinde Film Var</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PublicProfile;
