import { PrismaClient, PantryItem, PantryAction } from '@prisma/client';

export class PantryExpiryEngine {
  constructor(private prisma: PrismaClient) {}

  async getExpiryAlerts(userId: string) {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const pantry = await this.prisma.pantryItem.findMany({
      where: { 
        userId, 
        expiresAt: { lte: threeDaysFromNow } 
      },
      orderBy: { expiresAt: 'asc' }
    });

    return pantry.map((item) => {
      const daysLeft = item.expiresAt 
        ? Math.ceil((new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 99;

      return {
        item: item.name,
        nameUrdu: item.nameUrdu,
        quantity: `${item.quantity} ${item.unit}`,
        daysLeft,
        urgency: daysLeft <= 1 ? 'CRITICAL' : daysLeft <= 2 ? 'HIGH' : 'MEDIUM',
        suggestion: `Use ${item.name} today — expires in ${daysLeft} day(s)!`
      };
    });
  }

  rankSuggestionsByWastePriority(suggestions: any[], pantry: PantryItem[]) {
    const expiringNames = pantry
      .filter(p => p.expiresAt && Math.ceil((new Date(p.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3)
      .map(p => p.name.toLowerCase());

    return suggestions.sort((a, b) => {
      const aScore = a.ingredients?.filter((i: string) => expiringNames.includes(i.toLowerCase())).length || 0;
      const bScore = b.ingredients?.filter((i: string) => expiringNames.includes(i.toLowerCase())).length || 0;
      return bScore - aScore;
    });
  }

  async calculateWasteSaved(userId: string) {
    const saved = await this.prisma.pantryAction.count({
      where: { userId, action: 'USED_BEFORE_EXPIRY' }
    });
    return {
      itemsSaved: saved,
      moneySaved: saved * 150,      // PKR 150 avg per item
      kgWasteAvoided: saved * 0.25
    };
  }

  async deductUsedIngredients(userId: string, usedIngredients: string[]) {
    for (const ingredientName of usedIngredients) {
      const pantryItem = await this.prisma.pantryItem.findFirst({
        where: { userId, name: { contains: ingredientName, mode: 'insensitive' } }
      });

      if (pantryItem) {
        const wasExpiring = pantryItem.expiresAt &&
          Math.ceil((new Date(pantryItem.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3;

        await this.prisma.pantryAction.create({
          data: {
            userId,
            itemName: pantryItem.name,
            action: wasExpiring ? 'USED_BEFORE_EXPIRY' : 'REMOVED',
            quantity: pantryItem.quantity
          }
        });

        await this.prisma.pantryItem.delete({ where: { id: pantryItem.id } });
      }
    }
  }
}
