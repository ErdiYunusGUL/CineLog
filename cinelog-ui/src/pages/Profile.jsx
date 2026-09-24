import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Profile() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Ã–ZEL LÄ°STELER
    const [customLists, setCustomLists] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [newListDesc, setNewListDesc] = useState('');

    // CSV Ä°Ã‡E AKTARMA (IMPORT)
    const [showImportModal, setShowImportModal] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // 1. Profil ve GeÃ§miÅŸ verileri
        api.get('/Interactions/profile-data')
           .then(res => {
               setProfileData(res.data);
               setLoading(false);
           })
           .catch(err => {
               console.error(err);
               setLoading(false);
           });

        // 2. Ã–zel Listeler
        api.get('/Interactions/custom-lists')
           .then(res => setCustomLists(res.data))
           .catch(err => console.error(err));
    }, []);

    // YENÄ°: YENÄ° LÄ°STE OLUÅTURMA FONKSÄ°YONU
    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListName) return alert("Liste adÄ± boÅŸ olamaz!");
        
        try {
            const res = await api.post('/Interactions/custom-lists', {
                title: newListName,
                description: newListDesc
            });
            // OluÅŸan listeyi mevcutlarÄ±n baÅŸÄ±na ekle
            setCustomLists([res.data, ...customLists]);
            setNewListName('');
            setNewListDesc('');
            // ModalÄ± kapatmak iÃ§in HTML5 hilesi (Bootstrap kapatsÄ±n)
            document.getElementById('closeModalBtn').click();
        } catch (err) {
            console.error(err);
            alert("Liste oluÅŸturulurken hata oluÅŸtu.");
        }
    };

    if (loading) return <h4 className="text-center mt-5 text-light">Profil YÃ¼kleniyor... <div className="spinner-border text-danger"></div></h4>;
    if (!profileData) return <h4 className="text-center mt-5 text-danger">LÃ¼tfen giriÅŸ yapÄ±n.</h4>;

    // YENÄ°: VERÄ° BÄ°LÄ°MÄ° (DATA SCIENCE) ALGORÄ°TMASI
    // GÃ¶nderilen listedeki en Ã§ok tekrar eden deÄŸeri (YÃ¶netmen, Oyuncu, YÄ±l) bulur
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

    // --- CSV Ä°Ã‡E AKTARMA MANTIÄI ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target.result;
            const lines = csvText.split('\n');
            if (lines.length < 2) {
                alert("GeÃ§ersiz veya boÅŸ CSV dosyasÄ±.");
                return;
            }

            // BaÅŸlÄ±klarÄ± al (Header)
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // "Name" veya "Title" kolonunun indeksini bul
            const nameIndex = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('title');
            const yearIndex = headers.indexOf('year');

            if (nameIndex === -1) {
                alert("Bu CSV dosyasÄ± uyumlu deÄŸil. LÃ¼tfen 'Name' veya 'Title' sÃ¼tunu iÃ§eren geÃ§erli bir dosya yÃ¼kleyin.");
                return;
            }

            const parsedMovies = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;

                // VirgÃ¼lden ayÄ±r ama tÄ±rnak iÃ§indeki virgÃ¼lleri yoksay
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                
                if (cols.length > nameIndex) {
                    let movieName = cols[nameIndex].trim().replace(/^"|"$/g, ''); // TÄ±rnaklarÄ± temizle
                    let releaseYear = yearIndex !== -1 && cols[yearIndex] ? cols[yearIndex].trim() : "Bilinmiyor";
                    
                    if (movieName) {
                        parsedMovies.push({ title: movieName, year: releaseYear });
                    }
                }
            }

            setImportPreview(parsedMovies);
            setShowImportModal(true);
            
            // Inputu sÄ±fÄ±rla ki aynÄ± dosyayÄ± tekrar yÃ¼kleyebilsin
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        // Normalde bu backend'e (Ã¶rn: /Interactions/bulk-import) bir array olarak yollanÄ±r
        // Ancak mockup amaÃ§lÄ± sadece UI'de gÃ¶sterip kapatacaÄŸÄ±z. 
        setImportLoading(true);
        setTimeout(() => {
            alert(`Tebrikler! ${importPreview.length} adet film baÅŸarÄ±yla geÃ§miÅŸinize eklendi! (Demo)`);
            setImportLoading(false);
            setShowImportModal(false);
            setImportPreview([]);
        }, 1500);
    };

    return (
        <div className="container mt-4 mb-5 text-light">
            {/* ÃœST BÄ°LGÄ° KARTI */}
            <div className="card bg-dark glass-card p-4 mb-5 text-light border-0">
                <div className="row align-items-center">
                    {/* Profil Resmi */}
                    <div className="col-md-2 text-center mb-3 mb-md-0">
                        <img src="https://ui-avatars.com/api/?name=Cine+Log&background=e50914&color=fff&size=120" 
                             className="rounded-circle border border-3 border-danger shadow-lg" 
                             alt="Profil" 
                        />
                    </div>
                    {/* Ä°statistikler */}
                    <div className="col-md-10">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                            <h3 className="fw-bold m-0 text-glow">Sinema Profiliniz</h3>
                            
                            </div><div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start align-items-center">
                            <div className="text-center px-3">
                                <h2 className="text-danger fw-bold m-0 text-glow">{profileData.watchedMovies.length}</h2>
                                <small className="text-light text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Ä°zlenen</small>
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
                                <small className="text-light text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>Favori TÃ¼r</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ALL-TIME STATS VE Ä°Ã‡E/DIÅA AKTAR BUTONLARI */}
            <div className="text-center mb-5 mt-5 d-flex justify-content-center gap-3 flex-wrap">
                <Link to="/profile/stats" className="btn btn-danger btn-lg px-4 shadow-lg fw-bold text-glow" style={{ borderRadius: '15px' }}>
                    <i className="bi bi-bar-chart-steps me-2"></i> All-Time Stats
                </Link>
                
                <button onClick={async () => {
                    try {
                        const response = await api.get('/Interactions/export-ratings', { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'cinelog-ratings.csv');
                        document.body.appendChild(link);
                        link.click();
                    } catch(err) { alert("DÄ±ÅŸa aktarma sÄ±rasÄ±nda hata oluÅŸtu!"); }
                }} className="btn btn-outline-success btn-lg px-4 shadow-lg fw-bold" style={{ borderRadius: '15px' }}>
                    <i className="bi bi-cloud-arrow-down-fill me-2"></i> PuanlarÄ± Ä°ndir (CSV)
                </button>

                <div><input type="file" id="importCsv" accept=".csv" style={{display: "none"}} ref={fileInputRef} onChange={handleFileUpload} /><button onClick={() => document.getElementById("importCsv").click()} className="btn btn-outline-info btn-lg px-4 shadow-lg fw-bold" style={{ borderRadius: "15px" }}><i className="bi bi-magic me-2"></i> Akıllı İçe Aktar (Letterboxd)</button></div>
            </div>

            {/* YENÄ°: YAPAY ZEKA ZEVK ANALÄ°ZÄ° */}
            {profileData.tasteProfile && profileData.tasteProfile.aiTasteAnalysis && (
                <div className="card bg-dark p-4 mb-5 border-0 shadow-lg" style={{ borderRadius: '20px', background: 'linear-gradient(145deg, #1f1f1f, #121212)', borderLeft: '5px solid #e50914' }}>
                    <div className="d-flex align-items-center mb-3">
                        <i className="bi bi-robot fs-2 text-danger me-3" style={{ animation: 'pulse 2s infinite' }}></i>
                        <h4 className="fw-bold m-0 text-glow">Yapay Zeka Psikolojik Analizi</h4>
                    </div>
                    <p className="text-light opacity-75 fs-5 fst-italic" style={{ lineHeight: '1.8' }}>
                        "{profileData.tasteProfile.aiTasteAnalysis}"
                    </p>
                    <div className="text-end">
                        <small className="text-danger fw-bold"><i className="bi bi-lightning-charge-fill"></i> Powered by Gemini AI</small>
                    </div>
                </div>
            )}

            {/* YENÄ°: VERÄ° BÄ°LÄ°MÄ° (TÃœR Ä°STATÄ°STÄ°KLERÄ°) */}
            {profileData.genreAverageRatings && Object.keys(profileData.genreAverageRatings).length > 0 && (
                <div className="mb-5">
                    <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2">
                        <i className="bi bi-bar-chart-line-fill text-info"></i> TÃ¼rlere GÃ¶re Puan OrtalamalarÄ±m
                    </h4>
                    <div className="row g-4">
                        {Object.entries(profileData.genreAverageRatings)
                            .sort((a, b) => b[1] - a[1]) 
                            .map(([genre, avgRating]) => {
                                // Eski yorumlar 100 Ã¼zerindendi, yeniler 10. Dengelemek iÃ§in:
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

            {/* YENÄ°: SÄ°NEMATÄ°K TERCÄ°HLER (YÃ–NETMEN, OYUNCU, YIL) */}
            <div className="mb-5 mt-5">
                <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2">
                    <i className="bi bi-person-video3 text-danger"></i> Sinematik Tercihlerim (Veri Analizi)
                </h4>
                <div className="row g-4">
                    {/* YÃ¶netmen KartÄ± */}
                    <div className="col-md-4">
                        <div className="card bg-dark glass-card p-4 text-center h-100 border-0" style={{ transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <h5 className="text-light opacity-75 text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>Favori YÃ¶netmen</h5>
                            <h2 className="text-light fw-bold text-glow mb-2">{topDirector.name}</h2>
                            <span className="badge bg-danger fs-6">{topDirector.count} Film Ä°zlediniz</span>
                        </div>
                    </div>
                    {/* Oyuncu KartÄ± */}
                    <div className="col-md-4">
                        <div className="card bg-dark glass-card p-4 text-center h-100 border-0" style={{ transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <h5 className="text-light opacity-75 text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>Favori BaÅŸrol</h5>
                            <h2 className="text-light fw-bold text-glow mb-2">{topActor.name}</h2>
                            <span className="badge bg-primary fs-6">{topActor.count} Film Ä°zlediniz</span>
                        </div>
                    </div>
                    {/* YÄ±l KartÄ± */}
                    <div className="col-md-4">
                        <div className="card bg-dark glass-card p-4 text-center h-100 border-0" style={{ transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <h5 className="text-light opacity-75 text-uppercase fw-bold mb-3" style={{ letterSpacing: '2px', fontSize: '0.9rem' }}>Favori Ã‡Ä±kÄ±ÅŸ YÄ±lÄ±</h5>
                            <h2 className="text-light fw-bold text-glow mb-2">{topYear.name}</h2>
                            <span className="badge bg-warning text-dark fs-6">{topYear.count} Film Ä°zlediniz</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* YENÄ°: Ã–ZEL KOLEKSÄ°YONLAR (LÄ°STELER) */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-2 mt-5">
                <h4 className="fw-bold m-0"><i className="bi bi-collection-play-fill text-info"></i> Ã–zel KoleksiyonlarÄ±m</h4>
                <button className="btn btn-outline-info btn-sm" data-bs-toggle="modal" data-bs-target="#createListModal">
                    <i className="bi bi-plus-lg"></i> Yeni Liste
                </button>
            </div>
            
            <div className="row row-cols-1 row-cols-md-3 g-4 mb-5">
                {customLists.length === 0 && <p className="text-muted ms-2">HenÃ¼z Ã¶zel bir koleksiyonunuz yok.</p>}
                {customLists.map(list => (
                    <div key={list.id} className="col">
                        <div className="card bg-dark glass-card h-100 p-3 border-info shadow-lg" style={{ border: '1px solid rgba(13, 202, 240, 0.3)' }}>
                            <h5 className="text-info fw-bold">{list.title}</h5>
                            <p className="text-light opacity-75 small">{list.description || "AÃ§Ä±klama yok."}</p>
                            <div className="mt-auto d-flex justify-content-between align-items-center">
                                <span className="badge bg-secondary">{list.movies?.length || 0} Film</span>
                                <small className="text-muted">{new Date(list.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ä°ZLEME LÄ°STESÄ° */}
            <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2"><i className="bi bi-bookmark-fill text-warning"></i> Ä°zleme Listem ({profileData.watchlist.length})</h4>
            <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3 mb-5">
                {profileData.watchlist.length === 0 && <p className="text-muted ms-2">Listeniz ÅŸu an boÅŸ.</p>}
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

            {/* Ä°ZLENEN FÄ°LMLER */}
            <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2"><i className="bi bi-check-all text-success"></i> Ä°zleme GeÃ§miÅŸim ({profileData.watchedMovies.length})</h4>
            <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-3">
                {profileData.watchedMovies.length === 0 && <p className="text-muted ms-2">HenÃ¼z film izlemediniz.</p>}
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
            
            {/* YENÄ°: MODAL (YENÄ° LÄ°STE OLUÅTURMA) */}
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
                                    <label className="form-label">Liste AdÄ±</label>
                                    <input type="text" className="form-control bg-dark text-light border-secondary" placeholder="Ã–rn: AÄŸlatan Filmler" value={newListName} onChange={e => setNewListName(e.target.value)} required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">AÃ§Ä±klama (Ä°steÄŸe BaÄŸlÄ±)</label>
                                    <textarea className="form-control bg-dark text-light border-secondary" rows="3" placeholder="Bu liste ne hakkÄ±nda?" value={newListDesc} onChange={e => setNewListDesc(e.target.value)}></textarea>
                                </div>
                                <button type="submit" className="btn btn-info w-100 fw-bold">OluÅŸtur</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSV Ä°Ã‡E AKTARMA MOCKUP MODAL */}
            {showImportModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content bg-dark text-light border border-secondary shadow-lg glass-card">
                            <div className="modal-header border-bottom border-secondary">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-magic text-warning me-2"></i> 
                                    GeÃ§miÅŸ Bulundu!
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowImportModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small mb-3">
                                    YÃ¼klediÄŸiniz dosyadan <strong>{importPreview.length}</strong> adet film tespit edildi. Bu filmler izleme geÃ§miÅŸinize eklenecektir.
                                </p>
                                
                                <div className="list-group bg-black/20 rounded-3 overflow-auto" style={{ maxHeight: '200px' }}>
                                    {importPreview.slice(0, 50).map((movie, idx) => (
                                        <div key={idx} className="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center py-2">
                                            <span className="text-truncate" style={{ maxWidth: '200px' }}>{movie.title}</span>
                                            <span className="badge bg-secondary">{movie.year}</span>
                                        </div>
                                    ))}
                                    {importPreview.length > 50 && (
                                        <div className="list-group-item bg-transparent text-muted text-center border-secondary">
                                            ...ve {importPreview.length - 50} film daha
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-top border-secondary">
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowImportModal(false)}>Ä°ptal</button>
                                <button type="button" className="btn btn-danger fw-bold px-4" onClick={confirmImport} disabled={importLoading}>
                                    {importLoading ? 'Ekleniyor...' : 'TÃ¼mÃ¼nÃ¼ Ekle'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Profile;



