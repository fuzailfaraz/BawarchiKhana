import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggest')
  @HttpCode(HttpStatus.OK)
  async suggestRecipes(
    @Request() req: any, 
    @Body('ingredients') ingredients: string[],
    @Body('language') language?: string,
    @Body('healthGoal') healthGoal?: string,
    @Body('expiringIngredients') expiringIngredients?: string[],
    @Body('isLeftoverMode') isLeftoverMode?: boolean,
    @Body('maxTime') maxTime?: string
  ) {
    const userId = req.user.id;
    return this.aiService.suggestRecipes(userId, ingredients, language, healthGoal, expiringIngredients, isLeftoverMode, maxTime);
  }

  @Post('copilot')
  @HttpCode(HttpStatus.OK)
  async chatWithCopilot(
    @Request() req: any,
    @Body('message') message: string,
    @Body('recipeContext') recipeContext: any,
    @Body('history') history?: any[]
  ) {
    return this.aiService.chatWithCopilot(message, recipeContext, history);
  }

  @Post('substitute')
  @HttpCode(HttpStatus.OK)
  async suggestSubstitution(
    @Request() req: any,
    @Body('ingredientToReplace') ingredientToReplace: string,
    @Body('availableIngredients') availableIngredients?: string[]
  ) {
    return this.aiService.suggestSubstitution(ingredientToReplace, availableIngredients);
  }

  @Post('vision')
  @HttpCode(HttpStatus.OK)
  async analyzeFridge(@Request() req: any, @Body('image') base64Image: string) {
    return this.aiService.analyzeFridgeImage(base64Image);
  }

  @Post('meal-plan')
  @HttpCode(HttpStatus.OK)
  async generateMealPlan(@Body('ingredients') ingredients: string[]) {
    return this.aiService.generateMealPlan(ingredients || []);
  }
}
