import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Discover() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);

    // FİLTRE HAFIZALARI (STATE)
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [genreId, setGenreId] = useState('');
    const [providerId, setProviderId] = useState('');
    const [sortBy, setSortBy] = useState('popularity.desc');
    const [showWatched, setShowWatched] = useState(false); // YENİ: İzlenenleri Göster Hafızası

    // YENİ: YÖNETMEN / OYUNCU (AUTOCOMPLETE) HAFIZASI
    const [personName, setPersonName] = useState('');
    const [castId, setCastId] = useState(''); // OYUNCU İSE BURAYA
    const [crewId, setCrewId] = useState(''); // YÖNETMEN İSE BURAYA
    const [personResults, setPersonResults] = useState([]);

    // YENİ: SAYFALAMA HAFIZASI
    const [page, setPage] = useState(1);

    const fetchFilteredMovies = (pageNum = 1) => {
        setLoading(true);
        let url = `/Movies/discover?startYear=${startYear}&endYear=${endYear}&sortBy=${sortBy}&showWatched=${showWatched}&page=${pageNum}`;
        if (genreId) url += `&genreId=${genreId}`;
        if (providerId) url += `&providerId=${providerId}`;
        if (castId) url += `&castId=${castId}`; // Sadece oyuncu olduğu filmler
        if (crewId) url += `&crewId=${crewId}`; // Sadece yönetmen olduğu filmler

        api.get(url)
           .then(res => {
               // YENİ: Artık Load More (Üstüne ekleme) değil, klasik sayfalama (Sıfırdan yükleme) yapıyoruz.
               setMovies(res.data);
               // Ekranı sayfanın en üstüne kaydır (Kullanıcı yeni sayfaya geçtiğini anlasın)
               window.scrollTo(0, 0);
           })
           .catch(err => console.error(err))
           .finally(() => setLoading(false));
    };

    // Sayfa ilk açıldığında veya page değiştiğinde (eğer ilk açılış değilse)
    useEffect(() => {
        fetchFilteredMovies(page);
    }, [page]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setPage(1); // Filtre değiştiğinde her zaman ilk sayfaya dön
        fetchFilteredMovies(1);
    };

    // ... (Kişi Arama mantığı aynı)
    const handlePersonChange = (e) => {
        const val = e.target.value;
        setPersonName(val);
        setCastId(''); 
        setCrewId(''); 
        
        if (val.length > 2) {
            api.get(`/Movies/search-person?name=${val}`)
               .then(res => setPersonResults(res.data.results || []))
               .catch(err => console.error(err));
        } else {
            setPersonResults([]); 
        }
    };

    const selectPerson = (person) => {
        setPersonName(person.name); 
        if (person.known_for_department === 'Directing') {
            setCrewId(person.id);
        } else {
            setCastId(person.id);
        }
        setPersonResults([]); 
    };

    return (
        <div className="row mt-4">
            {/* SOL PANEL: FİLTRELER */}
            <div className="col-md-3">
                <div className="card text-light p-3 shadow-lg" style={{ backgroundColor: '#121212', border: '1px solid #333' }}>
                    <h5 className="mb-4 text-danger"><i className="bi bi-funnel-fill"></i> Mega Filtre</h5>
                    
                    <form onSubmit={handleFilterSubmit}>
                        {/* YÖNETMEN / OYUNCU ARAMA (AUTOCOMPLETE) */}
                        <div className="mb-4 position-relative">
                            <label className="form-label text-info"><i className="bi bi-person-bounding-box"></i> Yönetmen / Oyuncu Ara</label>
                            <input 
                                type="text" 
                                className="form-control bg-dark text-light border-info" 
                                placeholder="Örn: Nolan, DiCaprio..." 
                                value={personName} 
                                onChange={handlePersonChange} 
                                autoComplete="off"
                            />
                            {/* Autocomplete Dropdown */}
                            {personResults.length > 0 && (
                                <ul className="list-group position-absolute w-100 shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                                    {personResults.map(p => (
                                        <li 
                                            key={p.id} 
                                            className="list-group-item list-group-item-action bg-dark text-light border-secondary d-flex align-items-center"
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                                            onClick={() => selectPerson(p)}
                                        >
                                            <img 
                                                src={p.profile_path ? `https://image.tmdb.org/t/p/w45${p.profile_path}` : 'https://via.placeholder.com/45x45?text=Yok'} 
                                                alt={p.name} 
                                                className="rounded-circle me-3 border border-secondary"
                                                style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <strong className="d-block">{p.name}</strong>
                                                <small className="text-info">{p.known_for_department === 'Directing' ? 'Yönetmen' : 'Oyuncu'}</small>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Başlangıç Yılı</label>
                            <input type="number" className="form-control bg-dark text-light border-secondary" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label">Bitiş Yılı</label>
                            <input type="number" className="form-control bg-dark text-light border-secondary" value={endYear} onChange={(e) => setEndYear(e.target.value)} />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Film Türü</label>
                            <select className="form-select bg-dark text-light border-secondary" value={genreId} onChange={(e) => setGenreId(e.target.value)}>
                                <option value="">Tümü</option>
                                <option value="28">Aksiyon</option>
                                <option value="35">Komedi</option>
                                <option value="18">Dram</option>
                                <option value="878">Bilim Kurgu</option>
                                <option value="27">Korku</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label">İzleme Platformu</label>
                            <select className="form-select bg-dark text-light border-secondary" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                                <option value="">Fark Etmez</option>
                                <option value="8">Netflix</option>
                                <option value="337">Disney+</option>
                                <option value="119">Amazon Prime</option>
                                <option value="341">BluTV</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-warning"><i className="bi bi-sort-down"></i> Sıralama Ölçütü</label>
                            <select className="form-select bg-dark text-light border-warning" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="popularity.desc">En Popüler (Trend Olanlar)</option>
                                <option value="primary_release_date.desc">En Yeniler (Çıkış Yılına Göre)</option>
                                <option value="primary_release_date.asc">En Eskiler (Klasikler)</option>
                                <option value="vote_average.desc">En Yüksek Puanlılar (TMDB)</option>
                                <option value="revenue.desc">Gişe Rekortmenleri (Hasılat)</option>
                            </select>
                        </div>

                        <div className="form-check mb-4">
                            <input 
                                className="form-check-input bg-dark border-secondary" 
                                type="checkbox" 
                                id="showWatchedCheck" 
                                checked={showWatched}
                                onChange={(e) => setShowWatched(e.target.checked)}
                            />
                            <label className="form-check-label text-light opacity-75" htmlFor="showWatchedCheck">
                                <i className="bi bi-eye-fill text-info"></i> Daha Önce İzlediklerimi Göster
                            </label>
                        </div>

                        <button type="submit" className="btn btn-danger w-100"><i className="bi bi-search"></i> Filmleri Getir</button>
                    </form>
                </div>
            </div>

            {/* SAĞ PANEL: FİLM SONUÇLARI */}
            <div className="col-md-9">
                <h4 className="text-light mb-4">Keşif Sonuçları</h4>
                {loading ? (
                    <div className="text-light">Yükleniyor...</div>
                ) : (
                    <div className="row g-4">
                        {movies.length === 0 && <p className="text-muted">Aradığınız kriterlere uygun film bulunamadı.</p>}
                        {movies.map(movie => (
                            <div key={movie.id} className="col-md-4 col-lg-3">
                                <Link to={`/movie/${movie.id}`} state={{ movie }} className="text-decoration-none">
                                    <div className="card h-100 bg-dark text-white shadow-sm" style={{ cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }} 
                                         onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                        <img 
                                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                                            className="card-img-top rounded" 
                                            alt={movie.title} 
                                        />
                                        <div className="card-body p-2 text-center">
                                            <h6 className="card-title text-truncate mb-1">{movie.title}</h6>
                                            <span className="badge bg-danger"><i className="bi bi-star-fill text-warning"></i> {movie.vote_average.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* YENİ: KLASİK SAYFALAMA (PAGINATION) BİLEŞENİ */}
                {!loading && movies.length > 0 && (
                    <nav className="mt-5 mb-5 d-flex justify-content-center">
                        <ul className="pagination pagination-lg" data-bs-theme="dark">
                            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                <button className="page-link bg-dark text-light border-secondary" onClick={() => setPage(page - 1)}>
                                    &laquo; Önceki
                                </button>
                            </li>
                            
                            {/* Göstermelik sayfa numaraları (1, 2, 3...) */}
                            {[...Array(5)].map((_, i) => {
                                const p = i + (page > 2 ? page - 2 : 1);
                                return (
                                    <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                                        <button className={`page-link border-secondary ${page === p ? 'bg-danger border-danger text-light' : 'bg-dark text-light'}`} onClick={() => setPage(p)}>
                                            {p}
                                        </button>
                                    </li>
                                );
                            })}

                            <li className={`page-item ${movies.length < 20 ? 'disabled' : ''}`}>
                                <button className="page-link bg-dark text-light border-secondary" onClick={() => setPage(page + 1)}>
                                    Sonraki &raquo;
                                </button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
}

export default Discover;