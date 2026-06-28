import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post('session')
  @UseGuards(JwtAuthGuard)
  async startSession(@Request() req: any, @Body() body: any) {
    const { dishName, ingredients, recipe } = body;
    return this.recipesService.startSession(req.user.id, dishName, ingredients, recipe);
  }

  @Get('session/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Request() req: any, @Param('id') id: string) {
    return this.recipesService.getSession(req.user.id, id);
  }

  @Patch('session/:id/complete')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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

  @Post('community/seed')
  async seedCommunity() {
    return this.recipesService.seedCommunity();
  }

  @Post('community/:id/upvote')
  @UseGuards(JwtAuthGuard)
  async upvoteCommunityRecipe(@Request() req: any, @Param('id') id: string) {
    return this.recipesService.upvoteCommunityRecipe(req.user.id, id);
  }
}
