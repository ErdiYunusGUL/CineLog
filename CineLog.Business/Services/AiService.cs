using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace CineLog.Business.Services
{
    public class AiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _baseUrl;

        public AiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["GeminiSettings:ApiKey"] ?? "";
            _baseUrl = configuration["GeminiSettings:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        }

        private async Task<string> CallGeminiApiAsync(string prompt)
        {
            if (string.IsNullOrEmpty(_apiKey))
                return "AI Özelliği geçici olarak devre dışı (API Key eksik).";

            var requestUrl = $"{_baseUrl}?key={_apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(requestUrl, jsonContent);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine("Gemini API Error: " + error);
                return "Yapay zeka ile iletişim kurulamadı.";
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            
            try
            {
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
                    
                return text ?? "Yanıt alınamadı.";
            }
            catch
            {
                return "Yapay zeka yanıtı okunamadı.";
            }
        }

        public async Task<string> GetTasteAnalysisAsync(string genreName, List<string> recentMovies)
        {
            var moviesList = string.Join(", ", recentMovies);
            var prompt = $"Sen profesyonel bir sinema eleştirmeni ve psikoloğusun. Bir kullanıcımız '{genreName}' türünü çok seviyor. Seçtiği favori filmler şunlar: {moviesList}. Lütfen bu kişiye sen diliyle samimi, edebi, esprili ve havalı bir paragraf (maksimum 3 cümle) yazarak sinema zevkini ve psikolojisini analiz et. Sadece analizi yaz, selam vb. verme.";
            return await CallGeminiApiAsync(prompt);
        }

        public async Task<string> ChatWithCineBotAsync(string userMessage)
        {
            var prompt = $"Sen CineLog platformunun yapay zeka sinema asistanısın (CineBot). Kullanıcıya sen diliyle, samimi ve kısa cevaplar ver. Sadece sinema, dizi ve filmler hakkında konuş, başka konuları kibarca reddet. Kullanıcının sorusu: {userMessage}";
            return await CallGeminiApiAsync(prompt);
        }

        public async Task<string> SummarizeReviewsAsync(string movieTitle, List<string> reviews)
        {
            if (reviews == null || reviews.Count == 0) return "Bu film için henüz hiç yorum yapılmamış.";

            var allReviews = string.Join(" | ", reviews);
            var prompt = $"'{movieTitle}' filmi için kullanıcılarımız şu yorumları yaptı: {allReviews}. Lütfen bu yorumları okuyup, filmin genel olarak ne kadar sevildiğini, en çok övülen ve eleştirilen yanlarını tek bir paragrafta (en fazla 3 cümle) özetle. Sen diliyle samimi bir dil kullan.";
            return await CallGeminiApiAsync(prompt);
        }
    }
}
