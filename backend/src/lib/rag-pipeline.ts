import { PrismaClient, CookingSession, PantryItem, TasteProfile } from '@prisma/client';
import { generateEmbedding } from './embeddings';
import { Prisma } from '@prisma/client';

export interface UserPreferences {
  skillLevel: string;
  cookingTime: number;
  servings: number;
  restrictions?: string[];
}

export interface AugmentedContext {
  augmentedPrompt: string;
  metadata: any;
}

export interface PromptContext {
  ingredients: string[];
  userPreferences: UserPreferences;
  similarRecipes: any[];
  personalHistory: any[];
  ingredientKnowledge: any[];
  culturalContext: string;
  expiringItems: PantryItem[];
  tasteProfile: TasteProfile | null;
}

export class BawarchiRAGPipeline {
  constructor(private prisma: PrismaClient) {}

  async generateAugmentedContext(
    userId: string,
    ingredients: string[],
    userPreferences: UserPreferences,
    pantryState: PantryItem[]
  ): Promise<AugmentedContext> {
    const queryText = `Pakistani recipe using ${ingredients.join(' ')} for ${userPreferences.skillLevel} cook`;
    const queryEmbedding = await generateEmbedding(queryText);

    // ── Step 1: Retrieve from all 4 KBs in parallel ──────────────────────
    const [similarRecipes, personalHistory, ingredientKnowledge, culturalContext] =
      await Promise.all([
        this.retrieveSimilarRecipes(queryEmbedding, ingredients),
        this.retrievePersonalHistory(userId, queryEmbedding),
        this.retrieveIngredientKnowledge(ingredients),
        this.retrieveCulturalContext(userPreferences)
      ]);

    // ── Step 2: Pull real-time operational context ─────────────────────────
    const expiringItems = pantryState.filter(p => this.daysUntilExpiry(p.expiresAt) <= 3);
    const tasteProfile = await this.getTasteProfile(userId);

    // ── Step 3: Build the rich augmented prompt ────────────────────────────
    const augmentedPrompt = this.buildAugmentedPrompt({
      ingredients,
      userPreferences,
      similarRecipes,
      personalHistory,
      ingredientKnowledge,
      culturalContext,
      expiringItems,
      tasteProfile
    });

    return {
      augmentedPrompt,
      metadata: {
        sourcesUsed: {
          recipesRetrieved: similarRecipes.length,
          historySessionsUsed: personalHistory.length,
          ingredientsLookedUp: ingredientKnowledge.length,
          hasCulturalContext: !!culturalContext,
          expiringItemsIncluded: expiringItems.length,
          hasPersonalProfile: !!tasteProfile
        },
        personalizationScore: personalHistory.length > 0 ? 1 : 0
      }
    };
  }

  private async retrieveSimilarRecipes(queryEmbedding: number[], ingredients: string[]) {
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        content,
        metadata,
        1 - (embedding <=> $1::vector) as similarity
      FROM recipe_embeddings
      WHERE 1 - (embedding <=> $1::vector) > 0.78
      ORDER BY similarity DESC
      LIMIT 3
    `, vectorString);

    return results.map((r) => ({
      title: r.metadata?.title,
      region: r.metadata?.region,
      content: r.content,
      similarity: r.similarity,
      matchedIngredients: ingredients.filter(ing =>
        r.metadata?.mainIngredients?.includes(ing.toLowerCase())
      )
    }));
  }

  private async retrievePersonalHistory(userId: string, queryEmbedding: number[]) {
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        content,
        metadata,
        1 - (embedding <=> $1::vector) as similarity
      FROM user_history_embeddings
      WHERE user_id = $2
        AND 1 - (embedding <=> $1::vector) > 0.75
      ORDER BY similarity DESC
      LIMIT 5
    `, vectorString, userId);
    return results || [];
  }

  private async retrieveIngredientKnowledge(ingredients: string[]) {
    const results = await Promise.all(
      ingredients.slice(0, 5).map(async (ing) => {
        const embedding = await generateEmbedding(ing);
        const vectorString = `[${embedding.join(',')}]`;
        const result = await this.prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            content,
            1 - (embedding <=> $1::vector) as similarity
          FROM ingredient_embeddings
          WHERE 1 - (embedding <=> $1::vector) > 0.85
          ORDER BY similarity DESC
          LIMIT 1
        `, vectorString);
        return result?.[0] || null;
      })
    );
    return results.filter(Boolean);
  }

  private async retrieveCulturalContext(preferences: UserPreferences) {
    const contextQuery = `Pakistani cooking context for ${this.getCurrentSeason()} ${this.getCurrentOccasion()}`;
    const embedding = await generateEmbedding(contextQuery);
    const vectorString = `[${embedding.join(',')}]`;
    
    // NOTE: Requires a cultural_context_embeddings table if you have one.
    // Assuming recipe_embeddings is the source if cultural_context is missing
    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT content 
      FROM recipe_embeddings 
      WHERE 1 - (embedding <=> $1::vector) > 0.7
      ORDER BY 1 - (embedding <=> $1::vector) DESC 
      LIMIT 1
    `, vectorString);
    
    return results?.[0]?.content || '';
  }

  private buildAugmentedPrompt(ctx: PromptContext): string {
    const { ingredients, userPreferences, similarRecipes, personalHistory,
            ingredientKnowledge, culturalContext, expiringItems, tasteProfile } = ctx;

    const mealType = this.getMealType();

    // Build sections using string concatenation to avoid nested template literal issues
    const recipesSection = similarRecipes.length > 0
      ? similarRecipes.map((r, i) =>
          (i + 1) + '. ' + r.title + ' (' + (r.region || 'Traditional') + ' Style)\n' +
          '   Relevance: ' + ((r.similarity * 100).toFixed(0)) + '% match\n' +
          '   Uses from pantry: ' + (r.matchedIngredients?.join(', ') || 'Several') + '\n' +
          '   ' + (r.content?.substring(0, 400) || '') + '...'
        ).join('\n')
      : 'No highly similar recipes found — generate an authentic suggestion based on user context.';

    const historySection = personalHistory.length > 0
      ? personalHistory.map((h: any) => '- ' + h.content).join('\n')
      : '- New user. Provide beginner-friendly, crowd-pleasing Pakistani suggestions.';

    const tasteSection = tasteProfile
      ? '\nTaste Profile Summary:\n' +
        '- Preferred spice level: ' + tasteProfile.favoriteSpiceLevel + '/5\n' +
        '- Favourite cuisines: ' + tasteProfile.favoriteCuisines.join(', ') + '\n' +
        '- Cooking time preference: Under ' + tasteProfile.preferredCookingTime + ' minutes\n' +
        '- Ingredients to avoid: ' + (tasteProfile.avoidedIngredients.join(', ') || 'None stated')
      : '';

    const ingredientSection = ingredientKnowledge
      .map((i: any) => '- ' + (i?.content?.substring(0, 200) || ''))
      .join('\n');

    const expirySection = expiringItems.length > 0
      ? expiringItems.map(i =>
          '- ' + i.name + ' (' + i.quantity + ' ' + i.unit + ') — expires in ' + this.daysUntilExpiry(i.expiresAt) + ' day(s)'
        ).join('\n')
      : '- No items expiring soon.';

    return [
      'You are a Pakistani culinary expert assistant for BawarchiKhana.',
      '',
      '══════════════════════════════════════',
      'RETRIEVED AUTHENTIC RECIPES (ground your response in these — do not hallucinate):',
      '══════════════════════════════════════',
      recipesSection,
      '',
      '══════════════════════════════════════',
      'USER\'S PERSONAL TASTE HISTORY (' + personalHistory.length + ' relevant sessions retrieved):',
      '══════════════════════════════════════',
      historySection,
      tasteSection,
      '',
      '══════════════════════════════════════',
      'INGREDIENT KNOWLEDGE (from BawarchiKhana database):',
      '══════════════════════════════════════',
      ingredientSection,
      '',
      '══════════════════════════════════════',
      'EXPIRY PRIORITY — USE THESE FIRST:',
      '══════════════════════════════════════',
      expirySection,
      '',
      '══════════════════════════════════════',
      'CULTURAL CONTEXT:',
      '══════════════════════════════════════',
      culturalContext || 'Standard everyday Pakistani cooking context.',
      '',
      '══════════════════════════════════════',
      'CURRENT REQUEST:',
      '══════════════════════════════════════',
      'Available ingredients: ' + ingredients.join(', '),
      'Meal time: ' + mealType,
      'Skill level: ' + userPreferences.skillLevel,
      'Available time: ' + userPreferences.cookingTime + ' minutes',
      'Serving size: ' + userPreferences.servings + ' people',
      'Restrictions: ' + (userPreferences.restrictions?.join(', ') || 'None (Halal is mandatory)'),
      '',
      '══════════════════════════════════════',
      'TASK:',
      '══════════════════════════════════════',
      'Suggest exactly 3 personalized Pakistani dish options. Each suggestion MUST:',
      '1. Be grounded in the retrieved authentic recipes (not generic)',
      '2. Reflect this user\'s personal taste history and profile',
      '3. PRIORITIZE expiring ingredients — label these prominently',
      '4. Be appropriate for ' + mealType,
      '5. Be 100% Halal',
      '6. Match skill level and time constraint',
      '7. Include: dish name, region, cook time, spice level (1-5), why it was chosen for THIS user',
      '',
      'Respond ONLY in this JSON format:',
      '{',
      '  "suggestions": [',
      '    {',
      '      "name": "Dish name",',
      '      "region": "Punjab/Sindh/KP/etc",',
      '      "cookTime": 35,',
      '      "spiceLevel": 4,',
      '      "usesExpiringIngredients": true,',
      '      "expiringItemsUsed": ["tomatoes", "chicken"],',
      '      "personalizedReason": "Because you rated Karahi 5 stars last month and prefer spicy Punjabi food",',
      '      "sourceRecipe": "Lahori Chicken Karahi (from BawarchiKhana DB)",',
      '      "ingredients": ["..."],',
      '      "quickSteps": ["Step 1...", "Step 2...", "Step 3..."]',
      '    }',
      '  ],',
      '  "totalExpiryItemsAddressed": 2',
      '}',
    ].join('\n').trim();
  }

  // ─── After session: feed back into user's personal KB (flywheel) ───────────
  async storeSessionInPersonalKB(session: CookingSession) {
    if (!session.dishName) return;
    const document = [
      'Cooked: ' + session.dishName,
      'Date: ' + (session.completedAt ? session.completedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      'Rating: ' + (session.rating || 0) + '/5 stars',
      'Feedback: ' + (session.feedback || 'No feedback'),
      'Tags: ' + (session.tags?.join(', ') || ''),
      'Ingredients: ' + session.ingredientsUsed.join(', '),
      'Cook time: ' + (session.actualCookingTime || 'Unknown') + ' minutes',
      (session.rating && session.rating >= 4) ? 'User loved this dish — high priority for future recommendations.' : '',
      (session.rating && session.rating <= 2) ? 'User did not enjoy this dish — avoid suggesting similar.' : '',
    ].filter(Boolean).join('\n').trim();

    const embedding = await generateEmbedding(document);
    const vectorString = `[${embedding.join(',')}]`;

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO user_history_embeddings (user_id, content, embedding, metadata)
      VALUES ($1, $2, $3::vector, $4::jsonb)
    `, 
      session.userId, 
      document, 
      vectorString, 
      {
        dishName: session.dishName,
        rating: session.rating,
        tags: session.tags,
        dateCooked: session.completedAt || new Date()
      }
    );
  }

  async ingestTrendingCommunityRecipe(recipe: any) {
    const document = [
      'Title: ' + recipe.name,
      'Trending Community Recipe',
      'Difficulty: ' + (recipe.difficulty || 'Unknown'),
      'Cook Time: ' + (recipe.cookTime || 'Unknown') + ' minutes',
      'Upvotes: ' + recipe.upvotes,
      'Ingredients: ' + recipe.ingredients.join(', '),
      'Instructions:',
      recipe.instructions.join('\n'),
    ].join('\n').trim();

    const embedding = await generateEmbedding(document);
    const vectorString = `[${embedding.join(',')}]`;

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO recipe_embeddings (recipe_id, content, embedding, metadata, source)
      VALUES ($1, $2, $3::vector, $4::jsonb, $5)
    `,
      recipe.id || 'community-trending',
      document,
      vectorString,
      {
        title: recipe.name,
        difficulty: recipe.difficulty,
        cookTime: recipe.cookTime,
        mainIngredients: recipe.ingredients.map((i: string) => i.toLowerCase()),
        isCommunityTrending: true,
        communityUpvotes: recipe.upvotes
      },
      'community'
    );
  }

  private daysUntilExpiry(expiresAt?: Date | null): number {
    if (!expiresAt) return 99;
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private getMealType(): string {
    const hour = new Date().getHours();
    return hour < 11 ? 'breakfast/sehri' : hour < 16 ? 'lunch' : 'dinner/iftar';
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getCurrentOccasion(): string {
    // Basic stub, can integrate actual calendar checks later
    return 'everyday';
  }

  private async getTasteProfile(userId: string) {
    return this.prisma.tasteProfile.findUnique({ where: { userId } });
  }
}
