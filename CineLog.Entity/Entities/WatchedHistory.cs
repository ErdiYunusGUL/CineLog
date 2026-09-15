namespace CineLog.Entity.Entities
{
    public class WatchedHistory
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int MovieId { get; set; }
        public string MovieTitle { get; set; } = string.Empty;
        public string PosterPath { get; set; } = string.Empty;

        public string Director { get; set; } = string.Empty; // Yönetmen
        public string LeadActor { get; set; } = string.Empty; // Başrol Oyuncusu
        public int ReleaseYear { get; set; } // Filmin Çıkış Yılı

        // Dinamik Zevk Analizi için en çok işimize yarayacak kolon:
        public int MainGenreId { get; set; }
        public int RuntimeMinutes { get; set; }

        public DateTime WatchedAt { get; set; }

        // İlişki Bağlantısı (Sonsuz döngüyü kırmak için JsonIgnore ekliyoruz)
        [System.Text.Json.Serialization.JsonIgnore]
        public User? User { get; set; }
    }
}