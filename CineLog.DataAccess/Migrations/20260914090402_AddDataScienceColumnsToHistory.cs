using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CineLog.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddDataScienceColumnsToHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Director",
                table: "WatchedHistories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LeadActor",
                table: "WatchedHistories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ReleaseYear",
                table: "WatchedHistories",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Director",
                table: "WatchedHistories");

            migrationBuilder.DropColumn(
                name: "LeadActor",
                table: "WatchedHistories");

            migrationBuilder.DropColumn(
                name: "ReleaseYear",
                table: "WatchedHistories");
        }
    }
}
