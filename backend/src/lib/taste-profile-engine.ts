import { PrismaClient } from '@prisma/client';

export class TasteProfileEngine {
  constructor(private prisma: PrismaClient) {}

  async rebuildTasteProfile(userId: string) {
    const ratings = await this.prisma.recipeRating.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    if (ratings.length < 3) return; // Need minimum data

    const highRated = ratings.filter(r => r.rating >= 4);

    const avgSpice = this.extractAvgSpiceFromTags(ratings);
    const topCuisines = this.extractTopCuisines(highRated);
    const avoided = this.extractAvoidedIngredients(ratings.filter(r => r.rating <= 2));
    const avgCookTime = await this.getAvgCookTimeFromSessions(userId);

    await this.prisma.tasteProfile.upsert({
      where: { userId },
      create: {
        userId,
        favoriteSpiceLevel: avgSpice,
        favoriteCuisines: topCuisines,
        avoidedIngredients: avoided,
        preferredCookingTime: avgCookTime
      },
      update: {
        favoriteSpiceLevel: avgSpice,
        favoriteCuisines: topCuisines,
        avoidedIngredients: avoided,
        preferredCookingTime: avgCookTime
      }
    });
  }

  private extractAvgSpiceFromTags(ratings: any[]): number {
    // Stub implementation
    return 3; 
  }

  private extractTopCuisines(ratings: any[]): string[] {
    // Stub implementation
    return ['Punjabi', 'Sindhi'];
  }

  private extractAvoidedIngredients(lowRatings: any[]): string[] {
    // Stub implementation
    return [];
  }

  private async getAvgCookTimeFromSessions(userId: string): Promise<number> {
    const sessions = await this.prisma.cookingSession.findMany({
      where: { userId, actualCookingTime: { not: null } },
      take: 10,
    });
    if (sessions.length === 0) return 45;
    const sum = sessions.reduce((acc, curr) => acc + (curr.actualCookingTime || 0), 0);
    return Math.round(sum / sessions.length);
  }
}
