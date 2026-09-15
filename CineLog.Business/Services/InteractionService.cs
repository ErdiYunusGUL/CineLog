using CineLog.DataAccess.Context;
using CineLog.Entity.DTOs;
using CineLog.Entity.Entities;
using Microsoft.EntityFrameworkCore;

namespace CineLog.Business.Services
{
    public class InteractionService : IInteractionService
    {
        private readonly AppDbContext _context;

        public InteractionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddReviewAsync(int userId, AddReviewDto dto)
        {
            var review = new Review
            {
                UserId = userId,
                MovieId = dto.MovieId,
                Rating = dto.Rating,
                CreatedAt = DateTime.UtcNow
            };
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Review>> GetMovieReviewsAsync(int movieId)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.MovieId == movieId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task AddFavoriteAsync(int userId, AddFavoriteDto dto)
        {
            // Already favorited?
            if (await _context.Favorites.AnyAsync(f => f.UserId == userId && f.ExternalId == dto.ExternalId && f.ItemType == dto.ItemType))
                return;

            var fav = new FavoriteItem
            {
                UserId = userId,
                ExternalId = dto.ExternalId,
                ItemType = dto.ItemType,
                AddedAt = DateTime.UtcNow
            };
            _context.Favorites.Add(fav);
            await _context.SaveChangesAsync();
        }

        public async Task<List<FavoriteItem>> GetUserFavoritesAsync(int userId)
        {
            return await _context.Favorites
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.AddedAt)
                .ToListAsync();
        }

        public async Task<double> GetMovieAverageRatingAsync(int movieId)
        {
            // 1. Veritabanındaki 'Reviews' (Yorumlar) tablosuna git.
            // 2. Sadece bu filmin (movieId) yorumlarını filtrele (.Where).
            var movieReviews = _context.Reviews.Where(r => r.MovieId == movieId);
            // 3. Eğer hiç yorum yoksa ortalama sıfırdır, direkt dön.
            if (!await movieReviews.AnyAsync())
                return 0;
            // 4. Eğer yorum varsa, LINQ'in mucizevi .AverageAsync() metoduyla 
            // veritabanı seviyesinde milisaniyeler içinde tüm puanların (Rating) ortalamasını al!
            return await movieReviews.AverageAsync(r => r.Rating);
        }

        // YENİ: React'ten gelen Zevk Profilini Veritabanındaki 'User' tablosuna kaydeder
        public async Task SaveTasteProfileAsync(int userId, TasteProfileDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.FavoriteGenreId = dto.FavoriteGenreId;
                user.FavoriteGenreName = dto.FavoriteGenreName;
                await _context.SaveChangesAsync();
            }
        }

        // YENİ: Kullanıcının veritabanındaki zevk profilini (Varsa) geri döndürür
        public async Task<TasteProfileDto?> GetMyTasteProfileAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null && user.FavoriteGenreId.HasValue)
            {
                return new TasteProfileDto
                {
                    FavoriteGenreId = user.FavoriteGenreId.Value,
                    FavoriteGenreName = user.FavoriteGenreName
                };
            }
            return null; // Henüz zevk analizi yapmamışsa boş döner
        }

        // YENİ: İzleme Listesine Ekle / Çıkar (Toggle Mantığı)
        public async Task ToggleWatchlistAsync(int userId, AddMovieInteractionDto dto)
        {
            var existing = await _context.Watchlists.FirstOrDefaultAsync(w => w.UserId == userId && w.MovieId == dto.MovieId);

            if (existing != null)
            {
                _context.Watchlists.Remove(existing); // Varsa listeden çıkar
            }
            else
            {
                // Yoksa listeye ekle
                _context.Watchlists.Add(new WatchlistMovie
                {
                    UserId = userId,
                    MovieId = dto.MovieId,
                    MovieTitle = dto.MovieTitle,
                    PosterPath = dto.PosterPath,
                    AddedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();
        }

        // YENİ: İzlendi İşaretle ve Zevki DİNAMİK OLARAK GÜNCELLE!
        // YENİ: İzlendi İşaretle ve Zevki DİNAMİK OLARAK GÜNCELLE!
        // YENİ: İzlendi İşaretini Aç/Kapa (Geri Alınabilir) ve Zevki Güncelle
        public async Task ToggleWatchedMovieAsync(int userId, AddMovieInteractionDto dto)
        {
            var existing = await _context.WatchedHistories.FirstOrDefaultAsync(w => w.UserId == userId && w.MovieId == dto.MovieId);

            if (existing != null)
            {
                // Film zaten izlenmişse, kullanıcı yanlışlıkla basmış demektir. Geri al (Listeden sil)!
                _context.WatchedHistories.Remove(existing);
            }
            else
            {
                // İlk defa basıyorsa geçmişe ekle
                _context.WatchedHistories.Add(new WatchedHistory
                {
                    UserId = userId,
                    MovieId = dto.MovieId,
                    MovieTitle = dto.MovieTitle,
                    PosterPath = dto.PosterPath,
                    MainGenreId = dto.MainGenreId,
                    RuntimeMinutes = dto.RuntimeMinutes,

                    // YENİ: Veri Analitiği için kaydedilenler
                    Director = dto.Director,
                    LeadActor = dto.LeadActor,
                    ReleaseYear = dto.ReleaseYear,

                    WatchedAt = DateTime.UtcNow
                });
            }

            // Önce filmi silme/ekleme işlemini kaydet ki zevk analizi doğru çalışsın
            await _context.SaveChangesAsync();

            // =========================================================
            // DİNAMİK ZEVK ANALİZİ ALGORİTMASI 
            // =========================================================
            var last10Movies = await _context.WatchedHistories
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.WatchedAt)
                .Take(10)
                .ToListAsync();

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                if (last10Movies.Any())
                {
                    // İzlediği filmler varsa en çok izlenen türü bul
                    var topGenre = last10Movies.GroupBy(m => m.MainGenreId).OrderByDescending(g => g.Count()).First();
                    user.FavoriteGenreId = topGenre.Key;
                }
                else
                {
                    // Kullanıcı izlediği son filmi de iptal ettiyse, zevk profilini (şeridi) sıfırla!
                    user.FavoriteGenreId = null;
                }
                await _context.SaveChangesAsync();
            }
        }

        // YENİ: React'e "Bu kullanıcı bu filmi listeye eklemiş mi veya izlemiş mi?" cevabını verir
        public async Task<(bool isWatchlist, bool isWatched)> GetMovieStatusAsync(int userId, int movieId)
        {
            var isWatchlist = await _context.Watchlists.AnyAsync(w => w.UserId == userId && w.MovieId == movieId);
            var isWatched = await _context.WatchedHistories.AnyAsync(w => w.UserId == userId && w.MovieId == movieId);
            return (isWatchlist, isWatched);
        }

        // YENİ: Kullanıcının İzlediği Filmlerin Sadece ID'lerini (Hızlı Filtreleme İçin) Getirir
        public async Task<List<int>> GetWatchedMovieIdsAsync(int userId)
        {
            return await _context.WatchedHistories
                .Where(w => w.UserId == userId)
                .Select(w => w.MovieId)
                .ToListAsync();
        }


        // YENİ: Profil Sayfası İçin Tüm İstatistikleri ve Geçmişi Toparlar
        public async Task<UserProfileDto> GetUserProfileDataAsync(int userId)
        {
            // 1. Zevk Profilini Al
            var user = await _context.Users.FindAsync(userId);
            var taste = new TasteProfileDto();
            if (user != null && user.FavoriteGenreId.HasValue)
            {
                taste.FavoriteGenreId = user.FavoriteGenreId.Value;
                taste.FavoriteGenreName = user.FavoriteGenreName ?? "";
            }

            // 2. İzleme Listesi ve Geçmişini tarihe göre (en son eklenen en üstte) çek
            var watchlist = await _context.Watchlists.Where(w => w.UserId == userId).OrderByDescending(w => w.AddedAt).ToListAsync();
            var watched = await _context.WatchedHistories.Where(w => w.UserId == userId).OrderByDescending(w => w.WatchedAt).ToListAsync();


            // --- VERİ BİLİMİ: TÜRLERE GÖRE ORTALAMA PUAN HESAPLAMA ---
            var reviews = await _context.Reviews.Where(r => r.UserId == userId).ToListAsync();

            var genreDict = new Dictionary<int, string>
            {
                { 28, "Aksiyon" }, { 12, "Macera" }, { 16, "Animasyon" }, { 35, "Komedi" },
                { 80, "Suç" }, { 99, "Belgesel" }, { 18, "Dram" }, { 10751, "Aile" },
                { 14, "Fantastik" }, { 36, "Tarih" }, { 27, "Korku" }, { 10402, "Müzik" },
                { 9648, "Gizem" }, { 10749, "Romantik" }, { 878, "Bilim Kurgu" },
                { 53, "Gerilim" }, { 10752, "Savaş" }
            };

            var genreAverages = new Dictionary<string, double>();


            // Eğer kullanıcı hem izledim demiş hem de puan vermişse
            foreach (var review in reviews)
            {
                var history = watched.FirstOrDefault(w => w.MovieId == review.MovieId);
                if (history != null && genreDict.ContainsKey(history.MainGenreId))
                {
                    string genreName = genreDict[history.MainGenreId];
                    if (!genreAverages.ContainsKey(genreName))
                    {
                        // O türe ait kullanıcının verdiği tüm puanların ortalamasını al
                        var ratingsForThisGenre = reviews
                            .Where(r => watched.Any(w => w.MovieId == r.MovieId && w.MainGenreId == history.MainGenreId))
                            .Select(r => r.Rating)
                            .ToList();

                        if (ratingsForThisGenre.Any())
                        {
                            genreAverages[genreName] = ratingsForThisGenre.Average();
                        }
                    }
                }
            }
            
            var userReviews = reviews.Select(r => new UserReviewDto 
            {
                MovieId = r.MovieId,
                Rating = r.Rating
            }).ToList();

            // 3. Hepsini tek bir pakete koyup gönder!
            var data = new UserProfileDto
            {
                TasteProfile = taste,
                Watchlist = watchlist,
                WatchedMovies = watched,
                TotalWatchHours = Math.Abs(watched.Sum(w => w.RuntimeMinutes) / 60),
                GenreAverageRatings = genreAverages,
                UserReviews = userReviews // Zarfın içine ekledik!
            };

            return data;
        }

        // ==========================================
        // YENİ: ÖZEL FİLM LİSTELERİ (CUSTOM LISTS)
        // ==========================================
        
        public async Task<CustomListDto> CreateCustomListAsync(int userId, CreateCustomListDto dto)
        {
            var newList = new CustomList
            {
                UserId = userId,
                Title = dto.Title,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow
            };
            
            _context.CustomLists.Add(newList);
            await _context.SaveChangesAsync();

            return new CustomListDto
            {
                Id = newList.Id,
                Title = newList.Title,
                Description = newList.Description,
                CreatedAt = newList.CreatedAt
            };
        }

        public async Task<List<CustomListDto>> GetUserCustomListsAsync(int userId)
        {
            // Özel listeleri ve içindeki filmleri(sadece MovieId'leri) çekiyoruz
            var lists = await _context.CustomLists
                .Include(l => l.Movies)
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            // Sadece başlıkları dönüyoruz, React tarafı film detayları için TMDB'ye ayrıca istek atabilir
            // Ya da kendi veritabanımızdaki WatchedHistory üzerinden isim/poster bulabiliriz
            // Şimdilik sadece ana listeyi dönüyoruz
            return lists.Select(l => new CustomListDto
            {
                Id = l.Id,
                Title = l.Title,
                Description = l.Description,
                CreatedAt = l.CreatedAt,
                // Movies dizisini WatchedHistory'den tamamlamak için React'te çözeceğiz
            }).ToList();
        }

        public async Task ToggleMovieInCustomListAsync(int userId, int customListId, int movieId)
        {
            // Kullanıcının gerçekten böyle bir listesi var mı? (Güvenlik)
            var list = await _context.CustomLists.FirstOrDefaultAsync(l => l.Id == customListId && l.UserId == userId);
            if (list == null) throw new Exception("Bu liste bulunamadı veya size ait değil.");

            var existing = await _context.CustomListMovies.FirstOrDefaultAsync(m => m.CustomListId == customListId && m.MovieId == movieId);
            if (existing != null)
            {
                _context.CustomListMovies.Remove(existing);
            }
            else
            {
                _context.CustomListMovies.Add(new CustomListMovie
                {
                    CustomListId = customListId,
                    MovieId = movieId,
                    AddedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // YENİ: AKILLI BİLDİRİMLER (SMART DASHBOARD)
        // ==========================================
        public async Task<SmartDashboardDto> GetSmartDashboardAsync(int userId)
        {
            var dashboard = new SmartDashboardDto();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return dashboard;

            var watchlist = await _context.Watchlists.Where(w => w.UserId == userId).ToListAsync();
            var watched = await _context.WatchedHistories.Where(w => w.UserId == userId).ToListAsync();

            // 1. Zevk Profiline Dayalı Akıllı Bildirim
            if (user.FavoriteGenreId.HasValue)
            {
                dashboard.Notifications.Add($"Senin sinema ruhun <strong>{user.FavoriteGenreName}</strong> filmlerine ait! Bu türde yeni filmler keşfetmek ister misin?");
            }

            // 2. İzleme Listesi Hatırlatıcısı
            if (watchlist.Any())
            {
                var randomWatchlistMovie = watchlist.OrderBy(x => Guid.NewGuid()).First();
                dashboard.Notifications.Add($"İzleme listendeki <strong>{randomWatchlistMovie.MovieTitle}</strong> seni bekliyor. Patlamış mısırını hazırla, tam sırası!");
            }

            // 3. Yönetmen Takıntısı Analizi (Data Science)
            if (watched.Count >= 3)
            {
                var topDirector = watched
                    .Where(w => !string.IsNullOrEmpty(w.Director) && w.Director != "Bilinmiyor")
                    .GroupBy(w => w.Director)
                    .OrderByDescending(g => g.Count())
                    .FirstOrDefault();

                if (topDirector != null && topDirector.Count() >= 2)
                {
                    dashboard.Notifications.Add($"Verilerimize göre <strong>{topDirector.Key}</strong> filmlerini çok seviyorsun! Onun diğer başyapıtlarını izledin mi?");
                }
            }
            
            // 4. Tebrik / Rozet Bildirimi
            if (watched.Count >= 50)
            {
                dashboard.Notifications.Add("Tebrikler! 50'den fazla film izleyerek 'Gerçek Sinefil' rozetini kazandın! 🏆");
            }
            else if (watched.Count >= 10)
            {
                dashboard.Notifications.Add($"Şu ana kadar {watched.Count} film izledin. Harika gidiyorsun! 🎬");
            }

            return dashboard;
        }


    }
}
