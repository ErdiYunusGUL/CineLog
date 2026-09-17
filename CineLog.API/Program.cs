using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// CORS ayarı (React projemizin API'ye istek atabilmesi için)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.AllowAnyOrigin() // Vercel'den ve her yerden gelecek isteklere izin ver
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

// Dependency Injection (Servisler)
builder.Services.AddScoped<CineLog.Business.Services.IAuthService, CineLog.Business.Services.AuthService>();
builder.Services.AddScoped<CineLog.Business.Services.IInteractionService, CineLog.Business.Services.InteractionService>();
builder.Services.AddScoped<CineLog.Business.Services.ICommunityService, CineLog.Business.Services.CommunityService>();
builder.Services.AddScoped<CineLog.Business.Services.IAiService, CineLog.Business.Services.AiService>();


// DbContext (PostgreSQL)
builder.Services.AddDbContext<CineLog.DataAccess.Context.AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient<CineLog.Business.Services.IMovieService, CineLog.Business.Services.MovieService>();
builder.Services.AddOpenApi();

// JWT Authentication Doğrulama Ayarları
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "default_secret_key_if_missing_but_shouldnt_be";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // UYGULAMA BAŞLARKEN VERİTABANINI OTOMATİK OLUŞTUR (POSTGRESQL İÇİN SIFIRDAN)
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<CineLog.DataAccess.Context.AppDbContext>();
        db.Database.EnsureCreated(); // Tabloları PostgreSQL'de otomatik açar
        
        try {
            db.Database.ExecuteSqlRaw("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"AiTasteAnalysis\" text NULL;");
        } catch { } // Sütun zaten varsa hata vermesin
    }

    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS ve Güvenlik
// app.UseHttpsRedirection(); // Ngrok HTTP tünellemesini bozduğu için kapatıldı
app.UseCors("AllowReact");
app.UseAuthentication(); // Kimlik doğrulama (Yaka Kartı kontrolü)
app.UseAuthorization();  // Yetki doğrulama

app.MapControllers();

app.Run();

app.Run();
