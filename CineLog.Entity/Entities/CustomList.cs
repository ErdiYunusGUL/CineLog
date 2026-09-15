using System;
using System.Collections.Generic;

namespace CineLog.Entity.Entities
{
    public class CustomList
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public ICollection<CustomListMovie> Movies { get; set; }
    }
}
