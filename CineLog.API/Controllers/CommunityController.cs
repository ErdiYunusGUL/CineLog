using CineLog.Business.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace CineLog.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommunityController : ControllerBase
    {
        private readonly ICommunityService _communityService;

        public CommunityController(ICommunityService communityService)
        {
            _communityService = communityService;
        }

        // 1. SİNEMA RUH İKİZİ
        [Authorize]
        [HttpGet("matches")]
        public async Task<IActionResult> GetSoulmateMatches()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdString, out int userId)) return Unauthorized();
            var matches = await _communityService.GetSoulmateMatchesAsync(userId);
            return Ok(matches);
        }

        // 2. HERKESE AÇIK PROFİL
        [Authorize]
        [HttpGet("user/{targetUserId}/profile")]
        public async Task<IActionResult> GetPublicProfile(int targetUserId)
        {
            var profile = await _communityService.GetPublicProfileAsync(targetUserId);
            if (profile == null) return NotFound(new { message = "Kullanıcı bulunamadı." });
            return Ok(profile);
        }

        // 3. SOSYAL AKIŞ (ACTIVITY FEED)
        [Authorize]
        [HttpGet("activity-feed")]
        public async Task<IActionResult> GetActivityFeed()
        {
            var feed = await _communityService.GetActivityFeedAsync();
            return Ok(feed);
        }
    }
}

