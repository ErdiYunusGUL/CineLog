using System;
using System.Collections.Generic;
using System.Text;
using CineLog.DataAccess.Context;
using CineLog.Entity.DTOs;
using Microsoft.EntityFrameworkCore;

namespace CineLog.Business.Services
{
    public class CommunityService : ICommunityService
    {
        private readonly AppDbContext _context;

        // Dependency Injection (Veritabanını mutfağa alıyoruz)
        public CommunityService(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. SİNEMA RUH İKİZİ (SOCIAL MATCHING)
        // ==========================================

        public async Task<List<CommunityMatchDto>> GetSoulmateMatchesAsync(int currentUserId)
        {
            var matches = new List<CommunityMatchDto>();
            var currentUser = await _context.Users.FindAsync(currentUserId);
            if (currentUser == null) return matches;

            var myReviews = await _context.Reviews.Where(r => r.UserId == currentUserId).ToListAsync();
            if (!myReviews.Any()) return matches;

            var otherUsers = await _context.Users.Where(u => u.Id != currentUserId).ToListAsync();

            foreach (var other in otherUsers)
            {
                var theirReviews = await _context.Reviews.Where(r => r.UserId == other.Id).ToListAsync();
                var sharedMovies = myReviews.Where(mr => theirReviews.Any(tr => tr.MovieId == mr.MovieId)).ToList();

                if (sharedMovies.Any())
                {
                    double totalSimilarity = 0;
                    foreach (var myRev in sharedMovies)
                    {
                        var theirRev = theirReviews.First(tr => tr.MovieId == myRev.MovieId);
                        double diff = Math.Abs(myRev.Rating - theirRev.Rating);
                        totalSimilarity += 100 - ((diff / 9.0) * 100.0);
                    }

                    double averageSimilarity = totalSimilarity / sharedMovies.Count;
                    double finalScore = averageSimilarity * 0.80;

                    if (currentUser.FavoriteGenreId.HasValue && other.FavoriteGenreId.HasValue &&
                        currentUser.FavoriteGenreId.Value == other.FavoriteGenreId.Value)
                    {
                        finalScore += 10;
                    }

                    int movieBonus = Math.Min(sharedMovies.Count * 2, 10);
                    finalScore += movieBonus;

                    if (finalScore > 100) finalScore = 100;

                    matches.Add(new CommunityMatchDto
                    {
                        UserId = other.Id,
                        Username = other.Username ?? $"Kullanıcı #{other.Id}",
                        FavoriteGenreName = other.FavoriteGenreName ?? "Bilinmiyor",
                        SharedRatedMoviesCount = sharedMovies.Count,
                        MatchPercentage = (int)Math.Round(finalScore)
                    });
                }
            }
            return matches.OrderByDescending(m => m.MatchPercentage).ToList();

        }

        // ==========================================
        // 2. HERKESE AÇIK PROFİLLER (PUBLIC PROFILE)
        // ==========================================

        public async Task<PublicProfileDto?> GetPublicProfileAsync(int targetUserId)
        {
            var user = await _context.Users.FindAsync(targetUserId);
            if (user == null) return null;

            var dto = new PublicProfileDto
            {
                UserId = user.Id,
                Username = user.Username ?? $"Kullanıcı #{user.Id}"
            };

            if (user.FavoriteGenreId.HasValue)
            {
                dto.TasteProfile = new TasteProfileDto
                {
                    FavoriteGenreId = user.FavoriteGenreId.Value,
                    FavoriteGenreName = user.FavoriteGenreName ?? "Bilinmiyor"
                };
            }

            dto.RecentWatches = await _context.WatchedHistories
                .Where(w => w.UserId == targetUserId)
                .OrderByDescending(w => w.WatchedAt)
                .Take(10)
                .ToListAsync();

            int totalWatched = await _context.WatchedHistories.CountAsync(w => w.UserId == targetUserId);
            if (totalWatched >= 50) dto.BadgeTitle = "Gerçek Sinefil 🏆";
            else if (totalWatched >= 10) dto.BadgeTitle = "Sinema Tutkunu 🎬";
            else dto.BadgeTitle = "Yeni Başlayan 🍿";

            // Özel Koleksiyonlar (Burada kod tekrarı yapmamak için DB'den direkt alıyoruz)
            var lists = await _context.CustomLists.Where(l => l.UserId == targetUserId).OrderByDescending(l => l.CreatedAt).ToListAsync();
            dto.CustomLists = lists.Select(l => new CustomListDto
            {
                Id = l.Id,
                Title = l.Title,
                Description = l.Description,
                CreatedAt = l.CreatedAt
            }).ToList();
            return dto;
        }

        // ==========================================
        // 3. SOSYAL AKIŞ (ACTIVITY FEED)
        // ==========================================

        public async Task<List<ActivityDto>> GetActivityFeedAsync()
        {
            var activities = new List<ActivityDto>();

            var recentWatches = await _context.WatchedHistories.Include(w => w.User).OrderByDescending(w => w.WatchedAt).Take(20).ToListAsync();

            foreach (var watch in recentWatches)
            {
                activities.Add(new ActivityDto
                {
                    Username = watch.User?.Username ?? "Birisi",
                    ActionType = "watched",
                    ItemName = watch.MovieTitle ?? "Bilinmeyen Film",
                    PosterPath = watch.PosterPath,
                    CreatedAt = watch.WatchedAt
                });
            }

            var recentReviews = await _context.Reviews.Include(r => r.User).OrderByDescending(r => r.CreatedAt).Take(20).ToListAsync();
            foreach (var review in recentReviews)
            {
                var movieDetail = await _context.WatchedHistories.FirstOrDefaultAsync(w => w.MovieId == review.MovieId);
                activities.Add(new ActivityDto
                {
                    Username = review.User?.Username ?? "Birisi",
                    ActionType = "rated",
                    ItemName = movieDetail?.MovieTitle ?? "Bir Film",
                    PosterPath = movieDetail?.PosterPath,
                    Rating = review.Rating,
                    CreatedAt = review.CreatedAt
                });
            }

            var recentLists = await _context.CustomLists.OrderByDescending(l => l.CreatedAt).Take(20).ToListAsync();

            foreach (var list in recentLists)
            {
                var user = await _context.Users.FindAsync(list.UserId);
                activities.Add(new ActivityDto
                {
                    Username = user?.Username ?? "Birisi",
                    ActionType = "created_list",
                    ItemName = list.Title,
                    CreatedAt = list.CreatedAt
                });
            }

            return activities.OrderByDescending(a => a.CreatedAt).Take(30).ToList();

        }

    }
}
