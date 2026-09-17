using System.Threading.Tasks;
using System.Collections.Generic;

namespace CineLog.Business.Services
{
    public interface IAiService
    {
        Task<string> GetTasteAnalysisAsync(string genreName, List<string> recentMovies);
        Task<string> ChatWithCineBotAsync(string userMessage);
        Task<string> SummarizeReviewsAsync(string movieTitle, List<string> reviews);
    }
}
