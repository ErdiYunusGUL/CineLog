using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CineLog.DataAccess.Context;
using CineLog.Entity.DTOs;
using CineLog.Entity.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CineLog.Business.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            // E-posta veya Kullanıcı adı daha önce alınmış mı kontrol et
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email || u.Username == dto.Username))
            {
                throw new Exception("Bu e-posta veya kullanıcı adı zaten kullanılıyor.");
            }

            // Şifreyi BCrypt ile güvenli bir şekilde şifrele (Hash)
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // Yeni kullanıcıyı oluştur ve veritabanına kaydet
            var newUser = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = passwordHash
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return new AuthResponseDto { Message = "Kayıt işlemi başarıyla tamamlandı. Lütfen giriş yapın." };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            // Kullanıcıyı veritabanında E-postası ile ara
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

            // Kullanıcı yoksa veya Şifresi (şifrelenmiş haliyle) eşleşmiyorsa kov!
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                throw new Exception("E-posta veya şifre hatalı.");
            }

            // GİRİŞ BAŞARILI! Yaka Kartını (JWT Token) Basma Zamanı
            var token = GenerateJwtToken(user, dto.RememberMe);

            return new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Message = "Giriş başarılı!"
            };
        }

        // --- GİZLİ TOKEN BASMA MAKİNESİ ---
        private string GenerateJwtToken(User user, bool rememberMe)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new Exception("SecretKey bulunamadı!");

            // Kartın içine yazılacak bilgiler (ID, Username ve YENİ: ROLE)
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Role, user.Role), // RBAC için kritik satır!
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Güvenlik damgası
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Kartı oluşturuyoruz
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(rememberMe ? (30 * 24 * 60) : double.Parse(jwtSettings["ExpiryMinutes"]!)),
                signingCredentials: creds
            );
            // Kartı metne çevirip veriyoruz
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}


