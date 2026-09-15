using System;
using System.Collections.Generic;
using System.Text;
using CineLog.Entity.DTOs;

namespace CineLog.Business.Services
{
    public interface ICommunityService
    {
        // 1. Kullanıcının sinema zevkine göre diğer kullanıcılarla eşleşmesini bulur.
        Task<List<CommunityMatchDto>> GetSoulmateMatchesAsync(int userId);

        // 2. Herhangi bir kullanıcının (ID'si verilen) herkese açık profil verilerini getirir.
        Task<PublicProfileDto> GetPublicProfileAsync(int targetUserId);

        // 3. Platformdaki en son hareketleri (puanlama, izleme vb.) anlık sosyal akış olarak getirir.
        Task<List<ActivityDto>> GetActivityFeedAsync();
    }
}
