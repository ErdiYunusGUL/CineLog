using CineLog.Entity.DTOs;

namespace CineLog.Business.Services
{
    public interface IMovieService
    {
        Task<List<MovieDto>> GetPopularMoviesAsync();

        // YENİ 1: Kullanıcının girdiği kelimeyi (query) TMDB'de arar.
        Task<List<MovieDto>> SearchMoviesAsync(string query);

        // YENİ 2: Sadece belirli bir filmin (id), Türkiye'de nerede izlendiğini getirir. (Şimdilik string yani düz metin dönecek)
        Task<string> GetMovieProvidersAsync(int movieId);

        // YENİ: Mega Filtreleme (Soru işareti '?' koyuyoruz ki bazı filtreler boş geçilebilsin)
        // Keşfet metodu artık 'personId' (Kişi ID'si) de alabilecek ve Sayfalama (page) yapabilecek
        Task<List<MovieDto>> DiscoverMoviesAsync(int? startYear, int? endYear, int? genreId, int? providerId, int? castId = null, int? crewId = null, string sortBy = "popularity.desc", int page = 1);

        Task<List<MovieDto>> GetOnboardingMoviesAsync();

        // YENİ: Raw JSON dönecek
        Task<string> GetMovieDetailsAsync(int movieId);
        Task<string> GetMovieCreditsAsync(int movieId);
        Task<string> SearchPersonAsync(string name);
    }
}