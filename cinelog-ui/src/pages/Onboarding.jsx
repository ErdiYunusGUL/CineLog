import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Onboarding() {
    const [movies, setMovies] = useState([]);
    const [selectedMovieIds, setSelectedMovieIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // C# API'den rastgele 45 filmi getir
        api.get('/Movies/onboarding')
           .then(res => {
               setMovies(res.data);
               setLoading(false);
           })
           .catch(err => {
               console.error(err);
               setLoading(false);
           });
    }, []);

    const toggleMovieSelection = (movieId) => {
        if (selectedMovieIds.includes(movieId)) {
            setSelectedMovieIds(selectedMovieIds.filter(id => id !== movieId));
        } else {
            setSelectedMovieIds([...selectedMovieIds, movieId]);
        }
    };

    // TMDB Tür Kodları Sözlüğü
    const TMDB_GENRES = { 
        28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç", 
        99: "Belgesel", 18: "Dram", 10751: "Aile", 14: "Fantastik", 36: "Tarih", 
        27: "Korku", 10402: "Müzik", 9648: "Gizem", 10749: "Romantik", 
        878: "Bilim Kurgu", 10770: "TV Filmi", 53: "Gerilim", 10752: "Savaş", 37: "Vahşi Batı" 
    };

    const handleProfileSubmit = async () => {
        if (selectedMovieIds.length < 3) {
            alert("Sizi daha iyi tanıyabilmemiz için lütfen en az 3 film seçin!");
            return;
        }

        try {
            // 1. Seçilen filmlerin tüm bilgilerini (özellikle tür kodlarını) filtrele
            const selectedMoviesData = movies.filter(m => selectedMovieIds.includes(m.id));
            
            // 2. Türlerin kaçar defa geçtiğini sayacak boş bir sayaç
            const genreCounts = {};
            selectedMoviesData.forEach(movie => {
                movie.genre_ids.forEach(gId => {
                    genreCounts[gId] = (genreCounts[gId] || 0) + 1;
                });
            });

            // 3. En çok tekrar eden türü (Max) bul
            let topGenreId = null;
            let maxCount = 0;
            for (const [gId, count] of Object.entries(genreCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    topGenreId = parseInt(gId);
                }
            }

            const topGenreName = TMDB_GENRES[topGenreId] || "Bilinmiyor";

            // 4. Analiz sonucunu C# API'ye (Veritabanına) kaydetmesi için yolla!
            await api.post('/Interactions/taste-profile', {
                favoriteGenreId: topGenreId,
                favoriteGenreName: topGenreName
            });

            alert(`Mükemmel zevkleriniz var! En çok sevdiğiniz tür: ${topGenreName} \n\nZevk profiliniz başarıyla kaydedildi.`);
            navigate('/'); // İşlem bitince ana sayfaya dön

        } catch (error) {
            if (error.response?.status === 401) {
                alert("Lütfen önce sisteme giriş yapın (Login). Çünkü profilinizi kaydedebilmek için sizi tanımalıyız!");
                navigate('/login');
            } else {
                console.error("Zevk profili kaydedilirken hata:", error);
                alert("Bir hata oluştu.");
            }
        }
    };

    return (
        <div className="container mt-4 mb-5 pb-5 text-center">
            <h2 className="text-light fw-bold mb-3"><i className="bi bi-magic text-danger"></i> Zevk Profilinizi Oluşturalım</h2>
            <p className="text-muted fs-5 mb-5">Sizi daha iyi tanıyabilmemiz ve harika öneriler sunabilmemiz için aşağıdan sevdiğiniz filmleri seçin.</p>
            
            {loading ? (
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            ) : (
                <>
                    <div className="row g-3 text-start mb-5">
                        {movies.map(movie => {
                            const isSelected = selectedMovieIds.includes(movie.id);
                            return (
                                <div key={movie.id} className="col-4 col-md-3 col-lg-2">
                                    <div 
                                        onClick={() => toggleMovieSelection(movie.id)}
                                        className={`card bg-dark text-white h-100 ${isSelected ? 'border-success' : 'border-dark'}`}
                                        style={{ 
                                            cursor: 'pointer', 
                                            borderWidth: isSelected ? '4px' : '0px',
                                            transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                                            transition: 'all 0.2s ease-in-out',
                                            opacity: isSelected ? 1 : 0.8
                                        }}>
                                        <img 
                                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                                            className="card-img-top rounded" 
                                            alt={movie.title} 
                                        />
                                        {isSelected && (
                                            <div className="position-absolute top-0 end-0 p-2">
                                                <i className="bi bi-check-circle-fill text-success fs-3 bg-dark rounded-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="position-fixed bottom-0 start-0 w-100 p-3 shadow-lg" style={{ backgroundColor: 'rgba(18, 18, 18, 0.95)', zIndex: 1000, borderTop: '1px solid #333' }}>
                        <div className="container d-flex justify-content-between align-items-center">
                            <span className="text-light fs-5">Seçilen Film Sayısı: <strong className="text-danger">{selectedMovieIds.length}</strong></span>
                            <button 
                                onClick={handleProfileSubmit} 
                                className={`btn btn-lg ${selectedMovieIds.length >= 3 ? 'btn-danger' : 'btn-secondary disabled'}`}>
                                Zevk Profilimi Oluştur <i className="bi bi-arrow-right-circle"></i>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Onboarding;
