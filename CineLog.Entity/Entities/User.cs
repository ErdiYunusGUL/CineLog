namespace CineLog.Entity.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // Şifreleri MD5/SHA256 gibi şifrelenmiş (Hash) şekilde tutacağız
        public string PasswordHash { get; set; } = string.Empty;

        // YENİ: Kullanıcının zevk profili (Onboarding sonrası dolacak)
        public int? FavoriteGenreId { get; set; }
        public string? FavoriteGenreName { get; set; }
        
        // YENİ: RBAC (Yetki Bazlı Erişim) için Rol tanımlaması. Varsayılan: User
        public string Role { get; set; } = "User";
        
        // YENİ: Yapay Zeka tarafından oluşturulmuş Psikolojik Sinema Analizi metni
        public string? AiTasteAnalysis { get; set; }

        // Bir kullanıcının birden fazla yorumu ve favorisi olabilir (İlişki)
        public List<Review> Reviews { get; set; } = new List<Review>();
        public List<FavoriteItem> Favorites { get; set; } = new List<FavoriteItem>();
    }
}