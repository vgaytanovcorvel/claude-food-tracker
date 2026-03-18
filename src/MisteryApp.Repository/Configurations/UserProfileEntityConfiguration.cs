using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MisteryApp.Repository.Entities;

namespace MisteryApp.Repository.Configurations;

public class UserProfileEntityConfiguration : IEntityTypeConfiguration<UserProfileEntity>
{
    public void Configure(EntityTypeBuilder<UserProfileEntity> builder)
    {
        builder.ToTable("UserProfiles");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.Property(e => e.DietStyle).IsRequired().HasMaxLength(50);
        builder.Property(e => e.CreatedAt).IsRequired();
    }
}
