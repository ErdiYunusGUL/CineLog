import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs'; // Tarih formatlamak için
import 'dayjs/locale/tr';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('tr');

function Community() {
    const [matches, setMatches] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Eşleşmeleri ve Akışı aynı anda çek
        Promise.all([
            api.get('/Community/matches'),
            api.get('/Community/activity-feed')
        ])
        .then(([matchesRes, feedRes]) => {
            setMatches(matchesRes.data);
            setActivities(feedRes.data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, []);

    const getBadgeColor = (percentage) => {
        if (percentage >= 85) return 'bg-success'; 
        if (percentage >= 50) return 'bg-warning text-dark'; 
        return 'bg-danger'; 
    };

    return (
        <div className="mt-4 mb-5">
            <div className="d-flex align-items-center mb-4">
                <i className="bi bi-people-fill text-info fs-2 me-3"></i>
                <h2 className="text-light fw-bold m-0">Sinema Topluluğu</h2>
            </div>
            
            <p className="text-light fs-5 mb-5 opacity-75">
                Seninle aynı filmleri izleyip, o filmlere <strong className="text-warning">benzer puanlar</strong> veren CineLog üyeleriyle tanış ve topluluktaki son hareketleri takip et!
            </p>

            {loading ? (
                <div className="text-light fs-4 text-center mt-5"><i className="bi bi-hourglass-split"></i> Algoritmalar çalışıyor, veriler yükleniyor...</div>
            ) : (
                <div className="row g-4">
                    {/* SOL TARAF: RUH İKİZLERİ (MATCHES) */}
                    <div className="col-lg-8">
                        <h4 className="text-info mb-3"><i className="bi bi-heart-pulse-fill text-danger"></i> Ruh İkizlerin</h4>
                        <div className="row g-3">
                            {matches.length === 0 ? (
                                <div className="col-12 text-center text-light p-4 bg-dark rounded border border-secondary shadow-lg">
                                    <i className="bi bi-emoji-frown fs-1 d-block mb-3 text-warning"></i>
                                    <h5 className="fw-light">Henüz kimseyle ortak bir film puanlamadınız.</h5>
                                    <p className="text-info mt-2">Eşleşme oranlarını görmek için filmlere puan verin!</p>
                                </div>
                            ) : (
                                matches.map((match, index) => (
                                    <div key={match.userId} className="col-md-6">
                                        <div className={`card h-100 text-light shadow-lg ${index === 0 ? 'border-success' : 'border-secondary'}`} style={{ backgroundColor: '#121212', borderWidth: index === 0 ? '2px' : '1px' }}>
                                            <div className="card-body position-relative">
                                                {index === 0 && (
                                                    <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-success px-3 py-2 fs-6 shadow">
                                                        <i className="bi bi-award-fill"></i> Gerçek Ruh İkizi
                                                    </span>
                                                )}
                                                
                                                <h5 className="card-title text-info fw-bold mb-3 mt-2">
                                                    <i className="bi bi-person-circle text-secondary me-2"></i> 
                                                    {match.username}
                                                </h5>
                                                
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="text-light opacity-75 small">Uyum Oranı:</span>
                                                    <span className={`badge ${getBadgeColor(match.matchPercentage)}`}>
                                                        %{match.matchPercentage}
                                                    </span>
                                                </div>
                                                <hr className="border-secondary my-2" />
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <span className="text-light opacity-75 small"><i className="bi bi-film text-info"></i> Ortak Filmler:</span>
                                                    <span className="fw-bold small">{match.sharedRatedMoviesCount} adet</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-light opacity-75 small"><i className="bi bi-star-fill text-danger"></i> Favori Türü:</span>
                                                    <span className="fw-bold text-warning small">{match.favoriteGenreName}</span>
                                                </div>
                                            </div>
                                            <div className="card-footer bg-dark border-secondary text-center p-2">
                                                <Link to={`/user/${match.userId}`} className="btn btn-outline-info btn-sm w-100">
                                                    <i className="bi bi-eye"></i> Profile Git
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SAĞ TARAF: SOSYAL AKIŞ (ACTIVITY FEED) */}
                    <div className="col-lg-4">
                        <h4 className="text-warning mb-3"><i className="bi bi-activity"></i> Canlı Akış</h4>
                        <div className="card bg-dark border-secondary shadow-lg" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <div className="list-group list-group-flush">
                                {activities.length === 0 ? (
                                    <div className="p-3 text-muted text-center">Henüz bir hareket yok.</div>
                                ) : (
                                    activities.map((act, index) => (
                                        <div key={index} className="list-group-item bg-transparent text-light border-secondary p-3">
                                            <div className="d-flex align-items-start">
                                                {act.posterPath ? (
                                                    <img src={`https://image.tmdb.org/t/p/w92${act.posterPath}`} alt="Poster" className="rounded me-3 shadow" style={{ width: '45px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="rounded me-3 bg-secondary d-flex justify-content-center align-items-center" style={{ width: '45px', height: '68px' }}>
                                                        <i className="bi bi-film text-dark"></i>
                                                    </div>
                                                )}
                                                <div>
                                                    <strong className="text-info">{act.username}</strong>
                                                    <span className="ms-1 opacity-75">
                                                        {act.actionType === 'watched' && 'şunu izledi:'}
                                                        {act.actionType === 'rated' && `puan verdi (${act.rating}/10):`}
                                                        {act.actionType === 'created_list' && 'yeni liste oluşturdu:'}
                                                    </span>
                                                    <div className="fw-bold text-warning mt-1">{act.itemName}</div>
                                                    <div className="text-muted small mt-1"><i className="bi bi-clock"></i> {dayjs(act.createdAt).fromNow()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

export default Community;
