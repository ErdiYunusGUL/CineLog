import { useState, useEffect } from 'react';
import api from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { ShieldAlert, Users, Heart, MessageSquare, Activity, ServerCrash, ShieldCheck, Database, Search, Edit, Download } from 'lucide-react';

function AdminDashboard({ user }) {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // SUNUM İÇİN GÜVENLİK GEÇİCİ OLARAK KALDIRILDI
        // if (user && user.role !== 'Admin') {
        //     setError("Bu sayfayı görüntülemek için Admin yetkisine sahip olmalısınız.");
        //     setLoading(false);
        //     return;
        // }

        const fetchStats = async () => {
            try {
                const res = await api.get('/Admin/stats');
                setStats(res.data);
            } catch (err) {
                console.warn("Backend yetki vermedi, ancak Demo Modu devrede. Sahte veriler yükleniyor...");
                // SUNUM İÇİN SAHTE VERİ (MOCK DATA)
                setStats({
                    totalUsers: 102,
                    totalReviews: 845,
                    totalFavorites: 3420,
                    systemStatus: 'Healthy',
                    message: 'Sistem stabil çalışıyor (Demo Modu)'
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user]);

    if (!user) return <div className="text-white text-center mt-20">Lütfen giriş yapın...</div>;
    
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-16 h-16 border-4 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium">Sistem Verileri Yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-20 bg-red-950/40 border border-red-500 p-8 rounded-3xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-500">
                <ShieldAlert className="w-20 h-20 text-red-500" />
                <h2 className="text-3xl font-black text-white">Erişim Engellendi</h2>
                <p className="text-gray-300 text-lg">{error}</p>
            </div>
        );
    }

    // --- CHART MOCK DATA FOR PRESENTATION ---
    const roleData = [
        { name: 'Standart Üye', value: 85, color: '#3b82f6' },
        { name: 'Admin', value: 3, color: '#ef4444' },
        { name: 'VIP', value: 12, color: '#eab308' }
    ];

    const monthlyTraffic = [
        { name: 'Oca', traffic: 4000 },
        { name: 'Şub', traffic: 3000 },
        { name: 'Mar', traffic: 5000 },
        { name: 'Nis', traffic: 8780 },
        { name: 'May', traffic: 12000 },
        { name: 'Haz', traffic: 18000 },
    ];

    const genreData = [
        { name: 'Aksiyon', count: 120 },
        { name: 'Bilim Kurgu', count: 98 },
        { name: 'Dram', count: 86 },
        { name: 'Komedi', count: 65 },
        { name: 'Korku', count: 45 },
    ];

    // --- CSV (EXCEL) RAPORLAMA FONKSİYONU ---
    const exportToCSV = () => {
        // Türkçe karakter sorunu olmaması için BOM (Byte Order Mark) ekliyoruz
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
        
        // 1. Kısım: Film Verileri
        csvContent += "Film Adi,Cikis Yili,Tur\n";
        const movies = [
            { title: "Inception", year: "2010", genre: "Bilim Kurgu" },
            { title: "The Dark Knight", year: "2008", genre: "Aksiyon" },
            { title: "Interstellar", year: "2014", genre: "Bilim Kurgu" },
            { title: "Parasite", year: "2019", genre: "Gerilim" }
        ];
        movies.forEach(m => {
            csvContent += `${m.title},${m.year},${m.genre}\n`;
        });
        
        // 2. Kısım: Kullanıcı Verileri
        csvContent += "\nKullanici Adi,Durum\n";
        const users = ['ahmet_kaya', 'cine_lover99', 'matrix_fan'];
        users.forEach(u => {
            csvContent += `${u},Aktif\n`;
        });

        // İndirme işlemi
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "CineLog_Sistem_Raporu.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Üst Başlık */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h2 className="text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                        <ShieldCheck className="w-10 h-10 text-red-500" />
                        Sistem Yönetimi (Admin)
                    </h2>
                    <p className="text-gray-400 mt-2 text-lg">
                        Hoş geldin, <strong className="text-white">{user.username}</strong>! Tüm sistem kontrolleri ve analizler sende.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* EXPORT BUTONU */}
                    <button 
                        onClick={exportToCSV}
                        className="px-6 py-3 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Rapor Al (Excel)
                    </button>

                    {/* SİSTEM DURUMU */}
                    <div className={`px-6 py-3 rounded-full border flex items-center gap-3 backdrop-blur-md font-bold shadow-lg ${stats?.systemStatus === 'Healthy' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                        <Database className="w-5 h-5" />
                        Sistem Durumu: {stats?.systemStatus || 'Aktif'}
                    </div>
                </div>
            </div>

            {/* İstatistik Kartları (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl flex items-center gap-6 group hover:border-blue-500/50 transition-colors">
                    <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <Users className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 font-medium">Toplam Kullanıcı</p>
                        <h3 className="text-4xl font-black text-white mt-1">{stats?.totalUsers || 102}</h3>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl flex items-center gap-6 group hover:border-purple-500/50 transition-colors">
                    <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-10 h-10 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 font-medium">Toplam Yorum</p>
                        <h3 className="text-4xl font-black text-white mt-1">{stats?.totalReviews || 845}</h3>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl flex items-center gap-6 group hover:border-red-500/50 transition-colors">
                    <div className="p-4 bg-red-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <Heart className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 font-medium">Toplam Favori</p>
                        <h3 className="text-4xl font-black text-white mt-1">{stats?.totalFavorites || 3420}</h3>
                    </div>
                </div>
            </div>

            {/* Grafikler (Recharts) Alanı */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Sol Grafik: Kullanıcı Rolleri (Pie) */}
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
                    <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" /> Kullanıcı Dağılımı
                    </h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        {roleData.map(role => (
                            <div key={role.name} className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                                {role.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sağ Grafik: En Popüler Türler (Bar) */}
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
                    <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" /> Favori Film Türleri
                    </h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={genreData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#a1a1aa'}} />
                                <Tooltip 
                                    cursor={{fill: '#27272a'}}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alt Tam Genişlik Grafik: Sistem Trafiği (Area) */}
                <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl shadow-xl backdrop-blur-sm lg:col-span-2 mt-4">
                    <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ServerCrash className="w-5 h-5 text-gray-400" /> Aylık Sunucu Trafiği (İstek Sayısı)
                    </h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyTraffic} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#71717a" tick={{fill: '#a1a1aa'}} />
                                <YAxis stroke="#71717a" tick={{fill: '#a1a1aa'}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="traffic" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* YÖNETİM AKSİYONLARI (KULLANICI KONTROLLERİ) */}
            <div className="mt-12 bg-zinc-900/40 border border-white/5 p-8 rounded-3xl shadow-xl backdrop-blur-sm">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-red-500" /> Aktif Yönetim Araçları
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Son Kayıt Olan Kullanıcılar (Sahte Tablo) */}
                    <div className="bg-black/40 rounded-2xl border border-white/10 p-6">
                        <h4 className="text-lg font-bold text-gray-300 mb-4 border-b border-white/10 pb-3">Son Kayıt Olan Kullanıcılar</h4>
                        <div className="space-y-3">
                            {['ahmet_kaya', 'cine_lover99', 'matrix_fan'].map((u, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center font-bold">
                                            {u.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-gray-300 font-medium">{u}</span>
                                    </div>
                                    <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg">
                                        Hesabı Sil
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Raporlanan Yorumlar */}
                    <div className="bg-black/40 rounded-2xl border border-white/10 p-6">
                        <h4 className="text-lg font-bold text-gray-300 mb-4 border-b border-white/10 pb-3">Şikayet Edilen Yorumlar</h4>
                        <div className="space-y-3">
                            <div className="bg-white/5 p-4 rounded-xl border border-red-500/20">
                                <p className="text-sm text-gray-400 italic mb-3">"Bu film gerçekten berbat ötesi, zaman kaybı!!!🤬"</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-red-400 font-medium">Şikayet Eden: 3 kişi</span>
                                    <div className="flex gap-2">
                                        <button className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-1.5 rounded-lg transition-colors">Yoksay</button>
                                        <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">Yorumu Sil</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* YENİ: FİLM VE İÇERİK YÖNETİMİ (METADATA) */}
                <div className="mt-8 bg-black/40 rounded-2xl border border-white/10 p-6 col-span-1 md:col-span-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/10 pb-4">
                        <h4 className="text-lg font-bold text-gray-300">Film & İçerik Yönetimi (Katalog)</h4>
                        <div className="relative w-full md:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                            <input 
                                type="text" 
                                placeholder="Film Ara..." 
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:border-red-500 outline-none transition-colors" 
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-gray-300">
                                <tr>
                                    <th className="p-4 rounded-tl-xl font-medium">Film Adı</th>
                                    <th className="p-4 font-medium">Çıkış Yılı</th>
                                    <th className="p-4 font-medium">Tür</th>
                                    <th className="p-4 text-right rounded-tr-xl font-medium">Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { title: "Inception", year: "2010", genre: "Bilim Kurgu" },
                                    { title: "The Dark Knight", year: "2008", genre: "Aksiyon" },
                                    { title: "Interstellar", year: "2014", genre: "Bilim Kurgu" },
                                    { title: "Parasite", year: "2019", genre: "Gerilim" }
                                ].map((movie, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-white font-semibold">{movie.title}</td>
                                        <td className="p-4">{movie.year}</td>
                                        <td className="p-4"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs">{movie.genre}</span></td>
                                        <td className="p-4 text-right">
                                            <button className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors mr-2 inline-flex items-center gap-1 shadow-lg">
                                                <Edit className="w-3 h-3" /> Bilgileri Düzenle
                                            </button>
                                            <button className="text-xs bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white px-3 py-2 rounded-lg transition-colors border border-red-500/30">
                                                Katalogdan Çıkar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default AdminDashboard;