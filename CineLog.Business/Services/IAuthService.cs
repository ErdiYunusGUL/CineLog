using CineLog.Entity.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace CineLog.Business.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
    }
}
