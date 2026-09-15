using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CineLog.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddTasteProfileToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FavoriteGenreId",
                table: "Users",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FavoriteGenreName",
                table: "Users",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FavoriteGenreId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "FavoriteGenreName",
                table: "Users");
        }
    }
}
