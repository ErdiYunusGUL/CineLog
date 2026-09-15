namespace CineLog.Entity.DTOs
{
    public class CommunityMatchDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        
        // Ortak olarak izlenip PUANLANAN film sayısı
        public int SharedRatedMoviesCount { get; set; }
        
        // 0 ile 100 arasında bir eşleşme yüzdesi
        public int MatchPercentage { get; set; }
        
        public string FavoriteGenreName { get; set; } = string.Empty;
    }
}
