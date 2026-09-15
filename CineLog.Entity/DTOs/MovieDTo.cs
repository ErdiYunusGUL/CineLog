using System.Text.Json.Serialization;

namespace CineLog.Entity.DTOs
{
    // Bize gelecek asıl JSON paketinin en dış kabuğu
    public class TmdbResponseDto
    {
        [JsonPropertyName("results")]
        public List<MovieDto> Results { get; set; } = new List<MovieDto>();
    }

    // İhtiyacımız olan tekil film bilgileri
    public class MovieDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Overview { get; set; } = string.Empty;

        [JsonPropertyName("poster_path")]
        public string PosterPath { get; set; } = string.Empty;

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("release_date")]
        public string ReleaseDate { get; set; } = string.Empty;

        [JsonPropertyName("genre_ids")]
        public List<int> GenreIds { get; set; } = new List<int>();
        
        [JsonPropertyName("runtime")]
        public int Runtime { get; set; }

        [JsonPropertyName("job")]
        public string Job { get; set; } = string.Empty;

        [JsonPropertyName("character")]
        public string Character { get; set; } = string.Empty;
    }

    // YENİ: Bir kişinin oynadığı / yönettiği filmleri getiren yapı
    public class PersonCreditsDto
    {
        [JsonPropertyName("cast")]
        public List<MovieDto> Cast { get; set; } = new List<MovieDto>();

        [JsonPropertyName("crew")]
        public List<MovieDto> Crew { get; set; } = new List<MovieDto>();
    }
}