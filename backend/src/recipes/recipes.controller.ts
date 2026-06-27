import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post('session')
  async startSession(@Request() req: any, @Body() body: any) {
    const { dishName, ingredients, recipe } = body;
    return this.recipesService.startSession(req.user.id, dishName, ingredients, recipe);
  }

  @Get('session/:id')
  async getSession(@Request() req: any, @Param('id') id: string) {
    return this.recipesService.getSession(req.user.id, id);
  }

  @Patch('session/:id/complete')
  async completeSession(
    @Request() req: any,
    @Param('id') id: string,
    @Body('rating') rating?: number,
    @Body('feedback') feedback?: string,
  ) {
    return this.recipesService.completeSession(req.user.id, id, rating, feedback);
  }

  // --- PHASE 5: Community Hub ---

  @Post('community/publish')
  async publishToCommunity(@Request() req: any, @Body() body: any) {
    const { dishName, ingredients, instructions, originalDishId, difficulty, cookTime } = body;
    return this.recipesService.publishToCommunity(req.user.id, {
      dishName, ingredients, instructions, originalDishId, difficulty, cookTime
    });
  }

  @Get('community')
  async getCommunityRecipes() {
    return this.recipesService.getCommunityRecipes();
  }

  @Post('community/:id/upvote')
  async upvoteCommunityRecipe(@Request() req: any, @Param('id') id: string) {
    return this.recipesService.upvoteCommunityRecipe(req.user.id, id);
  }
}
