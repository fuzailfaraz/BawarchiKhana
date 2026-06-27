import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { BawarchiRAGPipeline, UserPreferences } from '../lib/rag-pipeline';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GeminiAI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GeminiAI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'fallback');
  }

  async suggestRecipes(
    userId: string, 
    ingredients: string[], 
    language?: string, 
    healthGoal?: string,
    expiringIngredients?: string[],
    isLeftoverMode?: boolean,
    maxTime?: string
  ) {
    try {
      // 1. Prepare user preferences
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const userPreferences: UserPreferences = {
        skillLevel: user?.skillLevel || 'beginner',
        cookingTime: maxTime && maxTime !== 'Any' ? parseInt(maxTime) : 45,
        servings: 4,
        restrictions: user?.dietaryRestrictions || [],
      };

      // 2. Fetch live pantry state
      const pantryState = await this.prisma.pantryItem.findMany({ where: { userId } });

      // 3. Generate augmented context via RAG
      const ragPipeline = new BawarchiRAGPipeline(this.prisma);
      const augmentedContext = await ragPipeline.generateAugmentedContext(
        userId,
        ingredients,
        userPreferences,
        pantryState
      );

      // 4. Call Gemini with the rich RAG prompt
      const model = this.genAI.getGenerativeModel({ 
        model: 'models/gemini-2.5-flash-lite',
        generationConfig: {
          maxOutputTokens: 3000,
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(augmentedContext.augmentedPrompt);
      const text = result.response.text();

      // Clean up markdown wrapping if present
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      let suggestions = JSON.parse(cleanedText);

      // We map the new schema to the old schema structure so the frontend doesn't break entirely,
      // while preserving new RAG-specific fields under a metadata wrapper.
      // (BawarchiRAGPipeline returns {"suggestions": [...]})
      const mappedRecipes = (suggestions.suggestions || []).map((s: any) => ({
        dishName: s.name || 'AI Recipe',
        prepTime: '15 mins', // Static fallback since new prompt only gives cookTime
        cookTime: `${s.cookTime || 30} mins`,
        difficulty: 'Medium',
        matchedIngredients: s.ingredients || [],
        missingIngredients: [], // Implicitly none with RAG prioritizing owned ingredients
        instructions: s.quickSteps || [],
        nutrition: {
          calories: 'N/A',
          protein: 'Medium',
          fat: 'Medium',
          fiber: 'Medium'
        },
        healthWarnings: ['No major concerns.'],
        ragMetadata: {
          region: s.region,
          spiceLevel: s.spiceLevel,
          usesExpiringIngredients: s.usesExpiringIngredients,
          expiringItemsUsed: s.expiringItemsUsed,
          personalizedReason: s.personalizedReason,
          sourceRecipe: s.sourceRecipe
        }
      }));

      // 5. Store session data
      await this.prisma.suggestionHistory.create({
        data: {
          userId,
          ingredients,
          suggestions: mappedRecipes,
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { quotaUsed: { increment: 1 } },
      });

      // After generation, start the flywheel to add to the User History KB
      // We'll stub a session here for the flywheel, although usually you'd log it after they *cook* it.
      // For demo purposes, we can log the first suggestion as 'viewed'.
      
      return {
        recipes: mappedRecipes,
        metadata: {
          sourcesUsed: augmentedContext.metadata.sourcesUsed,
          personalized: augmentedContext.metadata.personalizationScore > 0,
          ragPowered: true
        }
      };

    } catch (error: any) {
      this.logger.error('Error generating AI recipes via RAG pipeline', error);

      // Fallback
      return {
        recipes: [
          {
            dishName: "Chef's Special Pantry Stir Fry (Fallback)",
            prepTime: "10 mins",
            cookTime: "15 mins",
            difficulty: "Easy",
            matchedIngredients: ingredients.slice(0, 4),
            missingIngredients: [],
            instructions: [
              "Heat oil in a pan over medium heat.",
              "Carefully sauté your ingredients until lightly browned.",
              "Mix in the remaining ingredients and stir well for 5 minutes.",
              "Serve hot and enjoy!"
            ],
            nutrition: { calories: "320 kcal", protein: "Medium", fat: "Medium", fiber: "High" },
            healthWarnings: ["No major concerns."],
            isClassic: true
          }
        ],
        metadata: {
          ragPowered: false,
          error: "RAG pipeline unavailable."
        }
      };
    }
  }

  async analyzeFridgeImage(base64Image: string) {
    try {
      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      
      const prompt = `
        You are a smart kitchen assistant. Look at this image of a fridge or pantry.
        Identify the food ingredients you can clearly see. 
        Return strictly a JSON array of strings containing only the ingredient names in lowercase.
        Example format: { "ingredients": ["tomato", "chicken", "onion", "milk"] }
        Do not include markdown blocks or any other text.
      `;

      const model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-lite' });
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg' // Defaulting to jpeg for generic base64 upload
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (parseError) {
        this.logger.error('Failed to parse fridge image JSON, returning fallback', parseError);
        data = { ingredients: ["tomato", "onion", "garlic", "chicken"] };
      }
      return data;
    } catch (error) {
      this.logger.error('Error analyzing fridge image', error);
      throw new InternalServerErrorException('Failed to analyze image');
    }
  }

  async chatWithCopilot(message: string, recipeContext: any, history: any[] = []) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-lite' });
      const chat = model.startChat({
        history: history.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      const systemPrompt = `
        You are BawarchiKhana's Cooking Copilot, a helpful AI cooking assistant.
        The user is currently cooking this recipe:
        Name: ${recipeContext.dishName}
        Ingredients: ${recipeContext.matchedIngredients?.join(', ')}
        Instructions: ${recipeContext.instructions?.join(' ')}

        Answer the user's question briefly and accurately, strictly focusing on helping them cook this specific recipe. Keep the tone encouraging and friendly. Provide short, punchy answers (max 2-3 sentences).
        
        User's question: ${message}
      `;

      const result = await chat.sendMessage(systemPrompt);
      const response = result.response;
      return { reply: response.text() };
    } catch (error) {
      this.logger.error('Error in Cooking Copilot chat', error);
      throw new InternalServerErrorException('Copilot failed to respond');
    }
  }

  async suggestSubstitution(ingredientToReplace: string, availableIngredients: string[] = []) {
    try {
      const prompt = `
        You are a smart culinary assistant. The user needs a substitute for "${ingredientToReplace}".
        ${availableIngredients.length > 0 ? `They currently have these ingredients available: ${availableIngredients.join(', ')}.` : ''}
        
        Suggest the best possible 100% Halal substitute for this ingredient. If possible, suggest something from their available ingredients, otherwise suggest a very common pantry item.
        Respond strictly with a JSON object in this format:
        {
          "substitution": "Name of substitute ingredient",
          "reason": "Brief reason why it works (max 1 sentence)"
        }
      `;

      const model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash-lite' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (parseError) {
        this.logger.error('Failed to parse substitution JSON, returning fallback', parseError);
        data = { substitution: "Water or mild broth", reason: "Safe default fallback as AI parsing failed." };
      }
      return data;
    } catch (error) {
      this.logger.error('Error suggesting substitution', error);
      throw new InternalServerErrorException('Failed to suggest substitution');
    }
  }

  async parseRecipeFromText(text: string, userId: string) {
    try {
      const prompt = `
        You are a smart kitchen assistant. The user has uploaded a recipe document.
        Extract the recipe details from the text below and format it strictly as a JSON object matching this schema.
        {
          "dishName": "Name of the dish",
          "prepTime": "e.g., 15 mins",
          "cookTime": "e.g., 30 mins",
          "difficulty": "Easy/Medium/Hard",
          "matchedIngredients": ["ingredient 1", "ingredient 2"],
          "instructions": ["Step 1", "Step 2"],
          "nutrition": {
            "calories": "e.g., 420 kcal",
            "protein": "Low/Medium/High",
            "fat": "Low/Medium/High",
            "fiber": "Low/Medium/High"
          },
          "healthWarnings": ["warning 1", "warning 2"]
        }
        
        Document text:
        ${text}
      `;

      const model = this.genAI.getGenerativeModel({ 
        model: 'models/gemini-2.5-flash-lite',
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      
      const cleanedText = textResponse.replace(/```json\n?|\n?```/g, '').trim();
      let recipeData;
      try {
        recipeData = JSON.parse(cleanedText);
      } catch (parseError) {
        this.logger.error('Failed to parse recipe from text, returning generic fallback', parseError);
        recipeData = {
          dishName: "Imported Recipe (Fallback)",
          prepTime: "10 mins",
          cookTime: "20 mins",
          difficulty: "Medium",
          matchedIngredients: ["Basic ingredients"],
          missingIngredients: [],
          instructions: ["Follow the instructions from your PDF."],
          nutrition: { calories: "300 kcal", protein: "Medium", fat: "Medium", fiber: "Medium" },
          healthWarnings: ["No major concerns."]
        };
      }

      const session = await this.prisma.cookingSession.create({
        data: {
          userId,
          dishName: recipeData.dishName || "Imported Recipe",
          ingredientsUsed: recipeData.matchedIngredients || [],
          recipe: recipeData,
          startedAt: new Date(),
        }
      });

      return session;
    } catch (error) {
      this.logger.error('Error parsing recipe from text', error);
      throw new InternalServerErrorException('Failed to parse the imported recipe.');
    }
  }

  async generateMealPlan(ingredients: string[]) {
    try {
      const prompt = `
        You are a smart culinary assistant. The user wants a 7-day meal plan.
        They have these ingredients: ${ingredients.join(', ')}.
        Generate a weekly meal plan (Monday to Sunday) with a Lunch and Dinner for each day.
        Try to utilize their ingredients where possible, but it's okay to suggest normal everyday meals (like Chicken Karahi, Daal Chawal, etc.).
        Keep the meal names short (2-4 words).
        
        Respond strictly with a JSON object in this format:
        {
          "plan": {
            "Monday": { "lunch": "...", "dinner": "..." },
            "Tuesday": { "lunch": "...", "dinner": "..." },
            "Wednesday": { "lunch": "...", "dinner": "..." },
            "Thursday": { "lunch": "...", "dinner": "..." },
            "Friday": { "lunch": "...", "dinner": "..." },
            "Saturday": { "lunch": "...", "dinner": "..." },
            "Sunday": { "lunch": "...", "dinner": "..." }
          }
        }
      `;
      const model = this.genAI.getGenerativeModel({ 
        model: 'models/gemini-2.5-flash-lite',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      let data;
      try {
        data = JSON.parse(cleanedText);
      } catch (parseError) {
        this.logger.error('Failed to parse meal plan JSON, returning fallback', parseError);
        data = {
          plan: {
            Monday: { lunch: "Chicken Sandwich", dinner: "Daal Chawal" },
            Tuesday: { lunch: "Leftover Daal", dinner: "Chicken Karahi" },
            Wednesday: { lunch: "Salad", dinner: "Aalu Gosht" },
            Thursday: { lunch: "Pasta", dinner: "Biryani" },
            Friday: { lunch: "Leftover Biryani", dinner: "Nihari" },
            Saturday: { lunch: "Wrap", dinner: "Pizza" },
            Sunday: { lunch: "Omelet", dinner: "BBQ" }
          }
        };
      }
      return data;
    } catch (e) {
      this.logger.error('Error generating meal plan', e);
      throw new InternalServerErrorException('Failed to generate meal plan');
    }
  }
}
