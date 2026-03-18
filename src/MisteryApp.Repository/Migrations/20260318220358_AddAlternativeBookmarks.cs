using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MisteryApp.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddAlternativeBookmarks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlternativeBookmarks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    AlternativeFoodName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ImageBase64 = table.Column<string>(type: "TEXT", nullable: true),
                    MimeType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlternativeBookmarks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlternativeBookmarks_UserProfiles_UserId",
                        column: x => x.UserId,
                        principalTable: "UserProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlternativeBookmarks_UserId",
                table: "AlternativeBookmarks",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlternativeBookmarks");
        }
    }
}
