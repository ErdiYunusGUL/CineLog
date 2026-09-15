namespace CineLog.Entity.Entities
{
    public class Review
    {
        public int Id { get; set; }
        public int UserId { get; set; }  // Yorumu kim yaptı?

        public int MovieId { get; set; } // Hangi filme yaptı? (TMDB ID'si)
        public int Rating { get; set; }  // 0 ile 100 arası puan

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // EF Core için ilişki tanımı (Navigation Property)
        public User User { get; set; } = null!;
    }
}