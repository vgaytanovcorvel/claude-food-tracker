using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MisteryApp.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodLogImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageBase64",
                table: "FoodLog",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageBase64",
                table: "FoodLog");
        }
    }
}
