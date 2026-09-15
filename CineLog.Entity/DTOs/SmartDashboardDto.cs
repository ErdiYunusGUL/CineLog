using System.Collections.Generic;

namespace CineLog.Entity.DTOs
{
    public class SmartDashboardDto
    {
        public List<string> Notifications { get; set; } = new List<string>();
        public List<MovieDto> RecommendedMovies { get; set; } = new List<MovieDto>();
    }
}
