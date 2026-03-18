using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MisteryApp.Repository.Entities;

namespace MisteryApp.Repository.Configurations;

public class AlternativeBookmarkEntityConfiguration : IEntityTypeConfiguration<AlternativeBookmarkEntity>
{
    public void Configure(EntityTypeBuilder<AlternativeBookmarkEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.AlternativeFoodName).IsRequired().HasMaxLength(200);
        builder.Property(e => e.ImageBase64).HasColumnType("TEXT").IsRequired(false);
        builder.Property(e => e.MimeType).HasMaxLength(100).IsRequired(false);
        builder.Property(e => e.CreatedAt).IsRequired();

        builder.HasOne(e => e.UserProfile)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
