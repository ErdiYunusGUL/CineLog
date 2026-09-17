import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

function MovieDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams(); // URL'deki ID'yi yakalar

    // Eğer önceki sayfadan kargo (state) geldiyse onu kullan, gelmediyse boş (null) başla
    const [movie, setMovie] = useState(location.state?.movie || null);

    const [rating, setRating] = useState(0); 
    const [communityRating, setCommunityRating] = useState(0);
    const [providers, setProviders] = useState([]);
    const [credits, setCredits] = useState(null); // YENİ: Oyuncu ve Yönetmen Hafızası
    const [message, setMessage] = useState('');
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [isWatched, setIsWatched] = useState(false);
    
    // YENİ: ÖZEL LİSTELER HAFIZASI
    const [myLists, setMyLists] = useState([]);
    
    // YENİ: FRAGMAN HAFIZASI
    const [trailerKey, setTrailerKey] = useState(null);

    const disqusShortname = "cinelogofficial"; 

    // 1. AŞAMA: Eğer Film Yoksa veya Sadece Özet Veriyse C# Kapısına Git ve Tam Detayları Getir!
    useEffect(() => {
        // location.state'den gelen veri sadece özet veridir (genres vb. eksiktir).
        if (!movie || !movie.genres) {
            api.get(`/Movies/${id}`)
               .then(res => setMovie(res.data))
               .catch(err => navigate('/')); // Harbi yoksa Ana Sayfaya dön
        }
    }, [id, movie, navigate]);

    // 2. AŞAMA: Film Elimize Ulaştıysa Yan Verileri (Puan, Afiş, Durum) Çek
    useEffect(() => {
        if (!movie) return; // Film gelmeden aşağıdakileri yapma!

        // Puan Çek
        api.get(`/Interactions/movie/${movie.id}/average`)
           .then(res => setCommunityRating(res.data))
           .catch(err => console.error(err));

        // Platformları Çek
        api.get(`/Movies/${movie.id}/providers`)
           .then(res => {
               const trProviders = res.data?.results?.TR?.flatrate || [];
               setProviders(trProviders);
           })
           .catch(err => console.error(err));

        // Buton Durumlarını (İzlendi vs) Çek
        api.get(`/Interactions/movie-status/${movie.id}`)
           .then(res => {
               setIsWatchlist(res.data.isWatchlist);
               setIsWatched(res.data.isWatched);
           })
           .catch(err => { /* Login olmayanları geç */ });

        // YENİ: Veri Analitiği için Film Kadrosunu (Yönetmen/Oyuncu) Çek
        api.get(`/Movies/${movie.id}/credits`)
           .then(res => setCredits(res.data))
           .catch(err => console.error(err));

        // YENİ: Kullanıcının özel listelerini çek (Dropdown için)
        api.get('/Interactions/custom-lists')
           .then(res => setMyLists(res.data))
           .catch(err => { /* Login değilse geç */ });

        // YENİ: FRAGMAN (TRAILER) ÇEKİMİ (TMDB Doğrudan)
        fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=e642bf1d1f04cf640df706af1922c1b2&language=en-US`)
            .then(res => res.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const trailer = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
                    if (trailer) setTrailerKey(trailer.key);
                }
            })
            .catch(err => console.error("Fragman yüklenemedi", err));

        // NATIVE DISQUS YÜKLEMESİ
        if (window.DISQUS) {
            window.DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = `${movie.id}`;
                    this.page.url = window.location.href;
                    this.page.title = movie.title;
                }
            });
        } else {
            const script = document.createElement('script');
            script.src = `https://${disqusShortname}.disqus.com/embed.js`;
            script.setAttribute('data-timestamp', +new Date());
            document.body.appendChild(script);
        }
    }, [movie]);

    const toggleWatchlist = async () => {
        try {
            await api.post('/Interactions/watchlist', {
                movieId: movie.id,
                movieTitle: movie.title,
                posterPath: movie.poster_path,
                mainGenreId: movie.genre_ids ? movie.genre_ids[0] : 0
            });
            setIsWatchlist(!isWatchlist);
        } catch (err) {
            if (err.response?.status === 401) alert("Bunun için önce giriş yapmalısınız!");
        }
    };

    // YENİ: FİLMİ SEÇİLEN LİSTEYE EKLEME METODU
    const handleAddToList = async (listId) => {
        try {
            await api.post(`/Interactions/custom-lists/${listId}/toggle-movie/${movie.id}`);
            alert("Film başarıyla listeye eklendi/çıkarıldı!");
        } catch (err) {
            console.error(err);
            alert("Listeye eklenirken bir hata oluştu.");
        }
    };

    const markAsWatched = async () => {
        try {
            // YENİ: Veri Analitiği İçin Kadrodan Cımbızla Çekme İşlemi!
            const director = credits?.crew?.find(c => c.job === 'Director')?.name || "Bilinmiyor";
            const leadActor = credits?.cast?.[0]?.name || "Bilinmiyor";
            const releaseYear = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0;

            await api.post('/Interactions/watched', {
                movieId: movie.id,
                movieTitle: movie.title,
                posterPath: movie.poster_path,
                mainGenreId: movie.genre_ids ? movie.genre_ids[0] : (movie.genres ? movie.genres[0]?.id : 0),
                runtimeMinutes: movie.runtime || 120,
                director: director,
                leadActor: leadActor,
                releaseYear: releaseYear
            });
            setIsWatched(!isWatched);
        } catch (err) {
            if (err.response?.status === 401) alert("Bunun için önce giriş yapmalısınız!");
        }
    };

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert("Lütfen puan vermek için en az 1 yıldıza tıklayın!");
            return;
        }

        try {
            await api.post('/Interactions/review', {
                movieId: movie.id,
                rating: rating
            });
            setMessage("Puanınız başarıyla eklendi!");
            
            // 1. EĞER FİLM İZLENMEDİYSE OTOMATİK İZLENDİ YAP (Kullanıcı İsteği)
            if (!isWatched) {
                await markAsWatched();
            }

            // 2. ÇÖKEN YERİ DÜZELTTİK: Topluluk Puanını (Community Rating) Manuel Güncelle
            api.get(`/Interactions/movie/${movie.id}/average`)
               .then(res => setCommunityRating(res.data))
               .catch(err => console.error(err));
               
        } catch (err) {
            if (err.response?.status === 401) {
                alert("Puan vermek için önce giriş yapmalısınız!");
            } else {
                console.error(err);
                alert("Bir hata oluştu.");
            }
        }
    };

    if (!movie) return null;

    return (
        <div className="row mt-4">
            {/* SOL TARAF: Afiş ve Platformlar */}
            <div className="col-md-4">
                <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    className="img-fluid rounded shadow-lg" 
                    alt={movie.title} 
                />
                
                {providers.length > 0 && (
                    <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
                        <h6 className="text-light mb-3"><i className="bi bi-tv text-danger"></i> Şimdi İzle (Türkiye)</h6>
                        <div className="d-flex gap-3">
                            {providers.map(p => (
                                <div key={p.provider_id} className="text-center" title={p.provider_name}>
                                    <img 
                                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`} 
                                        alt={p.provider_name}
                                        style={{ width: '50px', height: '50px', borderRadius: '12px' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* YENİ: FRAGMAN BUTONU VE MODAL */}
                {trailerKey && (
                    <>
                        <button 
                            className="btn btn-outline-danger w-100 fw-bold shadow mt-3" 
                            data-bs-toggle="modal" 
                            data-bs-target="#trailerModal"
                        >
                            <i className="bi bi-youtube"></i> Fragmanı İzle
                        </button>

                        {/* Bootstrap Modal */}
                        <div className="modal fade" id="trailerModal" tabIndex="-1" aria-labelledby="trailerModalLabel" aria-hidden="true">
                            <div className="modal-dialog modal-xl modal-dialog-centered">
                                <div className="modal-content bg-dark border-secondary shadow-lg">
                                    <div className="modal-header border-secondary">
                                        <h5 className="modal-title text-light" id="trailerModalLabel">{movie.title} - Orijinal Fragman</h5>
                                        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onClick={() => {
                                            // Modalı kapatırken iframe'i yeniden yükleterek videoyu durdur
                                            const iframe = document.getElementById('youtubeIframe');
                                            if (iframe) iframe.src = iframe.src;
                                        }}></button>
                                    </div>
                                    <div className="modal-body p-0">
                                        <div className="ratio ratio-16x9">
                                            <iframe 
                                                id="youtubeIframe"
                                                src={`https://www.youtube.com/embed/${trailerKey}?rel=0`} 
                                                title="YouTube video player" 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* SAĞ TARAF: Detaylar ve Yıldızlar */}
            <div className="col-md-8">
                <h2 className="text-light fw-bold">{movie.title}</h2>
                <div className="d-flex align-items-center mb-4">
                    <span className="badge bg-danger fs-6 me-3"><i className="bi bi-star-fill text-warning"></i> TMDB: {movie.vote_average.toFixed(1)} / 10</span>
                    {communityRating > 0 && (
                        <span className="badge bg-primary fs-6"><i className="bi bi-people-fill text-light"></i> CineLog Topluluk: {communityRating} / 10</span>
                    )}
                </div>

                {/* YENİ: AKSİYON BUTONLARI */}
                <div className="d-flex gap-3 mb-4">
                    <button 
                        onClick={markAsWatched} 
                        className={`btn ${isWatched ? 'btn-success' : 'btn-outline-success'}`}>
                        <i className={`bi ${isWatched ? 'bi-check-all' : 'bi-eye'}`}></i> {isWatched ? ' İzlendi' : ' İzledim'}
                    </button>
                    
                    <button 
                        onClick={toggleWatchlist} 
                        className={`btn ${isWatchlist ? 'btn-warning' : 'btn-outline-warning'}`}>
                        <i className={`bi ${isWatchlist ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i> {isWatchlist ? ' Listeden Çıkar' : ' Listeme Ekle'}
                    </button>
                    
                    {/* YENİ: ÖZEL LİSTEYE EKLE DROPDOWN */}
                    {myLists.length > 0 && (
                        <div className="dropdown">
                            <button className="btn btn-outline-info dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="bi bi-collection-play"></i> Koleksiyona Ekle
                            </button>
                            <ul className="dropdown-menu dropdown-menu-dark">
                                {myLists.map(list => (
                                    <li key={list.id}>
                                        <button className="dropdown-item" onClick={() => handleAddToList(list.id)}>
                                            {list.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* YENİ: FİLM DETAY BİLGİLERİ KARTI */}
                <div className="card bg-dark text-light mb-4 shadow-sm" style={{ border: '1px solid #333' }}>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-2">
                                <span className="text-info fw-bold">Yönetmen:</span> 
                                <span className="ms-2">{credits?.crew?.find(c => c.job === 'Director')?.name || "Yükleniyor..."}</span>
                            </div>
                            <div className="col-md-6 mb-2">
                                <span className="text-info fw-bold">Senarist:</span> 
                                <span className="ms-2">{credits?.crew?.filter(c => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story').map(c => c.name).slice(0,2).join(', ') || "Bilinmiyor"}</span>
                            </div>
                            <div className="col-md-6 mb-2">
                                <span className="text-info fw-bold">Tür:</span> 
                                <span className="ms-2">{movie.genres?.map(g => g.name).join(', ') || "Yükleniyor..."}</span>
                            </div>
                            <div className="col-md-6 mb-2">
                                <span className="text-info fw-bold">Dil:</span> 
                                <span className="ms-2 text-uppercase">{movie.original_language || "Yükleniyor..."}</span>
                            </div>
                            <div className="col-md-6 mb-2">
                                <span className="text-info fw-bold">Ülke:</span> 
                                <span className="ms-2">{movie.production_countries?.map(c => c.name).join(', ') || "Yükleniyor..."}</span>
                            </div>
                            <div className="col-md-6 mb-2">
                                <span className="text-info fw-bold">Süre:</span> 
                                <span className="ms-2">{movie.runtime ? `${movie.runtime} dakika` : "Yükleniyor..."}</span>
                            </div>
                            <div className="col-12 mt-2 pt-2 border-top border-secondary">
                                <span className="text-info fw-bold">Oyuncular:</span> 
                                <span className="ms-2">{credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || "Yükleniyor..."}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-light fs-5">{movie.overview}</p>
                <small className="text-light">Çıkış Tarihi: {movie.release_date}</small>

                <hr className="border-secondary mt-5" />

                <h4 className="text-light"><i className="bi bi-star-half text-warning"></i> Filme Puan Ver</h4>
                
                <div className="card mt-4 mb-5" style={{ backgroundColor: 'var(--bg-card)', border: 'none' }}>
                    <div className="card-body">
                        {message && <div className="alert alert-success">{message}</div>}
                        <form onSubmit={handleRatingSubmit}>
                            <div className="mb-4">
                                <div className="d-flex fs-3">
                                    {[...Array(10)].map((star, index) => {
                                        index += 1;
                                        return (
                                            <i key={index} 
                                               className={index <= rating ? "bi bi-star-fill text-warning" : "bi bi-star text-secondary"} 
                                               style={{ cursor: 'pointer', marginRight: '8px' }}
                                               onClick={() => setRating(index)}
                                            ></i>
                                        );
                                    })}
                                </div>
                                <small className="text-muted mt-2 d-block">Puanınız: {rating} / 10</small>
                            </div>
                            <button type="submit" className="btn btn-outline-warning">Puanı Kaydet</button>
                        </form>
                    </div>
                </div>

                {/* YENİ: YAPAY ZEKA YORUM ÖZETLEYİCİ */}
                <h4 className="text-light mb-4 mt-5"><i className="bi bi-chat-left-text text-danger"></i> Yorumlar (The Movie Database)</h4>
                
                <div className="card bg-dark p-3 mb-4 border-secondary border-0 shadow-lg" style={{ background: 'linear-gradient(145deg, #1f1f1f, #121212)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h5 className="text-light fw-bold m-0"><i className="bi bi-magic text-danger"></i> AI İnceleme Özeti</h5>
                            <small className="text-muted">Bu film için TMDB üzerindeki yorumları okumaya üşeniyor musunuz?</small>
                        </div>
                        <button 
                            className="btn btn-danger btn-sm px-3 shadow"
                            id="aiSummarizeBtn"
                            onClick={async (e) => {
                                const btn = e.currentTarget;
                                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Özetleniyor...';
                                btn.disabled = true;
                                try {
                                    const res = await api.get(`/Ai/summarize/${movie.id}`);
                                    document.getElementById('aiSummaryResult').innerHTML = res.data.response;
                                    document.getElementById('aiSummaryResultBox').style.display = 'block';
                                } catch(err) {
                                    alert("Özetleme başarısız oldu.");
                                } finally {
                                    btn.innerHTML = '<i class="bi bi-magic"></i> Özetle';
                                    btn.disabled = false;
                                }
                            }}
                        >
                            <i className="bi bi-magic"></i> Özetle
                        </button>
                    </div>
                    <div id="aiSummaryResultBox" className="alert alert-secondary border-0 mt-3 mb-0" style={{ display: 'none', backgroundColor: '#2a2a2a', color: '#e0e0e0' }}>
                        <i className="bi bi-info-circle-fill text-danger me-2"></i>
                        <span id="aiSummaryResult" style={{ fontStyle: 'italic' }}></span>
                    </div>
                </div>

                {/* DISQUS NATIVE ALANI */}
                <div className="bg-light p-3 rounded" id="disqus_thread"></div>

            </div>
        </div>
    );
}

export default MovieDetail;