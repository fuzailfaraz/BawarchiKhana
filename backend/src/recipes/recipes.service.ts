import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async startSession(userId: string, dishName: string, ingredients: string[], recipe: any) {
    const session = await this.prisma.cookingSession.create({
      data: {
        userId,
        dishName,
        ingredients,
        recipe, // JSON format
      },
    });
    return session;
  }

  async getSession(userId: string, id: string) {
    const session = await this.prisma.cookingSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException('Cooking session not found');
    }

    return session;
  }

  async completeSession(userId: string, id: string, rating?: number, feedback?: string) {
    const session = await this.prisma.cookingSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException('Cooking session not found');
    }

    return this.prisma.cookingSession.update({
      where: { id },
      data: {
        completedAt: new Date(),
        rating,
        feedback,
      },
    });
  }
}
