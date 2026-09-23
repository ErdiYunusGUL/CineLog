import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Film, Compass, Users, Sparkles, User, LogOut, Search, ShieldCheck } from "lucide-react";

function Header1({ user, handleLogout }) {
    const [isOpen, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { title: "Keşfet", href: "/discover", icon: Compass },
        { title: "Topluluk", href: "/community", icon: Users },
        { title: "AI Film Asistanı", href: "/matchmaker", icon: Sparkles },
    ];

    return (
        <header 
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
                scrolled 
                    ? "bg-black/80 backdrop-blur-xl border-white/10 shadow-lg py-3" 
                    : "bg-gradient-to-b from-black/90 to-transparent border-transparent py-5"
            }`}
        >
            <div className="container mx-auto px-4 md:px-8 flex justify-between items-center gap-4">
                
                {/* Sol Alan: Logo ve Menü Linkleri Bir Arada (Logoya Yakın) */}
                <div className="flex items-center gap-8 lg:gap-12">
                    {/* 3D Logo */}
                    <Link to="/" className="flex items-center gap-0 group !text-white" style={{ textDecoration: 'none' }}>
                        <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0 -ml-3">
                            <img 
                                src="/logo-3d.jpg" 
                                alt="CineLog 3D Logo" 
                                className="h-16 w-auto object-contain mix-blend-screen"
                                style={{ filter: 'brightness(1.1) contrast(1.1)' }} 
                            />
                        </div>
                        <span className="font-bold text-2xl tracking-tighter text-white -ml-2">
                            Cine<span className="text-red-600">Log</span>
                        </span>
                    </Link>

                    {/* Masaüstü Menü (Daha büyük ve logoya yakın) */}
                    <nav className="hidden lg:flex items-center gap-6">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.href;
                            
                            return (
                                <Link 
                                    key={link.href} 
                                    to={link.href}
                                    style={{ textDecoration: 'none' }}
                                    className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 px-3 py-2 rounded-full relative group ${
                                        isActive ? "!text-white bg-white/10" : "!text-gray-300 hover:!text-white hover:bg-white/5"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-red-500" : "text-gray-400 group-hover:text-red-400"}`} />
                                    {link.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Sağ Alan: Arama Çubuğu ve Kullanıcı Menüsü */}
                <div className="hidden lg:flex items-center gap-6 flex-1 justify-end">
                    
                    {/* Arama Çubuğu */}
                    <form 
                        className="relative w-full max-w-xs xl:max-w-sm group" 
                        onSubmit={(e) => { e.preventDefault(); window.location.href = `/?search=${e.target.search.value}`; }}
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                        </div>
                        <input 
                            name="search" 
                            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-full pl-10 pr-4 py-2.5 outline-none focus:border-red-500/50 focus:bg-black/50 focus:shadow-[0_0_15px_rgba(229,9,20,0.2)] transition-all placeholder-gray-500" 
                            type="search" 
                            placeholder="Film Ara..." 
                            autoComplete="off"
                        />
                    </form>

                    {/* Auth / Profil Alanı */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4 border border-white/10 bg-white/5 py-1.5 px-2 rounded-full backdrop-blur-md">
                                
                                {user.role === 'Admin' && (
                                    <Link to="/admin" style={{ textDecoration: 'none' }} className="flex items-center gap-1 text-xs font-bold bg-red-600/20 !text-red-500 px-3 py-1.5 rounded-full hover:bg-red-600 hover:!text-white transition-colors border border-red-500/30">
                                        <ShieldCheck className="w-3 h-3" /> Admin
                                    </Link>
                                )}
                                
                                <Link to="/profile" style={{ textDecoration: 'none' }} className="flex items-center gap-2 text-sm font-medium !text-white hover:!text-red-400 transition-colors pl-2">
                                    <User className="w-4 h-4" />
                                    {user.username}
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="p-1.5 bg-white/10 rounded-full hover:bg-red-600 transition-colors group cursor-pointer border-none outline-none"
                                    title="Çıkış Yap"
                                >
                                    <LogOut className="w-4 h-4 text-white group-hover:scale-90 transition-transform" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" style={{ textDecoration: 'none' }} className="text-sm font-medium !text-gray-300 hover:!text-white transition-colors">
                                    Giriş Yap
                                </Link>
                                <Link to="/register" style={{ textDecoration: 'none' }} className="bg-red-600 hover:bg-red-700 !text-white text-sm font-medium py-2 px-5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(229,9,20,0.3)] hover:shadow-[0_0_25px_rgba(229,9,20,0.6)]">
                                    Kayıt Ol
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobil Menü Butonu (Tablet ve Telefon için) */}
                <div className="lg:hidden flex items-center gap-4">
                    <button 
                        className="p-2 text-gray-300 hover:text-white border-none bg-transparent outline-none cursor-pointer"
                        onClick={() => setOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobil Menü Açılır Alanı */}
            <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] border-b border-white/10" : "max-h-0"}`}>
                <div className="bg-black/95 backdrop-blur-xl px-6 py-6 flex flex-col gap-5">
                    
                    {/* Mobil Arama */}
                    <form 
                        className="relative w-full mb-2" 
                        onSubmit={(e) => { e.preventDefault(); window.location.href = `/?search=${e.target.search.value}`; }}
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input 
                            name="search" 
                            className="w-full bg-white/5 border border-white/10 text-white text-base rounded-lg pl-10 pr-4 py-3 outline-none focus:border-red-500/50" 
                            type="search" 
                            placeholder="Film Ara..." 
                        />
                    </form>

                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link 
                                key={link.href} 
                                to={link.href} 
                                onClick={() => setOpen(false)}
                                style={{ textDecoration: 'none' }}
                                className="flex items-center gap-3 text-lg font-medium !text-gray-300 hover:!text-white"
                            >
                                <Icon className="w-5 h-5 text-red-500" />
                                {link.title}
                            </Link>
                        );
                    })}
                    <div className="h-px bg-white/10 my-1"></div>
                    {user ? (
                        <>
                            <Link to="/profile" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }} className="text-lg font-medium !text-white flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" /> Profilim ({user.username})
                            </Link>
                            {user.role === 'Admin' && (
                                <Link to="/admin" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }} className="text-lg font-medium !text-red-500">
                                    Sistem Yönetimi (Admin)
                                </Link>
                            )}
                            <button onClick={() => { handleLogout(); setOpen(false); }} className="text-left text-lg font-medium text-red-500 flex items-center gap-3 bg-transparent border-none p-0 mt-2">
                                <LogOut className="w-5 h-5" /> Çıkış Yap
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 mt-2">
                            <Link to="/login" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }} className="text-lg font-medium !text-gray-300">Giriş Yap</Link>
                            <Link to="/register" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }} className="text-lg font-medium !text-red-500">Kayıt Ol</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export { Header1 };
