using Microsoft.AspNetCore.Mvc;
using CineLog.Business.Services;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;

namespace CineLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public AiController(IAiService aiService, HttpClient httpClient, IConfiguration configuration)
        {
            _aiService = aiService;
            _httpClient = httpClient;
            _configuration = configuration;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message)) return BadRequest("Mesaj boş olamaz.");
            
            var response = await _aiService.ChatWithCineBotAsync(request.Message);
            return Ok(new { response });
        }

        [HttpGet("summarize/{movieId}")]
        public async Task<IActionResult> SummarizeReviews(int movieId)
        {
            // TMDB'den film yorumlarını çek
            var apiKey = _configuration["TmdbSettings:ApiKey"];
            var tmdbUrl = $"https://api.themoviedb.org/3/movie/{movieId}/reviews?api_key={apiKey}&language=en-US&page=1";
            
            var response = await _httpClient.GetAsync(tmdbUrl);
            if (!response.IsSuccessStatusCode) return Ok(new { response = "Yorumlar çekilemedi." });

            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);
            
            var results = doc.RootElement.GetProperty("results");
            var reviews = new List<string>();
            
            foreach (var item in results.EnumerateArray())
            {
                var content = item.GetProperty("content").GetString();
                if (!string.IsNullOrEmpty(content))
                {
                    reviews.Add(content);
                }
            }

            if (reviews.Count == 0) return Ok(new { response = "Bu film için The Movie Database (TMDB) üzerinde henüz İngilizce metin yorumu bulunmuyor." });

            // İlk 5 yorumu al (Çok uzun olmasın)
            var topReviews = reviews.Take(5).ToList();
            var summary = await _aiService.SummarizeReviewsAsync("Seçilen Film", topReviews);
            return Ok(new { response = summary });
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}
