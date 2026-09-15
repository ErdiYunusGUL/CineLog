using System;

namespace CineLog.Entity.Entities
{
    public class CustomListMovie
    {
        public int Id { get; set; }
        public int CustomListId { get; set; }
        public int MovieId { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        public CustomList CustomList { get; set; }
    }
}
