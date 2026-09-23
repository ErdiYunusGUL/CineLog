import { useState, useEffect } from "react";
import api from '../api';
import { Link, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Star, ChevronLeft, ChevronRight, Sparkles, Bot, Clock } from 'lucide-react';

function Home() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeWindow, setTimeWindow] = useState('day'); 
    const [page, setPage] = useState(1);

    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [favoriteGenreName, setFavoriteGenreName] = useState("");
    const [dashboardNotifications, setDashboardNotifications] = useState([]);

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');

    useEffect(() => {
        setLoading(true);

        const token = localStorage.getItem('token');
        if (token && !searchQuery) {
            let userId = null;
            try {
                const decoded = jwtDecode(token);
                userId = decoded.nameid; 
            } catch (err) {
                console.error("Token decode hatası", err);
            }

            if (userId) {
                api.get(`/Recommendations/user/${userId}`)
                   .then(res => {
                       setRecommendedMovies(res.data.recommendedMovies || []);
                       setFavoriteGenreName(res.data.favoriteGenreName || "");
                       
                       const notes = [];
                       if (res.data.favoriteGenreName) {
                           notes.push(`Sistem analizine göre en çok <strong>${res.data.favoriteGenreName}</strong> türünde filmler seviyorsun.`);
                       }
                       if (res.data.totalReviews > 0) {
                           notes.push(`Şu ana kadar <strong>${res.data.totalReviews}</strong> film inceledin. Harika gidiyorsun!`);
                       }
                       setDashboardNotifications(notes);
                   })
                   .catch(err => {
                       console.error("Öneri sistemi hatası:", err);
                   });
            } else {
                setRecommendedMovies([]);
                setDashboardNotifications([]);
            }
        } else {
            setRecommendedMovies([]);
            setDashboardNotifications([]);
        }

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
        else {
            api.get(`/Movies/popular?timeWindow=${timeWindow}&page=${page}`)
                .then(response => {
                    setMovies(response.data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Filmler çekilirken hata oluştu:", error);
                    setLoading(false);
                });
        }
    }, [searchQuery, timeWindow, page]);
    
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                <h4 className="text-red-500 font-medium animate-pulse">Filmler Yükleniyor...</h4>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            
            {/* AKILLI BİLDİRİMLER (SMART DASHBOARD) */}
            {dashboardNotifications.length > 0 && !searchQuery && (
                <div className="space-y-4">
                    {dashboardNotifications.map((note, index) => (
                        <div key={index} className="flex items-center gap-4 bg-blue-900/10 border-l-4 border-blue-500 text-blue-100 p-4 rounded-r-xl shadow-lg backdrop-blur-sm">
                            <Bot className="w-6 h-6 text-blue-400 flex-shrink-0" />
                            <div className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: note }}></div>
                        </div>
                    ))}
                </div>
            )}

            {/* ÖNERİLENLER İÇERİĞİ (Netflix Tarzı) */}
            {recommendedMovies.length > 0 && !searchQuery && (
                <div className="bg-gradient-to-br from-black/80 to-black/40 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
                    {/* Arka plan süslemesi */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    
                    <h4 className="flex items-center gap-3 text-2xl font-bold text-white mb-6 relative z-10">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        Sizin İçin Önerilenler
                        <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ml-2 shadow-[0_0_10px_rgba(229,9,20,0.5)]">
                            {favoriteGenreName}
                        </span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
                        {recommendedMovies.map(movie => (
                            <Link key={movie.id} to={`/movie/${movie.id}`} state={{ movie }} style={{ textDecoration: 'none' }}>
                                <div className="group relative rounded-xl overflow-hidden cursor-pointer shadow-lg aspect-[2/3] bg-zinc-900 border border-white/5 hover:border-red-500/50 transition-all duration-300">
                                    <img 
                                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        alt={movie.title} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                        <h6 className="text-white text-sm font-bold truncate w-full text-center">{movie.title}</h6>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* POPÜLER / ARAMA SONUÇLARI BAŞLIĞI VE FİLTRELER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h4 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    {searchQuery ? "Arama Sonuçları" : "Popüler Filmler"}
                </h4>
                
                {!searchQuery && (
                    <div className="flex rounded-lg overflow-hidden border border-white/10 shadow-lg bg-black/50 backdrop-blur-sm">
                        {['day', 'week', 'year', 'all'].map((tw) => {
                            const labels = { 'day': 'Günün', 'week': 'Haftanın', 'year': 'Yılın', 'all': 'Tüm Zamanlar' };
                            const isActive = timeWindow === tw;
                            return (
                                <button 
                                    key={tw}
                                    type="button" 
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-r border-white/5 last:border-0 ${
                                        isActive 
                                            ? 'bg-red-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                    onClick={() => { setTimeWindow(tw); setPage(1); }}
                                >
                                    {labels[tw]}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ANA FİLM GRİDİ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {movies.map(movie => (
                    <Link key={movie.id} to={`/movie/${movie.id}`} state={{ movie: movie }} style={{ textDecoration: 'none' }}>
                        <div className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 cursor-pointer shadow-xl aspect-[2/3]">
                            <img 
                                src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                                alt={movie.title} 
                            />
                            
                            {/* Parlayan Hover Sınırı (Glow Effect) */}
                            <div className="absolute inset-0 border-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl z-20 pointer-events-none"></div>

                            {/* Gölge (Gradient) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                            
                            {/* İçerik Kutusu (Aşağıdan Yukarı Kayar) */}
                            <div className="absolute bottom-0 left-0 w-full p-4 md:p-5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 z-20">
                                <h6 className="text-white font-bold text-lg md:text-xl mb-2 line-clamp-2 leading-tight drop-shadow-md">
                                    {movie.title}
                                </h6>
                                <div className="flex justify-between items-center text-sm mt-3">
                                    <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-md font-semibold border border-white/10">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> 
                                        {movie.vote_average.toFixed(1)}
                                    </span>
                                    <span className="text-gray-300 font-medium flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                        <Clock className="w-3 h-3" />
                                        {movie.release_date ? movie.release_date.substring(0,4) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* GELİŞMİŞ SAYFALAMA (ADVANCED PAGINATION) */}
            {!searchQuery && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-16 pb-12">
                    
                    {/* Sayfa Numaraları Bloğu */}
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        {/* Önceki Butonu */}
                        <button 
                            className="flex items-center justify-center w-10 h-10 bg-zinc-900 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ borderRadius: '50px' }}
                            disabled={page === 1} 
                            onClick={() => {
                                setPage(p => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Önceki"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {/* Sayfa Numaraları */}
                        {(() => {
                            const totalPages = 500; // TMDB varsayılan maksimum sayfa
                            const current = page;
                            const delta = 1; // Aktif sayfanın sağında ve solunda kaç sayı gösterilsin
                            const range = [];
                            const rangeWithDots = [];
                            let l;

                            for (let i = 1; i <= totalPages; i++) {
                                if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                                    range.push(i);
                                }
                            }

                            for (let i of range) {
                                if (l) {
                                    if (i - l === 2) {
                                        rangeWithDots.push(l + 1);
                                    } else if (i - l !== 1) {
                                        rangeWithDots.push('...');
                                    }
                                }
                                rangeWithDots.push(i);
                                l = i;
                            }

                            return rangeWithDots.map((num, idx) => (
                                num === '...' ? (
                                    <span key={`dot-${idx}`} className="px-2 text-gray-500 font-bold tracking-widest">...</span>
                                ) : (
                                    <button 
                                        key={num} 
                                        onClick={() => {
                                            setPage(num);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{ borderRadius: '50px' }}
                                        className={`w-10 h-10 flex items-center justify-center font-bold transition-all duration-300 border ${
                                            page === num 
                                                ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(229,9,20,0.5)] scale-110 z-10' 
                                                : 'bg-zinc-900 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                )
                            ));
                        })()}
                        
                        {/* Sonraki Butonu */}
                        <button 
                            className="flex items-center justify-center w-10 h-10 bg-zinc-900 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ borderRadius: '50px' }}
                            disabled={page === 500}
                            onClick={() => {
                                setPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Sonraki"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Işınlanma (Hızlı Geçiş - Jump to Page) Modülü */}
                    <form 
                        className="flex items-center gap-2 bg-black/60 border border-white/10 p-1.5 backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                        style={{ borderRadius: '50px' }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            const val = parseInt(e.target.pageInput.value);
                            if (val >= 1 && val <= 500) {
                                setPage(val);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                e.target.pageInput.value = '';
                            }
                        }}
                    >
                        <span className="text-gray-400 text-sm font-medium pl-3">Sayfa Git:</span>
                        <input 
                            name="pageInput" 
                            type="number" 
                            min="1" 
                            max="500" 
                            placeholder="1-500" 
                            className="w-16 h-8 bg-white/5 border border-white/10 text-white text-center text-sm outline-none focus:border-red-500 focus:bg-black/80 transition-colors"
                            style={{ borderRadius: '50px' }}
                        />
                        <button 
                            type="submit" 
                            className="h-8 px-4 bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors shadow-[0_0_10px_rgba(229,9,20,0.3)]"
                            style={{ borderRadius: '50px' }}
                        >
                            Uç 🚀
                        </button>
                    </form>

                </div>
            )}
        </div>
    );
}

export default Home;
