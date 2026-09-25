using System;
using System.Collections.Generic;
using System.Text;

namespace CineLog.Entity.DTOs
{
    // Kayıt olurken kullanıcının bize göndereceği bilgiler
    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // Giriş yaparken bize göndereceği bilgiler
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; }
    }

    // Giriş başarılı olunca bizim ona geri döneceğimiz cevap (Yaka Kartı/Token)
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
