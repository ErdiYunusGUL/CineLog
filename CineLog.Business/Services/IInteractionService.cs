using CineLog.Entity.DTOs;
using CineLog.Entity.Entities;

namespace CineLog.Business.Services
{
    public interface IInteractionService
    {
        Task AddReviewAsync(int userId, AddReviewDto dto);
        Task<List<Review>> GetMovieReviewsAsync(int movieId);

        Task AddFavoriteAsync(int userId, AddFavoriteDto dto);
        Task<List<FavoriteItem>> GetUserFavoritesAsync(int userId);

        Task<double> GetMovieAverageRatingAsync(int movieId);

        Task SaveTasteProfileAsync(int userId, TasteProfileDto dto);

        Task<TasteProfileDto?> GetMyTasteProfileAsync(int userId);

        Task ToggleWatchlistAsync(int userId, AddMovieInteractionDto dto);
        Task ToggleWatchedMovieAsync(int userId, AddMovieInteractionDto dto);

        Task<(bool isWatchlist, bool isWatched)> GetMovieStatusAsync(int userId, int movieId);

        Task<List<int>> GetWatchedMovieIdsAsync(int userId);


        Task<UserProfileDto> GetUserProfileDataAsync(int userId);

        // YENİ: ÖZEL FİLM LİSTELERİ
        Task<CustomListDto> CreateCustomListAsync(int userId, CreateCustomListDto dto);
        Task<List<CustomListDto>> GetUserCustomListsAsync(int userId);
        Task ToggleMovieInCustomListAsync(int userId, int customListId, int movieId);

        // YENİ: AKILLI BİLDİRİMLER (HOME DASHBOARD)
        Task<SmartDashboardDto> GetSmartDashboardAsync(int userId);
    }
}
