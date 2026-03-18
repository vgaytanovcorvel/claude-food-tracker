using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MisteryApp.Repository.Entities;

namespace MisteryApp.Repository.Configurations;

public class FoodLogEntityConfiguration : IEntityTypeConfiguration<FoodLogEntity>
{
    public void Configure(EntityTypeBuilder<FoodLogEntity> builder)
    {
        builder.ToTable("FoodLog");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FoodName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Source).HasMaxLength(20).IsRequired();
        builder.Property(e => e.AnalysisResult).IsRequired(false);

        builder.HasOne(e => e.UserProfile)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
