using CineLog.Entity.Entities;

namespace CineLog.Entity.DTOs
{
    public class AddReviewDto
    {
        public int MovieId { get; set; }
        public int Rating { get; set; }
    }

    // Detaylı İstatistikler için kullanıcının verdiği puanları taşıyan mini zarf
    public class UserReviewDto
    {
        public int MovieId { get; set; }
        public int Rating { get; set; }
    }

    public class AddFavoriteDto
    {
        public int ExternalId { get; set; }
        public string ItemType { get; set; } = string.Empty; // "Movie", "Actor", "Director"
    }

    public class TasteProfileDto
    {
        public int FavoriteGenreId { get; set; }
        public string FavoriteGenreName { get; set; } = string.Empty;
    }

    public class AddMovieInteractionDto
    {
        public int MovieId { get; set; }
        public string MovieTitle { get; set; } = string.Empty;
        public string PosterPath { get; set; } = string.Empty;
        public int MainGenreId { get; set; }
        public int RuntimeMinutes { get; set; }
        public string Director { get; set; } = string.Empty;
        public string LeadActor { get; set; } = string.Empty;
        public int ReleaseYear { get; set; }
    }

    public class UserProfileDto
    {
        public TasteProfileDto? TasteProfile { get; set; }
        public List<CineLog.Entity.Entities.WatchlistMovie> Watchlist { get; set; } = new();
        public List<CineLog.Entity.Entities.WatchedHistory> WatchedMovies { get; set; } = new();
        public int TotalWatchHours { get; set; }
        // YENİ: Türlere göre ortalama puanlar (Örn: "Bilim Kurgu" -> 8.5)
        public Dictionary<string, double> GenreAverageRatings { get; set; } = new();
        // YENİ: Detaylı İstatistik (All-Time Stats) sayfasında hesaplama yapmak için tüm puanlar
        public List<UserReviewDto> UserReviews { get; set; } = new();
    }
}
