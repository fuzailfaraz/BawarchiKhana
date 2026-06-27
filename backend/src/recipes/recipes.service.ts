import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PantryExpiryEngine } from '../lib/pantry-expiry-engine';
import { TasteProfileEngine } from '../lib/taste-profile-engine';
import { BawarchiRAGPipeline } from '../lib/rag-pipeline';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async startSession(userId: string, dishName: string, ingredients: string[], recipe: any) {
    const session = await this.prisma.cookingSession.create({
      data: {
        userId,
        dishName,
        ingredientsUsed: ingredients,
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

    const updatedSession = await this.prisma.cookingSession.update({
      where: { id },
      data: {
        completedAt: new Date(),
        rating,
        feedback,
      },
    });

    // ── PHASE 2: Auto-Deduct Pantry Ingredients ───────────────────────
    try {
      const pantryEngine = new PantryExpiryEngine(this.prisma);
      // 'ingredients' is the array of used ingredients for the session
      await pantryEngine.deductUsedIngredients(userId, session.ingredientsUsed);
    } catch (error) {
      console.error('Failed to deduct pantry ingredients:', error);
    }

    // ── PHASE 3: Update Personal Taste Profile & RAG Flywheel ───────────
    try {
      const tasteEngine = new TasteProfileEngine(this.prisma);
      await tasteEngine.rebuildTasteProfile(userId);

      const ragPipeline = new BawarchiRAGPipeline(this.prisma);
      await ragPipeline.storeSessionInPersonalKB(updatedSession as any);
    } catch (error) {
      console.error('Failed to update Taste Profile / RAG KB:', error);
    }

    return updatedSession;
  }

  // --- PHASE 5: Community Hub ---

  async publishToCommunity(userId: string, data: any) {
    const { dishName, ingredients, instructions, originalDishId, difficulty, cookTime } = data;
    
    // Create the recipe in the community hub
    const communityRecipe = await this.prisma.communityRecipe.create({
      data: {
        name: dishName,
        ingredients,
        instructions,
        originalDishId,
        creatorId: userId,
        difficulty,
        cookTime: cookTime ? parseInt(cookTime) : null,
      }
    });

    // Option: also embed it into the global recipe kb? We could, but just saving to relational DB is fine for Phase 5.
    
    return communityRecipe;
  }

  async getCommunityRecipes() {
    // 1. Determine Trending (Simple Algorithm: upvotes > 5 or recent with high interaction)
    // For now we'll just return top upvoted as trending and recent as recent.
    
    const trending = await this.prisma.communityRecipe.findMany({
      take: 10,
      orderBy: { upvotes: 'desc' },
      include: {
        creator: { select: { name: true, id: true } }
      }
    });

    const recent = await this.prisma.communityRecipe.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { name: true, id: true } }
      }
    });

    return { trending, recent };
  }

  async upvoteCommunityRecipe(userId: string, recipeId: string) {
    // Increment upvotes
    const recipe = await this.prisma.communityRecipe.update({
      where: { id: recipeId },
      data: { upvotes: { increment: 1 } },
    });

    // If upvotes pass a threshold, mark it as trending
    if (recipe.upvotes >= 5 && !recipe.isTrending) {
      await this.prisma.communityRecipe.update({
        where: { id: recipeId },
        data: { isTrending: true }
      });
      
      // Since it's trending, we can add it to the core RAG kb to improve future results
      try {
        const ragPipeline = new BawarchiRAGPipeline(this.prisma);
        await ragPipeline.ingestTrendingCommunityRecipe(recipe);
      } catch (err) {
        console.error('Failed to ingest trending recipe to RAG KB', err);
      }
    }

    return recipe;
  }
}
