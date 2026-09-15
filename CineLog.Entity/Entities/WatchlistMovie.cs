namespace CineLog.Entity.Entities
{
    public class WatchlistMovie
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int MovieId { get; set; }
        public string MovieTitle { get; set; } = string.Empty;
        public string PosterPath { get; set; } = string.Empty;
        public DateTime AddedAt { get; set; }

        // İlişki Bağlantısı (Sonsuz döngüyü kırmak için JsonIgnore ekliyoruz)
        [System.Text.Json.Serialization.JsonIgnore]
        public User? User { get; set; }
    }
}