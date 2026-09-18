using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 1. CORS SIKILAÞTIRMASI
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("https://keen-palmier-cfc30a.netlify.app", "http://localhost:5173")
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

// JWT Authentication Doðrulama
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

// 2. DDoS VE BRUTE FORCE KORUMASI (Rate Limiting)
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100, // 1 dakikada max 100 istek
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
            
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        await context.HttpContext.Response.WriteAsync("Cok fazla istek attiniz. Lutfen biraz bekleyin.", cancellationToken: token);
    };
});

var app = builder.Build();

// Veritabaný ve Þema Güncellemeleri
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CineLog.DataAccess.Context.AppDbContext>();
    db.Database.EnsureCreated(); // Tablolarý açar
    
    try {
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"AiTasteAnalysis\" text NULL;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"Role\" text NOT NULL DEFAULT 'User';");
        db.Database.ExecuteSqlRaw("UPDATE \"Users\" SET \"Role\" = 'Admin' WHERE \"Username\" = 'erdi.gul' OR \"Email\" LIKE '%erdi%';");
    } catch { } // Sütun zaten varsa hata vermesin
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 3. HTTP GÜVENLÝK BAÞLIKLARI
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self' 'unsafe-inline' https://api.themoviedb.org https://generativelanguage.googleapis.com; img-src 'self' data: https://image.tmdb.org https://ui-avatars.com https://via.placeholder.com;");
    await next();
});

app.UseRateLimiter(); 
app.UseCors("AllowReact");
app.UseAuthentication(); 
app.UseAuthorization();  

app.MapControllers();
app.Run();
