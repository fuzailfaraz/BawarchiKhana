import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
const PDFDocument = require('pdfkit');

@Injectable()
export class GoogleDriveService {
  private oauth2Client: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: userId,
    });
  }

  async handleCallback(code: string, userId: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    await this.prisma.connectedAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: userId,
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      },
      create: {
        userId,
        provider: 'google',
        providerAccountId: userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
      },
    });
  }

  private async getAuthClient(userId: string): Promise<OAuth2Client> {
    const account = await this.prisma.connectedAccount.findUnique({
      where: {
        provider_providerAccountId: { provider: 'google', providerAccountId: userId },
      },
    });

    if (!account || !account.accessToken) {
      throw new BadRequestException('Google Drive not connected');
    }

    this.oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.expiresAt ? account.expiresAt * 1000 : null,
    });

    // Handle token refresh if needed. The google-auth-library can do this automatically if a refresh token is present and it is used.
    
    return this.oauth2Client;
  }

  async ensurePantryMindFolder(authClient: OAuth2Client): Promise<string> {
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    const response = await drive.files.list({
      q: "name='PantryMind Recipes' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }
    
    const folder = await drive.files.create({
      requestBody: {
        name: 'PantryMind Recipes',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    
    return folder.data.id!;
  }

  async exportRecipeToDrive(recipeId: string, userId: string): Promise<string> {
    let recipeData: any = await this.prisma.savedRecipe.findUnique({
      where: { id: recipeId, userId },
    });

    if (!recipeData) {
      recipeData = await this.prisma.cookingSession.findUnique({
        where: { id: recipeId, userId },
      });
    }

    if (!recipeData) {
      throw new NotFoundException('Recipe not found');
    }

    const authClient = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth: authClient });
    
    const folderId = await this.ensurePantryMindFolder(authClient);
    const pdfBuffer = await this.generateRecipePDF(recipeData);
    
    const file = await drive.files.create({
      requestBody: {
        name: `${recipeData.dishName}.pdf`,
        parents: [folderId],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: require('stream').Readable.from(pdfBuffer),
      },
      fields: 'id, webViewLink',
    });

    try {
      await this.prisma.driveExport.create({
        data: {
          userId,
          recipeId: recipeData.id,
          driveLink: file.data.webViewLink!,
          exportType: 'pdf',
        },
      });
    } catch (e) {
      console.warn("Could not save drive export to DB (likely a CookingSession ID instead of SavedRecipe ID). The file was successfully uploaded to Drive though.");
    }
    
    return file.data.webViewLink!;
  }

  async exportRecipeToSheets(recipeId: string, userId: string): Promise<string> {
    let recipeData: any = await this.prisma.savedRecipe.findUnique({
      where: { id: recipeId, userId },
    });

    if (!recipeData) {
      recipeData = await this.prisma.cookingSession.findUnique({
        where: { id: recipeId, userId },
      });
    }

    if (!recipeData) throw new NotFoundException('Recipe not found');

    const authClient = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth: authClient });
    const folderId = await this.ensurePantryMindFolder(authClient);

    const recipe = recipeData.recipe;
    const ingredientsString = recipe.matchedIngredients ? recipe.matchedIngredients.join(', ').replace(/"/g, '""') : 'N/A';
    const instructionsString = recipe.instructions ? recipe.instructions.join(' | ').replace(/"/g, '""') : 'N/A';

    const csvContent = `Dish Name,Prep Time,Cook Time,Calories,Ingredients,Instructions\n"${recipeData.dishName}","${recipe.prepTime || 'N/A'}","${recipe.cookTime || 'N/A'}","${recipe.nutrition?.calories || 'N/A'}","${ingredientsString}","${instructionsString}"`;

    const file = await drive.files.create({
      requestBody: {
        name: `${recipeData.dishName} - Meal Plan & Shopping List`,
        parents: [folderId],
        mimeType: 'application/vnd.google-apps.spreadsheet',
      },
      media: {
        mimeType: 'text/csv',
        body: csvContent,
      },
      fields: 'id, webViewLink',
    });

    try {
      await this.prisma.driveExport.create({
        data: {
          userId,
          recipeId: recipeData.id,
          driveLink: file.data.webViewLink!,
          exportType: 'sheet',
        },
      });
    } catch (e) {}

    return file.data.webViewLink!;
  }

  async exportWeeklyPlanToSheets(plan: Record<string, { lunch: string, dinner: string }>, userId: string): Promise<string> {
    const authClient = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth: authClient });
    const folderId = await this.ensurePantryMindFolder(authClient);

    let csvContent = "Day,Lunch,Dinner\n";
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
       csvContent += `${day},"${(plan[day]?.lunch || '').replace(/"/g, '""')}","${(plan[day]?.dinner || '').replace(/"/g, '""')}"\n`;
    }

    const file = await drive.files.create({
      requestBody: {
        name: `Weekly Meal Plan`,
        parents: [folderId],
        mimeType: 'application/vnd.google-apps.spreadsheet',
      },
      media: {
        mimeType: 'text/csv',
        body: csvContent,
      },
      fields: 'id, webViewLink',
    });

    return file.data.webViewLink!;
  }

  private async generateRecipePDF(recipeData: any): Promise<Buffer> {
    const doc = new PDFDocument();
    const recipe = recipeData.recipe as any;
    
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      doc.fontSize(24).text(recipe.name || recipeData.dishName, { align: 'center' });
      doc.moveDown();
      
      if (recipe.prepTime) doc.fontSize(14).text(`Prep Time: ${recipe.prepTime}`);
      if (recipe.cookTime) doc.text(`Cook Time: ${recipe.cookTime}`);
      if (recipe.servings) doc.text(`Servings: ${recipe.servings}`);
      doc.moveDown();
      
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        doc.fontSize(18).text('Ingredients:', { underline: true });
        doc.fontSize(12);
        recipe.ingredients.forEach((ing: any) => {
          doc.text(`• ${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing.item || ing}`);
        });
        doc.moveDown();
      }
      
      if (recipe.instructions && recipe.instructions.length > 0) {
        doc.fontSize(18).text('Instructions:', { underline: true });
        doc.fontSize(12);
        recipe.instructions.forEach((step: any, index: number) => {
          doc.text(`${index + 1}. ${step.instruction || step.step || step}`);
          doc.moveDown(0.5);
        });
      }
      
      doc.end();
    });
  }

  async listDrivePdfs(userId: string, searchQuery?: string) {
    const authClient = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth: authClient });

    let q = "mimeType='application/pdf' and trashed=false";
    if (searchQuery) {
      // Escape single quotes to prevent injection in Drive API
      const safeQuery = searchQuery.replace(/'/g, "\\'");
      q += ` and name contains '${safeQuery}'`;
    }

    const response = await drive.files.list({
      q,
      fields: 'files(id, name, createdTime)',
      spaces: 'drive',
      orderBy: 'createdTime desc',
      pageSize: 50,
    });

    return response.data.files || [];
  }

  async importRecipeFromDrive(fileId: string, userId: string): Promise<any> {
    const authClient = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth: authClient });

    try {
      const file = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(file.data as any);

      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      if (!text || text.trim().length === 0) {
        throw new BadRequestException('Could not extract text from the PDF.');
      }

      return await this.aiService.parseRecipeFromText(text, userId);
    } catch (e: any) {
      console.error("PDF Fetch/Parse Error:", e);
      throw new BadRequestException(e.message || 'Failed to process PDF from Drive');
    }
  }
}
