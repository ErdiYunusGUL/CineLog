using CineLog.Business.Services;
using Microsoft.AspNetCore.Mvc;

namespace CineLog.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MoviesController : ControllerBase
    {
        private readonly IMovieService _movieService;
        private readonly IInteractionService _interactionService;

        // Dependency Injection ile servisimizi istiyoruz
        public MoviesController(IMovieService movieService, IInteractionService interactionService)
        {
            _movieService = movieService;
            _interactionService = interactionService;
        }

        [HttpGet("popular")]
        public async Task<IActionResult> GetPopularMovies([FromQuery] string timeWindow = "day", [FromQuery] int page = 1)
        {
            try
            {
                var movies = await _movieService.GetPopularMoviesAsync(timeWindow, page);
                return Ok(movies);
            }
            catch (Exception ex)
            {
                // Bir hata olursa 500 dönüyoruz
                return StatusCode(500, ex.Message);
            }
        }

        // YENİ 1: Arama Kapısı (Endpoint)
        // Örnek kullanım: api/Movies/search?query=batman
        [HttpGet("search")]
        public async Task<IActionResult> SearchMovies([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Arama kelimesi boş olamaz!");
            try
            {
                var movies = await _movieService.SearchMoviesAsync(query);
                return Ok(movies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // YENİ 2: İzleme Platformları Kapısı (Endpoint)
        // Örnek kullanım: api/Movies/550/providers
        [HttpGet("{id}/providers")]
        public async Task<IActionResult> GetProviders(int id)
        {
            try
            {
                var jsonResult = await _movieService.GetMovieProvidersAsync(id);

                // Content olarak dönüyoruz çünkü verimiz zaten bir JSON string'i
                return Content(jsonResult, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // YENİ: Mega Filtreleme Kapısı
        // Örnek kullanım: api/Movies/discover?startYear=2010&endYear=2020&providerId=8
        [HttpGet("discover")]
        public async Task<IActionResult> DiscoverMovies([FromQuery] int? startYear, [FromQuery] int? endYear, [FromQuery] int? genreId, [FromQuery] int? providerId, [FromQuery] int? castId, [FromQuery] int? crewId, [FromQuery] string sortBy = "popularity.desc", [FromQuery] bool showWatched = false, [FromQuery] int page = 1)
        {
            try
            {
                // 1. Önce TMDB'den Mega Filtre ile filmleri getir
                var movies = await _movieService.DiscoverMoviesAsync(startYear, endYear, genreId, providerId, castId, crewId, sortBy, page);
                
                // 2. YENİ: Eğer kullanıcı sisteme giriş yapmışsa ve "İzlediklerimi Göster" KAPALIYSA (false ise)
                if (!showWatched)
                {
                    var userIdString = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    if (int.TryParse(userIdString, out int userId))
                    {
                        // İzlediği filmlerin numaralarını al
                        var watchedIds = await _interactionService.GetWatchedMovieIdsAsync(userId);

                        // TMDB'den gelen filmlerin içinden, bu numaralara SAHİP OLMAYANLARI ayıkla!
                        movies = movies.Where(m => !watchedIds.Contains(m.Id)).ToList();
                    }
                }
                
                return Ok(movies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Örnek: api/Movies/search-person?name=Nolan
        [HttpGet("search-person")]
        public async Task<IActionResult> SearchPerson([FromQuery] string name)
        {
            try
            {
                var json = await _movieService.SearchPersonAsync(name);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("onboarding")]
        public async Task<IActionResult> GetOnboardingMovies()
        {
            try
            {
                var movies = await _movieService.GetOnboardingMoviesAsync();
                return Ok(movies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Örnek: api/Movies/12345
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMovie(int id)
        {
            try
            {
                var movieJson = await _movieService.GetMovieDetailsAsync(id);
                return Content(movieJson, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // Örnek: api/Movies/12345/credits
        [HttpGet("{id}/credits")]
                [HttpGet("{movieId}/similar")]
        public async Task<IActionResult> GetSimilarMovies(int movieId)
        {
            try
            {
                var movieJson = await _movieService.GetSimilarMoviesAsync(movieId);
                return Content(movieJson, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        public async Task<IActionResult> GetCredits(int id)
        {
            try
            {
                var creditsJson = await _movieService.GetMovieCreditsAsync(id);
                return Content(creditsJson, "application/json"); // Doğrudan JSON olarak React'e fırlat
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }


        [HttpGet("person/{personId}")]
        public async Task<IActionResult> GetPersonDetails(int personId)
        {
            try
            {
                var json = await _movieService.GetPersonDetailsAsync(personId);
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}


