namespace CineLog.Entity.Entities
{
    public class FavoriteItem
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public int ExternalId { get; set; } // TMDB'deki Film, Oyuncu veya Yönetmen ID'si

        // Neyin favorisi olduğunu anlamak için Enum (Movie, Actor, Director) tutuyoruz
        public string ItemType { get; set; } = string.Empty;

        public DateTime AddedAt { get; set; } = DateTime.Now;

        public User User { get; set; } = null!;
    }
}