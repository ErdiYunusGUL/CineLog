using System.Security.Claims;
using CineLog.Business.Services;
using CineLog.Entity.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CineLog.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bu sınıftaki tüm metodlar Yaka Kartı (Token) zorunluluğu taşır
    public class InteractionsController : ControllerBase
    {
        private readonly IInteractionService _interactionService;

        public InteractionsController(IInteractionService interactionService)
        {
            _interactionService = interactionService;
        }

        // Token içinden giriş yapan kullanıcının ID'sini okuyan yardımcı metod
        private int GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out int userId))
                return userId;
            throw new Exception("Kullanıcı kimliği doğrulanamadı.");
        }

        [HttpPost("review")]
        public async Task<IActionResult> AddReview([FromBody] AddReviewDto dto)
        {
            try
            {
                int userId = GetCurrentUserId();
                await _interactionService.AddReviewAsync(userId, dto);
                return Ok(new { message = "Yorumunuz başarıyla eklendi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [AllowAnonymous] // Herkes okuyabilir
        [HttpGet("movie/{movieId}/reviews")]
        public async Task<IActionResult> GetMovieReviews(int movieId)
        {
            var reviews = await _interactionService.GetMovieReviewsAsync(movieId);
            return Ok(reviews);
        }

        [HttpPost("favorite")]
        public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteDto dto)
        {
            try
            {
                int userId = GetCurrentUserId();
                await _interactionService.AddFavoriteAsync(userId, dto);
                return Ok(new { message = "Favorilere eklendi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("favorites")]
        public async Task<IActionResult> GetMyFavorites()
        {
            try
            {
                int userId = GetCurrentUserId();
                var favs = await _interactionService.GetUserFavoritesAsync(userId);
                return Ok(favs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [AllowAnonymous] // Giriş yapmayanlar da filmin ortalama puanını görebilsin
        [HttpGet("movie/{movieId}/average")]
        public async Task<IActionResult> GetMovieAverage(int movieId)
        {
            var average = await _interactionService.GetMovieAverageRatingAsync(movieId);
            return Ok(Math.Round(average, 1)); // Küsuratı yuvarlayarak gönderiyoruz (Örn: 85.4)
        }

        [Authorize] // Sadece giriş yapmış (token'ı olan) kullanıcılar profillerini güncelleyebilir
        [HttpPost("taste-profile")]
        public async Task<IActionResult> SaveTasteProfile([FromBody] TasteProfileDto dto)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int userId))
            {
                await _interactionService.SaveTasteProfileAsync(userId, dto);
                return Ok("Zevk profili başarıyla kaydedildi.");
            }
            return Unauthorized("Kullanıcı kimliği doğrulanamadı.");
        }

        [Authorize]
        [HttpGet("my-taste")]
        public async Task<IActionResult> GetMyTasteProfile()
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int userId))
            {
                var profile = await _interactionService.GetMyTasteProfileAsync(userId);
                if (profile == null) return NotFound("Zevk profili bulunamadı.");
                return Ok(profile);
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpPost("watchlist")]
        public async Task<IActionResult> ToggleWatchlist([FromBody] AddMovieInteractionDto dto)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int userId))
            {
                await _interactionService.ToggleWatchlistAsync(userId, dto);
                return Ok();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpPost("watched")]
        public async Task<IActionResult> MarkAsWatched([FromBody] AddMovieInteractionDto dto)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int userId))
            {
                await _interactionService.ToggleWatchedMovieAsync(userId, dto); // BURASI DEĞİŞTİ
                return Ok();
            }
            return Unauthorized();
        }

        [Authorize]
        [HttpGet("movie-status/{movieId}")]
        public async Task<IActionResult> GetMovieStatus(int movieId)
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int userId))
            {
                var status = await _interactionService.GetMovieStatusAsync(userId, movieId);
                return Ok(new { isWatchlist = status.isWatchlist, isWatched = status.isWatched });
            }
            return Unauthorized();
        }

        // YENİ: AKILLI BİLDİRİMLER
        [Authorize]
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return Unauthorized();

            var data = await _interactionService.GetSmartDashboardAsync(userId);
            return Ok(data);
        }

        

        [Authorize]
        [HttpGet("profile-data")]
        public async Task<IActionResult> GetProfileData()
        {
            var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdString, out int userId))
            {
                var data = await _interactionService.GetUserProfileDataAsync(userId);
                return Ok(data);
            }
            return Unauthorized();
        }

        // ==========================================
        // YENİ: ÖZEL FİLM LİSTELERİ API KAPILARI
        // ==========================================

        [Authorize]
        [HttpPost("custom-lists")]
        public async Task<IActionResult> CreateCustomList([FromBody] CreateCustomListDto dto)
        {
            var userId = GetCurrentUserId();
            var newList = await _interactionService.CreateCustomListAsync(userId, dto);
            return Ok(newList);
        }

        [Authorize]
        [HttpGet("custom-lists")]
        public async Task<IActionResult> GetMyCustomLists()
        {
            var userId = GetCurrentUserId();
            var lists = await _interactionService.GetUserCustomListsAsync(userId);
            return Ok(lists);
        }

        [Authorize]
        [HttpPost("custom-lists/{customListId}/toggle-movie/{movieId}")]
        public async Task<IActionResult> ToggleMovieInCustomList(int customListId, int movieId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _interactionService.ToggleMovieInCustomListAsync(userId, customListId, movieId);
                return Ok(new { message = "Film listeye eklendi/çıkarıldı." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpGet("smart-dashboard")]
        public async Task<IActionResult> GetSmartDashboard()
        {
            var userId = GetCurrentUserId();
            var dashboard = await _interactionService.GetSmartDashboardAsync(userId);
            return Ok(dashboard);
        }

        
    }
}
