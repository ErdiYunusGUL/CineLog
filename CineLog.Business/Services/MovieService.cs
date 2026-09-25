using System.Text.Json;
using Microsoft.Extensions.Configuration;
using CineLog.Entity.DTOs;

namespace CineLog.Business.Services
{
    public class MovieService : IMovieService
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string _apiKey;

        public MovieService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _baseUrl = configuration["TmdbSettings:BaseUrl"] ?? "";
            _apiKey = configuration["TmdbSettings:ApiKey"] ?? "";
        }

        public async Task<List<MovieDto>> GetPopularMoviesAsync(string timeWindow = "day", int page = 1)
        {
            string requestUrl;
            
            if (timeWindow == "week")
                requestUrl = $"{_baseUrl}/trending/movie/week?api_key={_apiKey}&language=en-US&page={page}";
            else if (timeWindow == "year")
                requestUrl = $"{_baseUrl}/discover/movie?api_key={_apiKey}&language=en-US&primary_release_year={DateTime.Now.Year}&sort_by=popularity.desc&page={page}";
            else if (timeWindow == "all")
                requestUrl = $"{_baseUrl}/movie/top_rated?api_key={_apiKey}&language=en-US&page={page}"; // Tüm zamanların en iyileri
            else
                requestUrl = $"{_baseUrl}/movie/popular?api_key={_apiKey}&language=en-US&page={page}"; // Günün popülerleri


            var response = await _httpClient.GetAsync(requestUrl);
            response.EnsureSuccessStatusCode();

            var jsonString = await response.Content.ReadAsStringAsync();

            var result = JsonSerializer.Deserialize<TmdbResponseDto>(jsonString, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result?.Results ?? new List<MovieDto>();
        }

        public async Task<List<MovieDto>> SearchMoviesAsync(string query)
        {
            // 1. TMDB'nin arama adresine gidiyoruz. Sonuna '&query=' diyerek kullanıcının aradığı kelimeyi yapıştırıyoruz.
            var response = await _httpClient.GetAsync($"https://api.themoviedb.org/3/search/movie?api_key={_apiKey}&language=en-US&query={query}");

            // 2. Cevap başarılı mı diye kontrol ediyoruz. (Değilse hata fırlatır)
            response.EnsureSuccessStatusCode();

            // 3. Gelen JSON verisini okuyup, bizim anladığımız DTO formatına çeviriyoruz (Deserialize).
            var content = await response.Content.ReadAsStringAsync();
            var tmdbResponse = JsonSerializer.Deserialize<TmdbResponseDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return tmdbResponse?.Results ?? new List<MovieDto>();
        }


        // YENİ 2: İzleme Platformları (Netflix, Amazon vb.)
        public async Task<string> GetMovieProvidersAsync(int movieId)
        {
            // 1. TMDB'nin özel 'watch/providers' adresine, bize gönderilen filmin ID'si ile gidiyoruz.
            var response = await _httpClient.GetAsync($"https://api.themoviedb.org/3/movie/{movieId}/watch/providers?api_key={_apiKey}");

            response.EnsureSuccessStatusCode();

            // 2. Platform listesi çok karmaşık bir yapıda olduğu için, şimdilik o ham JSON verisini
            // doğrudan metin (string) olarak React'e yolluyoruz. Ayıklama işini React yapacak!
            return await response.Content.ReadAsStringAsync();
        }

        // Parametrelere 'castId', 'crewId', 'sortBy' ve 'page' eklendi
        public async Task<List<MovieDto>> DiscoverMoviesAsync(int? startYear, int? endYear, int? genreId, int? providerId, int? castId = null, int? crewId = null, string sortBy = "popularity.desc", int page = 1)
        {
            // YENİ VE KESİN ÇÖZÜM: Eğer bir Yönetmen seçilmişse, TMDB'nin saçma sapan "with_crew" sistemini kullanma!
            // Onun yerine adamın direkt profiline gir, "Director" (Yönetmen) kelimesini cımbızla çek!
            if (crewId.HasValue)
            {
                var personResponse = await _httpClient.GetAsync($"https://api.themoviedb.org/3/person/{crewId.Value}/movie_credits?api_key={_apiKey}&language=en-US");
                personResponse.EnsureSuccessStatusCode();
                var personContent = await personResponse.Content.ReadAsStringAsync();
                var personCredits = JsonSerializer.Deserialize<PersonCreditsDto>(personContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                // 1. Sadece "Yönetmen" (Director) olduklarını al
                var movies = personCredits?.Crew?.Where(c => c.Job == "Director").ToList() ?? new List<MovieDto>();

                // 2. Yıl, Tür filtrelerini manuel olarak (C# RAM'inde) uygula
                if (startYear.HasValue) 
                    movies = movies.Where(m => !string.IsNullOrEmpty(m.ReleaseDate) && m.ReleaseDate.Length >= 4 && int.TryParse(m.ReleaseDate.Substring(0,4), out int y) && y >= startYear.Value).ToList();
                
                if (endYear.HasValue) 
                    movies = movies.Where(m => !string.IsNullOrEmpty(m.ReleaseDate) && m.ReleaseDate.Length >= 4 && int.TryParse(m.ReleaseDate.Substring(0,4), out int y) && y <= endYear.Value).ToList();
                
                if (genreId.HasValue) 
                    movies = movies.Where(m => m.GenreIds != null && m.GenreIds.Contains(genreId.Value)).ToList();
                
                // 3. Sıralamayı C# RAM'inde (LINQ) uygula
                if (sortBy == "primary_release_date.desc") movies = movies.OrderByDescending(m => m.ReleaseDate).ToList();
                else if (sortBy == "primary_release_date.asc") movies = movies.OrderBy(m => m.ReleaseDate).ToList();
                else if (sortBy == "vote_average.desc") movies = movies.OrderByDescending(m => m.VoteAverage).ToList();
                else movies = movies.OrderByDescending(m => m.VoteAverage).ToList(); // Popülerlik yerine puanı kullan
                
                // Sayfalama (Pagination) için Skip/Take uyguluyoruz:
                int pageSize = 20;
                int skip = (page - 1) * pageSize;
                return movies.Skip(skip).Take(pageSize).ToList();
            }

            // Normal Keşfet (Discover) Akışı: Eğer sadece Oyuncu (castId) aranıyorsa veya hiç kişi aranmıyorsa
            var url = $"https://api.themoviedb.org/3/discover/movie?api_key={_apiKey}&language=en-US&watch_region=TR&sort_by={sortBy}&page={page}";

            if (startYear.HasValue) url += $"&primary_release_date.gte={startYear}-01-01";
            if (endYear.HasValue) url += $"&primary_release_date.lte={endYear}-12-31";
            if (genreId.HasValue) url += $"&with_genres={genreId}";
            if (providerId.HasValue) url += $"&with_watch_providers={providerId}";

            if (castId.HasValue) url += $"&with_cast={castId}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var tmdbResponse = JsonSerializer.Deserialize<TmdbResponseDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return tmdbResponse?.Results ?? new List<MovieDto>();
        }

        // YENİ: Kullanıcı zevk analizi (Onboarding) için 45 rastgele popüler film getirir
        public async Task<List<MovieDto>> GetOnboardingMoviesAsync()
        {
            var allMovies = new List<MovieDto>();

            // TMDB'den popüler filmlerin ilk 3 sayfasını (Toplam 60 film) hızlıca çekiyoruz
            for (int page = 1; page <= 3; page++)
            {
                var url = $"https://api.themoviedb.org/3/movie/popular?api_key={_apiKey}&language=en-US&page={page}";
                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var tmdbResponse = JsonSerializer.Deserialize<TmdbResponseDto>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (tmdbResponse?.Results != null)
                    {
                        allMovies.AddRange(tmdbResponse.Results);
                    }
                }
            }

            // C# LINQ gücüyle bu 60 filmi kağıt destesi karıştırır gibi (Guid.NewGuid) rastgele karıştırıyoruz
            // Ve içinden tam 45 tanesini (Take) çekip React'e gönderiyoruz!
            return allMovies.OrderBy(x => Guid.NewGuid()).Take(45).ToList();
        }

        // YENİ: Profil sayfasından (sadece ID ile) gelindiğinde filmin tüm detaylarını TMDB'den ham JSON olarak çeker
        public async Task<string> GetMovieDetailsAsync(int movieId)
        {
            var response = await _httpClient.GetAsync($"https://api.themoviedb.org/3/movie/{movieId}?api_key={_apiKey}&language=en-US");
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }

        // YENİ: Veri Analitiği (Data Science) İçin Yönetmen ve Oyuncu Kadrosunu Çeker
                public async Task<string> GetSimilarMoviesAsync(int movieId)
        {
            var response = await _httpClient.GetAsync($"https://api.themoviedb.org/3/movie/{movieId}/similar?api_key={_apiKey}&language=tr-TR");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetMovieCreditsAsync(int movieId)
        {
            var response = await _httpClient.GetAsync($"https://api.themoviedb.org/3/movie/{movieId}/credits?api_key={_apiKey}");
            response.EnsureSuccessStatusCode();

            // Kadro çok detaylı (Işıkçıdan makyöze kadar) olduğu için bunu metin olarak React'e yolluyoruz
            // React içinden sadece 'Yönetmen' ve 'Başrol'ü cımbızla çekecek!
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> SearchPersonAsync(string name)
        {
            // query= ismi ile direkt kişiyi (Aktör/Yönetmen) aratır
            var response = await _httpClient.GetAsync($"https://api.themoviedb.org/3/search/person?api_key={_apiKey}&query={name}&language=en-US");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync(); // JSON'u React için ham yolluyoruz
        }


        public async Task<string> GetPersonDetailsAsync(int personId)
        {
            var response = await _httpClient.GetAsync("https://api.themoviedb.org/3/person/" + personId + "?api_key=" + _apiKey + "&language=tr-TR&append_to_response=movie_credits");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}

