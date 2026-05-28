import { Controller, Get, Query, Req, Res, UseGuards, Post, Body, BadRequestException } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import type { Response } from 'express';

@Controller()
export class GoogleDriveController {
  constructor(private readonly googleDriveService: GoogleDriveService) { }

  @UseGuards(JwtAuthGuard)
  @Get('google-drive/connect')
  connect(@Req() req: any) {
    const url = this.googleDriveService.getAuthUrl(req.user.id);
    return { url };
  }

  @Get('auth/google/callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }
    const userId = state; // We passed userId in state parameter
    await this.googleDriveService.handleCallback(code, userId);

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/profile?googleConnected=true`);
  }

  @UseGuards(JwtAuthGuard)
  @Post('google-drive/export-recipe')
  async exportRecipe(@Req() req: any, @Body('recipeId') recipeId: string, @Res() res: Response) {
    try {
      const driveLink = await this.googleDriveService.exportRecipeToDrive(recipeId, req.user.id);
      return res.status(200).json({ success: true, driveLink, message: 'Recipe exported to Google Drive successfully!' });
    } catch (error: any) {
      console.error('Google Drive Export Error:', error);
      return res.status(500).json({ message: error.message || 'Failed to export recipe to Google Drive.' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('google-drive/files')
  async listFiles(@Req() req: any, @Query('q') q?: string) {
    const files = await this.googleDriveService.listDrivePdfs(req.user.id, q);
    return { success: true, files };
  }

  @UseGuards(JwtAuthGuard)
  @Post('google-drive/import')
  async importRecipe(@Req() req: any, @Body('fileId') fileId: string) {
    if (!fileId) throw new BadRequestException('fileId is required');
    const recipe = await this.googleDriveService.importRecipeFromDrive(fileId, req.user.id);
    return { success: true, recipe };
  }

  @UseGuards(JwtAuthGuard)
  @Post('google-drive/export-sheet')
  async exportSheet(@Req() req: any, @Body('recipeId') recipeId: string, @Res() res: Response) {
    try {
      const driveLink = await this.googleDriveService.exportRecipeToSheets(recipeId, req.user.id);
      return res.status(200).json({ success: true, driveLink, message: 'Recipe exported to Google Sheets successfully!' });
    } catch (error: any) {
      console.error('Google Sheets Export Error:', error);
      return res.status(500).json({ message: error.message || 'Failed to export recipe to Google Sheets.' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('google-drive/export-weekly-plan')
  async exportWeeklyPlan(@Req() req: any, @Body('plan') plan: any, @Res() res: Response) {
    try {
      const driveLink = await this.googleDriveService.exportWeeklyPlanToSheets(plan, req.user.id);
      return res.status(200).json({ success: true, driveLink, message: 'Meal Plan exported to Google Sheets successfully!' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to export to Google Sheets.' });
    }
  }
}
