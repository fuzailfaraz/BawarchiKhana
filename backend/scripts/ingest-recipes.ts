import { generateEmbedding } from '../src/lib/embeddings';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import * as fs from 'fs';
import * as path from 'path';

// This is a stub for loading your curated recipes.
// In a real scenario, you'd read from a JSON or CSV file.
async function loadYourRecipeData() {
  const dummyDataPath = path.join(__dirname, 'dummy-recipes.json');
  if (fs.existsSync(dummyDataPath)) {
    return JSON.parse(fs.readFileSync(dummyDataPath, 'utf8'));
  }
  
  // Return some basic curated examples if no file exists
  return [
    {
      id: 'r1',
      name: 'Lahori Chicken Karahi',
      region: 'Punjab',
      ingredients: ['chicken', 'tomatoes', 'green chilies', 'ginger', 'garlic'],
      cookingTime: 35,
      difficulty: 'intermediate',
      occasion: ['Everyday', 'Dinner'],
      spiceLevel: 4,
      fullText: 'Heat oil, fry chicken until golden. Add ginger garlic paste. Add tomatoes and cook on high heat until oil separates. Garnish with green chilies and julienned ginger.'
    },
    {
      id: 'r2',
      name: 'Sindhi Biryani',
      region: 'Sindh',
      ingredients: ['rice', 'chicken', 'potatoes', 'yogurt', 'biryani masala', 'prunes', 'tomatoes'],
      cookingTime: 60,
      difficulty: 'advanced',
      occasion: ['Eid', 'Wedding', 'Dinner'],
      spiceLevel: 5,
      fullText: 'Marinate chicken. Parboil rice. Layer chicken and rice with fried onions, mint, and coriander. Steam (dum) for 15 minutes.'
    }
  ];
}

// Sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ingestRecipes() {
  console.log('Starting recipe ingestion...');
  const recipes = await loadYourRecipeData();

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];

    const document = `
      ${recipe.name} - ${recipe.region} Style Pakistani Recipe
      Main Ingredients: ${recipe.ingredients.join(', ')}
      Cooking Time: ${recipe.cookingTime} minutes | Difficulty: ${recipe.difficulty}
      Occasion: ${recipe.occasion?.join(', ')} | Spice Level: ${recipe.spiceLevel}/5
      ${recipe.fullText}
    `.trim();

    const embedding = await generateEmbedding(document);

    const vectorString = `[${embedding.join(',')}]`;
    
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO recipe_embeddings (recipe_id, content, embedding, metadata)
        VALUES ($1, $2, $3::vector, $4::jsonb)
        ON CONFLICT (id) DO NOTHING
      `,
        recipe.id,
        document,
        vectorString,
        {
          title: recipe.name,
          region: recipe.region,
          mainIngredients: recipe.ingredients,
          cookingTime: recipe.cookingTime,
          difficulty: recipe.difficulty,
          halal: true,
          spiceLevel: recipe.spiceLevel,
          source: 'curated'
        }
      );
      console.log(`Inserted ${recipe.name}`);
    } catch (error) {
      console.error(`Error inserting recipe ${recipe.name}:`, error);
    }

    if (i % 50 === 0 && i !== 0) {
      console.log(`Ingesting recipes: ${i}/${recipes.length}`);
      await sleep(500); // Respect Google embeddings rate limit
    }
  }
  console.log('✅ Recipe KB ingestion complete');
}

ingestRecipes().catch(console.error);
