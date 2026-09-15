using CineLog.Entity.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace CineLog.DataAccess.Context
{
    public class AppDbContext : DbContext
    {
        // Program.cs üzerinden ayarları alabilmesi için Constructor yazıyoruz
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Veritabanında oluşacak somut Tablolarımız
        public DbSet<User> Users { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<FavoriteItem> Favorites { get; set; }

        public DbSet<WatchlistMovie> Watchlists { get; set; }

        public DbSet<WatchedHistory> WatchedHistories { get; set; }
        
        // YENİ: Özel Koleksiyonlar (Listeler)
        public DbSet<CustomList> CustomLists { get; set; }
        public DbSet<CustomListMovie> CustomListMovies { get; set; }
    }

}
