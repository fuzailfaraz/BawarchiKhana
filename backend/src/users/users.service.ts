import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const currentPantry = pantry.map(p => `${p.name}:${p.status}`);
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentPantry },
    });
    return { success: true };
  }
}
