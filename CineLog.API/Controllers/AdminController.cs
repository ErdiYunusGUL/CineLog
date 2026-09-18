using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CineLog.DataAccess.Context;
using System.Threading.Tasks;

namespace CineLog.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // YALNIZCA YETKİSİ "Admin" OLANLAR GİREBİLİR!
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalReviews = await _context.Reviews.CountAsync();
            var totalFavorites = await _context.Favorites.CountAsync();
            
            return Ok(new
            {
                TotalUsers = totalUsers,
                TotalReviews = totalReviews,
                TotalFavorites = totalFavorites,
                SystemStatus = "Healthy",
                Message = "Hoş geldin Admin! Sistem kontrolün altında."
            });
        }
    }
}