import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function PersonDetail() {
    const { id } = useParams();
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get('/Movies/person/' + id)
            .then(res => {
                setPerson(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError('Kişi bilgileri yüklenemedi.');
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !person) {
        return <div className="text-center text-red-500 mt-10">{error}</div>;
    }

    // Filmleri azalan popülerliğe veya çıkış yılına göre sıralayabiliriz.
    // Yönettiği veya oynadığı filmler movie_credits objesinde gelir.
    const castMovies = person.movie_credits?.cast || [];
    const crewMovies = person.movie_credits?.crew || [];
    
    // Eğer bir yönetmense (örn: Christopher Nolan), crew listesinde Director olanları bulmalıyız.
    const directedMovies = crewMovies.filter(c => c.job === 'Director');
    
    // En iyileri (veya en bilinenleri) listelemek için kısa birleştirme
    const isDirector = directedMovies.length > 0;
    const displayMovies = isDirector ? directedMovies : castMovies;

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col md:flex-row gap-8 bg-[#0a0a0c] p-6 md:p-10 rounded-3xl border border-white/5 shadow-2xl">
                
                {/* Sol: Profil Fotoğrafı */}
                <div className="w-full md:w-1/3 lg:w-1/4">
                    {person.profile_path ? (
                        <img 
                            src={'https://image.tmdb.org/t/p/w500' + person.profile_path} 
                            alt={person.name} 
                            className="w-full rounded-2xl shadow-xl border border-white/10"
                        />
                    ) : (
                        <div className="w-full aspect-[2/3] bg-gray-900 rounded-2xl flex items-center justify-center border border-white/10">
                            <span className="text-gray-500 text-6xl">?</span>
                        </div>
                    )}
                </div>

                {/* Sağ: Bilgiler */}
                <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{person.name}</h1>
                    <div className="text-gray-400 text-sm mb-6 flex items-center gap-4">
                        {person.birthday && (
                            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                Doğum: {person.birthday}
                            </span>
                        )}
                        {person.place_of_birth && (
                            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                {person.place_of_birth}
                            </span>
                        )}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-3">Biyografi</h3>
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base opacity-80">
                            {person.biography || "Bu kişi için henüz bir biyografi girilmemiş."}
                        </p>
                    </div>

                    {/* Filmler (Grid) */}
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">
                            {isDirector ? 'Yönettiği Filmler' : 'Oynadığı Filmler'}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {displayMovies.slice(0, 15).map(movie => (
                                <Link 
                                    to={'/movie/' + movie.id} 
                                    key={movie.id}
                                    className="group relative rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-red-500/50 transition-all"
                                >
                                    {movie.poster_path ? (
                                        <img 
                                            src={'https://image.tmdb.org/t/p/w300' + movie.poster_path} 
                                            alt={movie.title}
                                            className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full aspect-[2/3] flex items-center justify-center bg-gray-800">
                                            <span className="text-gray-500 text-xs text-center p-2">{movie.title}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                        <span className="text-white text-sm font-bold text-center w-full truncate">
                                            {movie.title}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default PersonDetail;

