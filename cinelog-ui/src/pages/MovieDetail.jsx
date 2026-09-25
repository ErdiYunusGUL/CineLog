import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';

function MovieDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams(); // URL'deki ID'yi yakalar

    // Eğer önceki sayfadan kargo (state) geldiyse onu kullan, gelmediyse boş (null) başla
    const [movie, setMovie] = useState(location.state?.movie || null);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0); 
    const [communityRating, setCommunityRating] = useState(0);
    const [providers, setProviders] = useState([]);
    const [credits, setCredits] = useState(null);
    const [similarMovies, setSimilarMovies] = useState([]); // YENİ: Oyuncu ve Yönetmen Hafızası
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
               if (res.data.userRating) setRating(res.data.userRating);
           })
           .catch(err => { /* Login olmayanları geç */ });

        // YENİ: Veri Analitiği için Film Kadrosunu (Yönetmen/Oyuncu) Çek
        api.get(`/Movies/${movie.id}/credits`)
           .then(res => setCredits(res.data))
           .catch(err => console.error(err));

        // YENİ: Benzer Filmleri Çek
        api.get(`/Movies/${movie.id}/similar`)
           .then(res => setSimilarMovies(res.data.results || []))
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
                                <span className="ms-2">
{credits?.crew?.find(c => c.job === 'Director') ? (
    <Link 
        to={"/person/" + credits.crew.find(c => c.job === 'Director').id} 
        style={{ color: '#f87171', fontWeight: 'bold', textDecoration: 'none' }}
        onMouseEnter={(e) => { e.target.style.color = '#ef4444'; e.target.style.textDecoration = 'underline'; }}
        onMouseLeave={(e) => { e.target.style.color = '#f87171'; e.target.style.textDecoration = 'none'; }}
        title="Yönetmen Profiline Git"
    >
        {credits.crew.find(c => c.job === 'Director').name} ↗
    </Link>
) : "Yükleniyor..."}
</span>
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
                                <span className="ms-2">
    {credits?.cast?.slice(0, 5).map((c, idx, arr) => (
        <span key={c.id}>
            <Link 
                to={"/person/" + c.id} 
                style={{ color: '#f87171', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.target.style.color = '#ef4444'; e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.color = '#f87171'; e.target.style.textDecoration = 'none'; }}
            >
                {c.name}
            </Link>
            {idx < arr.length - 1 && ", "}
        </span>
    )) || "Yükleniyor..."}
</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-light fs-5">{movie.overview}</p>
                <small className="text-light">Çıkış Tarihi: {movie.release_date}</small>

                <hr className="border-secondary mt-5" />

                <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 md:p-8 mt-12 mb-8 shadow-2xl relative overflow-hidden">
                    {/* Arka plan parlama efekti */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3 relative z-10">
                        <i className="bi bi-star-fill text-yellow-500"></i> Filme Puan Ver
                    </h4>
                    
                    {message && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm mb-6 relative z-10">
                            <i className="bi bi-check-circle me-2"></i> {message}
                        </div>
                    )}
                    
                    <form onSubmit={handleRatingSubmit} className="relative z-10">
                        <div className="mb-6 flex flex-col items-start gap-4">
                            <div className="d-flex flex-wrap gap-3 fs-2">
                                {[...Array(10)].map((star, index) => {
                                    index += 1;
                                    return (
                                        <i key={index} 
                                           className={index <= (hoverRating || rating) ? "bi bi-star-fill text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-110 transition-all duration-200" : "bi bi-star text-gray-600 hover:text-gray-400 transition-all duration-200"} 
                                           style={{ cursor: 'pointer' }}
                                           onClick={() => setRating(index)}
                                           onMouseEnter={() => setHoverRating(index)}
                                           onMouseLeave={() => setHoverRating(0)}
                                        ></i>
                                    );
                                })}
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full mt-2">
                                <span className="text-gray-300 font-medium">Seçilen Puan: </span>
                                <span className="text-yellow-400 font-bold text-lg">{hoverRating || rating} <span className="text-gray-500 text-sm font-normal">/ 10</span></span>
                            </div>
                        </div>
                        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center gap-2">
                            <i className="bi bi-send-fill"></i> Puanı Kaydet
                        </button>
                    </form>
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

                                {/* BENZER FİLMLER ALANI */}
                {similarMovies && similarMovies.length > 0 && (
                    <div className="mt-12 mb-8">
                        <h4 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            <i className="bi bi-collection-play text-red-500"></i> Benzer Filmler
                        </h4>
                        <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar">
                            {similarMovies.slice(0, 10).map(sm => (
                                <Link 
                                    to={'/movie/' + sm.id}
                                    key={sm.id} 
                                    className="snap-start shrink-0 w-32 md:w-40 group relative rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-red-500/50 transition-all"
                                >
                                    <img 
                                        src={sm.poster_path ? 'https://image.tmdb.org/t/p/w342' + sm.poster_path : 'https://via.placeholder.com/342x513?text=Afiş+Yok'} 
                                        alt={sm.title}
                                        className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                        <p className="text-white text-xs font-bold line-clamp-2 text-center w-full">{sm.title}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* DISQUS NATIVE ALANI */}
                <div className="bg-[#0a0a0c] border border-white/10 p-4 md:p-8 rounded-3xl shadow-2xl mt-4" id="disqus_thread"></div>

            </div>
        </div>
    );
}

export default MovieDetail;











