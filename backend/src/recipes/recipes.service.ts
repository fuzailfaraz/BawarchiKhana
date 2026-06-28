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

  async seedCommunity() {
    // Check if recipes exist
    const count = await this.prisma.communityRecipe.count();
    if (count > 0) return { message: 'Already seeded' };

    // Get any user to own these recipes
    let user = await this.prisma.user.findFirst();
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: '+920000000000',
          name: 'Bawarchi Chef',
          skillLevel: 'expert',
        }
      });
    }

    const recipes = [
      {
        name: 'Lahori Chicken Karahi',
        ingredients: ['chicken', 'tomatoes', 'green chilies', 'ginger', 'garlic', 'black pepper', 'oil'],
        instructions: ['Heat oil and fry chicken until brown.', 'Add ginger-garlic paste and tomatoes.', 'Cook until tomatoes break down into a rich gravy.', 'Garnish with green chilies and julienned ginger.'],
        difficulty: 'Medium',
        cookTime: 40,
        upvotes: 125,
        isTrending: true,
      },
      {
        name: 'Classic Beef Biryani',
        ingredients: ['beef', 'basmati rice', 'onions', 'yogurt', 'biryani masala', 'mint', 'coriander'],
        instructions: ['Marinate beef with yogurt and spices.', 'Fry onions until golden brown.', 'Cook beef until tender.', 'Layer partially cooked rice over the beef gravy.', 'Steam (dum) for 15 minutes.'],
        difficulty: 'Hard',
        cookTime: 90,
        upvotes: 89,
        isTrending: true,
      },
      {
        name: 'Quick Masala Oats',
        ingredients: ['oats', 'onions', 'tomatoes', 'green chilies', 'turmeric', 'salt', 'oil'],
        instructions: ['Sauté onions and green chilies in oil.', 'Add chopped tomatoes and turmeric.', 'Add water and bring to a boil.', 'Stir in oats and cook for 3 minutes until thick.'],
        difficulty: 'Easy',
        cookTime: 10,
        upvotes: 42,
        isTrending: false,
      },
      {
        name: 'Peshawari Chapli Kabab',
        ingredients: ['minced beef', 'onions', 'tomatoes', 'coriander seeds', 'pomegranate seeds', 'egg', 'wheat flour'],
        instructions: ['Mix all ingredients and knead well.', 'Form flat, large patties.', 'Shallow fry in beef tallow or oil until crispy on both sides.'],
        difficulty: 'Medium',
        cookTime: 25,
        upvotes: 210,
        isTrending: true,
      },
      {
        name: 'Creamy Butter Chicken',
        ingredients: ['chicken breast', 'butter', 'cream', 'tomato puree', 'garam masala', 'kasuri methi'],
        instructions: ['Marinate and grill chicken pieces.', 'In a pan, melt butter and add tomato puree.', 'Simmer with spices until oil separates.', 'Add chicken and cream, finish with kasuri methi.'],
        difficulty: 'Medium',
        cookTime: 45,
        upvotes: 18,
        isTrending: false,
      }
    ];

    for (const r of recipes) {
      await this.prisma.communityRecipe.create({
        data: {
          ...r,
          creatorId: user.id
        }
      });
    }

    return { message: 'Seeded successfully' };
  }
}
