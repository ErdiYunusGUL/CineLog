using System;
using System.Collections.Generic;

namespace CineLog.Entity.DTOs
{
    public class CustomListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        
        // Bu listenin içindeki filmlerin DTO halleri (React'te kapak fotoğraflarını basmak için)
        public List<MovieDto> Movies { get; set; } = new List<MovieDto>();
    }

    public class CreateCustomListDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
