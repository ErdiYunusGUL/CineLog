import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, RotateCcw, Clapperboard, Star, Film, CheckCircle2 } from 'lucide-react';
import api from '../api';

const questions = [
    {
        id: 'mood',
        title: "Şu an ruh halin nasıl?",
        options: [
            { label: "🚀 Adrenalin ve Aksiyon", value: "Aksiyon dolu ve bol adrenalinli" },
            { label: "😂 Gülmek ve Dağıtmak", value: "Komik, eğlenceli ve keyifli" },
            { label: "😢 Melankolik / Duygusal", value: "Duygusal, ağlatan veya dramatik" },
            { label: "🤯 Beyin Yakan / Zihin Açıcı", value: "Düşündüren, karmaşık kurgulu, mindfuck" },
            { label: "😱 Gerilim / Korkutucu", value: "Korkutan, gerilim dolu ve karanlık" },
            { label: "😌 Sakin ve Huzurlu", value: "Sakinleştiren, huzur veren, tatlı" },
            { label: "🕵️ Gizem Çözmek İstiyorum", value: "Gizemli, dedektiflik veya suç barındıran" }
        ]
    },
    {
        id: 'pace',
        title: "Nasıl bir tempo arıyorsun?",
        options: [
            { label: "⚡ Hızlı ve Nefes Kesen", value: "Çok hızlı tempolu, hiç durmayan" },
            { label: "🍿 Çerezlik (Yormayan)", value: "Kafa yormayan, izlemesi çok rahat" },
            { label: "🕰️ Yavaş, Sindire Sindire", value: "Yavaş tempolu, sanatsal ve derinlikli" },
            { label: "🎢 Sürekli Ters Köşe", value: "Sürekli şaşırtan, plot-twist dolu" },
            { label: "🎭 Bol Diyaloglu ve Derin", value: "Karakter odaklı, diyalog ağırlıklı" }
        ]
    },
    {
        id: 'era',
        title: "Hangi dönemin atmosferi seni çeker?",
        options: [
            { label: "🎩 Siyah Beyaz Klasikler", value: "1960 öncesi eski klasikler" },
            { label: "🪩 Retro Ruh (70'ler ve 80'ler)", value: "70'ler veya 80'ler dönemine ait" },
            { label: "📼 Nostalji Şöleni (90'lar)", value: "90'lı yılların efsane filmleri" },
            { label: "💿 Y Kuşağı Efsaneleri (2000'ler)", value: "2000'li yılların başyapıtları" },
            { label: "📱 Modern Sinema (2010+)", value: "2010 sonrası yeni ve modern filmler" },
            { label: "🛸 Fark Etmez, İyi Olsun", value: "Çıkış yılı fark etmez, her dönemden olabilir" }
        ]
    },
    {
        id: 'focus',
        title: "Senin için en önemli unsur nedir?",
        options: [
            { label: "📖 Kusursuz Bir Senaryo", value: "Senaryosu ve hikayesi mükemmel olan" },
            { label: "🎥 Görsel Şölen / Sinematografi", value: "Görselliği, renkleri ve çekimleri harika olan" },
            { label: "🎭 Oscarlık Oyunculuklar", value: "Karakter performansları ve oyunculukları efsane olan" },
            { label: "🎵 Etkileyici Müzikler", value: "Soundtrackleri ve müzikleri unutulmaz olan" },
            { label: "💥 Mükemmel Efektler (VFX)", value: "Görsel efektleri (CGI) ve teknolojisi üst düzey olan" }
        ]
    }
];

function AIMatchmaker() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    const handleSelect = (questionId, value) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);
        
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            submitToAI(newAnswers);
        }
    };

    const submitToAI = async (finalAnswers) => {
        setLoading(true);
        setError('');
        
        const prompt = `Benim film tercihlerim şunlar:
- Ruh Halim: ${finalAnswers.mood}
- İstediğim Tempo: ${finalAnswers.pace}
- Film Dönemi: ${finalAnswers.era}
- Benim İçin En Önemlisi: ${finalAnswers.focus}

Bana bu kriterlere %100 uyan, birbirinden farklı ve kaliteli 3 adet film öner.
ÖNEMLİ KURALLAR:
1. Yanıtın SADECE ve SADECE JSON formatında olmalıdır.
2. Markdown backtick'leri (üç adet ters tırnak) KULLANMA. Doğrudan [{ ile başla.
3. JSON yapısı şu şekilde olmalıdır:
[
  { "title": "Orijinal Film Adı", "reason": "Neden bu film tam bana göre? (kısa ve vurucu 2-3 cümle)" }
]`;

        try {
            // 1. Ask AI
            const aiResponse = await api.post('/Ai/chat', { message: prompt });
            let jsonString = aiResponse.data.response;
            let aiMovies = [];
            
            // Eğer backend'deki API Key kotası dolmuşsa veya hata mesajı döndüyse:
            if (!jsonString || jsonString.includes("Yapay zeka") || !jsonString.includes("[")) {
                console.warn("AI Backend API Error/Quota Reached. Using Smart Fallback Algorithm.");
                
                // MİNYATÜR TAVSİYE MOTORU (SMART FALLBACK ALGORITHM)
                const fallbackDatabase = [
                    { title: "Mad Max: Fury Road", moods: ["Aksiyon"], paces: ["Nefes Kesen"], eras: ["2010+"], focuses: ["Görsellik", "Efektler", "Müzikler"], reason: "Nefes kesici aksiyonu, hiç durmayan temposu ve inanılmaz görsel şöleniyle tam sana göre." },
                    { title: "The Dark Knight", moods: ["Aksiyon", "Gerilim", "Gizem"], paces: ["Nefes Kesen", "Ters Köşe"], eras: ["2000"], focuses: ["Oyunculuk", "Senaryo"], reason: "Muazzam oyunculukları (özellikle Joker) ve zekice yazılmış karanlık atmosferiyle aradığın başyapıt." },
                    { title: "Inception", moods: ["Beyin Yakan", "Aksiyon", "Gizem"], paces: ["Ters Köşe", "Nefes Kesen"], eras: ["2010+"], focuses: ["Senaryo", "Efektler", "Görsellik"], reason: "Zihninin sınırlarını zorlayacak senaryosu, Nolan'ın yönetmenliği ve muazzam efektleriyle kusursuz." },
                    { title: "Interstellar", moods: ["Duygusal", "Beyin Yakan"], paces: ["Yavaş", "Nefes Kesen"], eras: ["2010+"], focuses: ["Müzikler", "Görsellik", "Senaryo"], reason: "Hans Zimmer'ın unutulmaz müzikleri eşliğinde uzayın derinliklerindeki duygusal bir görsel şölen." },
                    { title: "12 Angry Men", moods: ["Beyin Yakan", "Gerilim"], paces: ["Diyaloglu", "Yavaş"], eras: ["Klasikler"], focuses: ["Senaryo", "Oyunculuk"], reason: "Tek bir odada geçmesine rağmen efsanevi diyalogları ve oyunculuklarıyla seni kilitleyecek." },
                    { title: "The Matrix", moods: ["Beyin Yakan", "Aksiyon", "Gizem"], paces: ["Nefes Kesen", "Ters Köşe"], eras: ["90"], focuses: ["Senaryo", "Efektler"], reason: "90'ların sonunu belirleyen siberpunk felsefesi ve vizyoner senaryosuyla aklını başından alacak." },
                    { title: "Parasite", moods: ["Gerilim", "Beyin Yakan", "Komedi"], paces: ["Ters Köşe", "Diyaloglu"], eras: ["2010+"], focuses: ["Senaryo", "Oyunculuk", "Görsellik"], reason: "Sürekli ters köşe yapan kusursuz senaryosu ve ince mesajlarıyla Oscar'ı sonuna kadar hak eden film." },
                    { title: "The Grand Budapest Hotel", moods: ["Komedi", "Huzurlu"], paces: ["Çerezlik", "Diyaloglu"], eras: ["2010+"], focuses: ["Görsellik", "Senaryo"], reason: "Pastel renkleri, simetrik görselliği ve inanılmaz keyifli, eğlenceli hikayesiyle ruhuna çok iyi gelecek." },
                    { title: "Pulp Fiction", moods: ["Aksiyon", "Komedi", "Gizem"], paces: ["Diyaloglu", "Ters Köşe"], eras: ["90"], focuses: ["Senaryo", "Oyunculuk", "Müzikler"], reason: "Tarantino'nun efsaneleşmiş diyalogları, harika müzikleri ve sıradışı kurgusuyla tam bir 90'lar ruhu." },
                    { title: "Se7en", moods: ["Gerilim", "Gizem", "Korkutucu"], paces: ["Ters Köşe", "Yavaş"], eras: ["90"], focuses: ["Senaryo", "Oyunculuk"], reason: "Karanlık atmosferi, gerilim dozu ve sinema tarihinin en sarsıcı finallerinden biriyle seni ekrana kilitleyecek." },
                    { title: "Amélie", moods: ["Huzurlu", "Duygusal", "Komedi"], paces: ["Yavaş", "Çerezlik"], eras: ["2000"], focuses: ["Müzikler", "Görsellik"], reason: "İçinizi ısıtacak samimi atmosferi, görsel tarzı ve Yann Tiersen'in eşsiz müzikleriyle aradığın huzur." },
                    { title: "Whiplash", moods: ["Gerilim", "Duygusal"], paces: ["Nefes Kesen", "Diyaloglu"], eras: ["2010+"], focuses: ["Müzikler", "Oyunculuk"], reason: "Bir müzik filmi olmasına rağmen aksiyon temposunda ilerleyen ve nefes kesici oyunculuklarıyla unutulmaz olan yapım." },
                    { title: "Shutter Island", moods: ["Beyin Yakan", "Gizem", "Gerilim"], paces: ["Ters Köşe", "Yavaş"], eras: ["2010+"], focuses: ["Senaryo", "Oyunculuk", "Müzikler"], reason: "Son saniyesine kadar gizemini koruyan, atmosferi ve inanılmaz ters köşesiyle beynini yakacak kusursuz bir kurgu." },
                    { title: "Spider-Man: Into the Spider-Verse", moods: ["Aksiyon", "Komedi", "Duygusal"], paces: ["Nefes Kesen", "Çerezlik"], eras: ["2010+"], focuses: ["Görsellik", "Müzikler", "Efektler"], reason: "Görsel stiliyle animasyon dünyasında devrim yaratan, müzikleriyle coşturan harika ve tempolu bir film." },
                    { title: "Good Will Hunting", moods: ["Duygusal", "Huzurlu"], paces: ["Diyaloglu"], eras: ["90"], focuses: ["Senaryo", "Oyunculuk"], reason: "Samimi diyalogları, muhteşem karakter derinliği ve yüreğe dokunan sıcacık senaryosuyla tam bir klasik." },
                    { title: "The Shining", moods: ["Korkutucu", "Gerilim", "Gizem"], paces: ["Yavaş", "Ters Köşe"], eras: ["70-80"], focuses: ["Görsellik", "Oyunculuk", "Müzikler"], reason: "Klostrofobik atmosferi, Kubrick'in görselliği ve ikonik oyunculuklarıyla gerilimi iliklerine kadar hissettirecek." },
                    { title: "Back to the Future", moods: ["Komedi", "Aksiyon", "Huzurlu"], paces: ["Nefes Kesen", "Çerezlik"], eras: ["70-80"], focuses: ["Senaryo", "Müzikler", "Efektler"], reason: "80'ler nostaljisini en tatlı haliyle yaşatan, çok eğlenceli ve muazzam yazılmış, yormayan bir kült bilim kurgu." },
                    { title: "Dune: Part One", moods: ["Gizem", "Aksiyon"], paces: ["Yavaş", "Diyaloglu"], eras: ["2010+"], focuses: ["Görsellik", "Müzikler", "Efektler"], reason: "Devasa görsel dünyası, inanılmaz müzikleri ve epik hikaye anlatımıyla tam anlamıyla bir sinema mucizesi." },
                    { title: "The Truman Show", moods: ["Beyin Yakan", "Komedi", "Duygusal"], paces: ["Ters Köşe", "Diyaloglu"], eras: ["90"], focuses: ["Senaryo", "Oyunculuk"], reason: "Seni kendi gerçekliğini sorgulamaya itecek zekice senaryosu ve eşsiz konusuyla mükemmel bir deneyim." }
                ];

                // Kullanıcının cevaplarını analiz edip tag'lere dönüştürme
                let userMood = "";
                if (finalAnswers.mood.includes("Aksiyon")) userMood = "Aksiyon";
                else if (finalAnswers.mood.includes("Komik")) userMood = "Komedi";
                else if (finalAnswers.mood.includes("Duygusal")) userMood = "Duygusal";
                else if (finalAnswers.mood.includes("Düşündüren")) userMood = "Beyin Yakan";
                else if (finalAnswers.mood.includes("Korkutan")) userMood = "Korkutucu";
                else if (finalAnswers.mood.includes("Sakinleştiren")) userMood = "Huzurlu";
                else if (finalAnswers.mood.includes("Gizemli")) userMood = "Gizem";

                let userPace = "";
                if (finalAnswers.pace.includes("Çok hızlı")) userPace = "Nefes Kesen";
                else if (finalAnswers.pace.includes("Kafa yormayan")) userPace = "Çerezlik";
                else if (finalAnswers.pace.includes("Yavaş")) userPace = "Yavaş";
                else if (finalAnswers.pace.includes("şaşırtan")) userPace = "Ters Köşe";
                else if (finalAnswers.pace.includes("Karakter")) userPace = "Diyaloglu";

                let userEra = "";
                if (finalAnswers.era.includes("1960")) userEra = "Klasikler";
                else if (finalAnswers.era.includes("70'ler")) userEra = "70-80";
                else if (finalAnswers.era.includes("90'lı")) userEra = "90";
                else if (finalAnswers.era.includes("2000'li")) userEra = "2000";
                else if (finalAnswers.era.includes("2010")) userEra = "2010+";
                else userEra = "Hepsi";

                let userFocus = "";
                if (finalAnswers.focus.includes("Senaryo")) userFocus = "Senaryo";
                else if (finalAnswers.focus.includes("Görselliği")) userFocus = "Görsellik";
                else if (finalAnswers.focus.includes("Oyunculukları")) userFocus = "Oyunculuk";
                else if (finalAnswers.focus.includes("Müzikleri")) userFocus = "Müzikler";
                else if (finalAnswers.focus.includes("Efektleri")) userFocus = "Efektler";

                // Puanlama Sistemi
                const scoredMovies = fallbackDatabase.map(movie => {
                    let score = 0;
                    if (movie.moods.includes(userMood)) score += 3; // Ruh hali en önemli (3 puan)
                    if (movie.paces.includes(userPace)) score += 2; // Tempo (2 puan)
                    if (movie.eras.includes(userEra) || userEra === "Hepsi") score += 2; // Dönem (2 puan)
                    if (movie.focuses.includes(userFocus)) score += 3; // Odak noktası (3 puan)
                    
                    // Rastgele ufak küsurat ekle ki aynı puanlılarda hep aynı filmler gelmesin
                    score += Math.random() * 0.5; 
                    
                    return { ...movie, score };
                });

                // En yüksek puanı alan ilk 3 filmi seç
                scoredMovies.sort((a, b) => b.score - a.score);
                aiMovies = scoredMovies.slice(0, 3).map(m => ({ title: m.title, reason: m.reason }));

            } else {
                // Clean markdown blocks if AI ignored the rule
                jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
                aiMovies = JSON.parse(jsonString);
            }

            // 2. Fetch TMDB Data for each movie to get posters
            const enrichedMovies = await Promise.all(aiMovies.map(async (m) => {
                try {
                    const searchRes = await api.get(`/Movies/search?query=${encodeURIComponent(m.title)}`);
                    if (searchRes.data && searchRes.data.length > 0) {
                        const tmdbData = searchRes.data[0];
                        return { ...m, tmdb: tmdbData };
                    }
                } catch (e) {
                    console.error("TMDB Search error for", m.title, e);
                }
                return { ...m, tmdb: null }; // Fallback if not found
            }));

            setResults(enrichedMovies);
        } catch (err) {
            console.error(err);
            setError('Yapay zeka bir hata yaptı. Lütfen tekrar dene.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(0);
        setAnswers({});
        setResults([]);
        setError('');
    };

    // Yükleniyor (Loading) Ekranı
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-500 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
                        Yapay Zeka Milyonlarca Filmi Tarıyor...
                    </h2>
                    <p className="text-gray-400">Ruh haline en uygun olanlar seçiliyor, lütfen bekle.</p>
                </div>
            </div>
        );
    }

    // Sonuç Ekranı
    if (results.length > 0) {
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3">
                        <Sparkles className="w-8 h-8 text-red-500" />
                        Senin İçin Seçilen Filmler
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Cevaplarını analiz ettik ve şu anki ruh haline, istediğin tempoya ve zevkine en uygun bu üç şaheseri bulduk.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {results.map((item, idx) => (
                        <div key={idx} className="bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col group hover:border-red-500/30 transition-colors">
                            {item.tmdb && item.tmdb.poster_path ? (
                                <div className="relative aspect-[2/3] overflow-hidden">
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w500${item.tmdb.poster_path}`}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-white font-bold">{item.tmdb.vote_average.toFixed(1)}</span>
                                        </div>
                                        <span className="text-gray-300 font-medium bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                                            {item.tmdb.release_date?.substring(0,4)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-[2/3] bg-zinc-800 flex items-center justify-center">
                                    <Film className="w-16 h-16 text-gray-600" />
                                </div>
                            )}
                            
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    {item.tmdb ? item.tmdb.title : item.title}
                                </h3>
                                <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-2xl flex-1">
                                    <h4 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <BotIcon className="w-4 h-4" /> Neden Senlik?
                                    </h4>
                                    <p className="text-gray-300 leading-relaxed text-sm">
                                        {item.reason}
                                    </p>
                                </div>

                                {item.tmdb && (
                                    <Link 
                                        to={`/movie/${item.tmdb.id}`} 
                                        state={{ movie: item.tmdb }}
                                        className="mt-6 w-full py-3 bg-white/5 hover:bg-red-600 text-white text-center font-bold rounded-xl transition-colors border border-white/10 hover:border-red-500"
                                    >
                                        Filmi İncele
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-12">
                    <button 
                        onClick={reset}
                        className="flex items-center gap-2 px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-medium transition-colors shadow-lg"
                    >
                        <RotateCcw className="w-5 h-5" /> Testi Tekrarla
                    </button>
                </div>
            </div>
        );
    }

    // Soru Ekranı
    const currentQ = questions[step];

    return (
        <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -z-10 -translate-y-1/2"></div>
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-red-600 -z-10 -translate-y-1/2 transition-all duration-500" 
                    style={{ width: `${(step / (questions.length - 1)) * 100}%` }}
                ></div>
                
                {questions.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                            step > idx 
                                ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]' 
                                : step === idx 
                                    ? 'bg-zinc-900 border-2 border-red-500 text-white scale-110'
                                    : 'bg-zinc-900 border border-white/10 text-gray-500'
                        }`}
                    >
                        {step > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                ))}
            </div>

            {/* Soru Kartı */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl text-center">
                <Clapperboard className="w-12 h-12 text-red-500 mx-auto mb-6 opacity-80" />
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-10">
                    {currentQ.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(currentQ.id, opt.value)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 p-6 rounded-2xl text-left transition-all group shadow-sm hover:shadow-lg flex items-center justify-between"
                        >
                            <span className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                                {opt.label}
                            </span>
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-red-500 transform translate-x-0 group-hover:translate-x-2 transition-all" />
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mt-8 p-4 bg-red-900/30 border border-red-500 text-red-200 rounded-xl">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

// Simple bot icon component for the reason box
function BotIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    )
}

export default AIMatchmaker;
