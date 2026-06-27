import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PantryExpiryEngine } from '../lib/pantry-expiry-engine';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        skillLevel: true,
        dietaryRestrictions: true,
        spicyTolerance: true,
        isPremium: true,
        subscriptionExpiresAt: true,
        currentPantry: true,
        pantryItems: true,
        tasteProfile: true,
        quotaUsed: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user };
  }

  async getHistory(userId: string) {
    const history = await this.prisma.cookingSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });

    return { history };
  }

  async updatePantry(userId: string, pantry: any[]) {
    // Keep legacy array in sync for backward compatibility
    const currentPantry = pantry.map(p => `${p.name}:${p.status}`);
    
    await this.prisma.$transaction(async (tx) => {
      // 1. Clear current items
      await tx.pantryItem.deleteMany({ where: { userId } });
      
      // 2. Insert new items with appropriate expiry dates
      const newItems = pantry.map(p => {
        let expiresAt = null;
        if (p.status === 'Expiring Today') {
           expiresAt = new Date();
        } else if (p.status === 'Use Soon') {
           const d = new Date();
           d.setDate(d.getDate() + 3);
           expiresAt = d;
        }
        
        return {
          userId,
          name: p.name,
          quantity: 1,
          unit: 'unit',
          expiresAt
        };
      });
      
      if (newItems.length > 0) {
        await tx.pantryItem.createMany({ data: newItems });
      }

      await tx.user.update({
        where: { id: userId },
        data: { currentPantry },
      });
    });

    return { success: true };
  }

  async getImpact(userId: string) {
    const pantryEngine = new PantryExpiryEngine(this.prisma);
    const wasteSaved = await pantryEngine.calculateWasteSaved(userId);
    
    // Calculate total meals cooked
    const mealsCooked = await this.prisma.cookingSession.count({
      where: { userId, completedAt: { not: null } }
    });

    return {
      wasteSaved,
      mealsCooked,
    };
  }
}
