namespace CineLog.Entity.DTOs
{
    public class PublicProfileDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        
        // Zevk Profili
        public TasteProfileDto TasteProfile { get; set; } = new();
        
        // Rozet / Ünvan (Örn: "Gerçek Sinefil")
        public string BadgeTitle { get; set; } = string.Empty;

        // Son izlediği 10 film
        public List<Entity.Entities.WatchedHistory> RecentWatches { get; set; } = new();

        // Herkese açık koleksiyonları
        public List<CustomListDto> CustomLists { get; set; } = new();
    }
}
