'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Api } from '@/lib/api';
import toast from 'react-hot-toast';

import Link from 'next/link';

const CLASSIC_DISHES = [
  {
    dishName: 'Authentic Chicken Biryani',
    prepTime: '20 mins',
    cookTime: '45 mins',
    difficulty: 'Hard',
    matchedIngredients: ['Chicken', 'Basmati Rice', 'Yogurt', 'Onions', 'Tomatoes', 'Biryani Masala'],
    missingIngredients: ['Saffron', 'Mint leaves'],
    instructions: [
      'Marinate the chicken in yogurt, biryani masala, ginger-garlic paste, and lemon juice for 1 hour.',
      'Parboil the basmati rice with whole spices (cloves, cardamom, cinnamon) until 70% cooked. Drain and set aside.',
      'In a large pot, fry thinly sliced onions until golden brown. Remove half for garnish.',
      'Add the marinated chicken to the pot and cook until the oil separates and chicken is tender.',
      'Layer the partially cooked rice over the chicken gravy. Sprinkle the reserved fried onions, saffron milk, and fresh mint on top.',
      'Cover with a tight-fitting lid and cook on dum (very low heat) for 15-20 minutes.',
      'Gently mix before serving with cold cucumber raita.'
    ],
    calories: 550,
    icon: '🥘'
  },
  {
    dishName: 'Lahori Chicken Karahi',
    prepTime: '15 mins',
    cookTime: '30 mins',
    difficulty: 'Medium',
    matchedIngredients: ['Chicken (bone-in)', 'Tomatoes', 'Green Chilies', 'Ginger', 'Black Pepper'],
    missingIngredients: ['Fresh Coriander'],
    instructions: [
      'Heat oil in a wok (karahi) and fry the chicken until it changes color.',
      'Add ginger-garlic paste and salt, frying for another 2 minutes.',
      'Add halved tomatoes (skin side up). Cover and cook for 5 mins until skins soften. Remove the skins.',
      'Mash the tomatoes into the chicken and cook on high heat until the water evaporates.',
      'Add crushed black pepper, cumin powder, and sliced green chilies. Mix well.',
      'Garnish with julienned ginger and fresh coriander. Serve hot with Naan.'
    ],
    calories: 420,
    icon: '🍲'
  },
  {
    dishName: 'Beef Nihari',
    prepTime: '15 mins',
    cookTime: '4 hours',
    difficulty: 'Hard',
    matchedIngredients: ['Beef Shank', 'Nihari Masala', 'Onions', 'Wheat Flour', 'Ghee'],
    missingIngredients: ['Bone Marrow (Nalli)'],
    instructions: [
      'Heat ghee in a large heavy-bottomed pot and fry onions until golden.',
      'Add the beef shank pieces and ginger-garlic paste, frying until meat is browned.',
      'Add Nihari masala and stir well. Pour in 6-8 cups of water, bring to a boil, cover, and simmer on low heat for 3-4 hours until the meat is extremely tender.',
      'Dissolve wheat flour in water to make a smooth paste. Gradually stir this into the boiling gravy to thicken it.',
      'Simmer for another 15 minutes until the raw smell of flour is gone and oil rises to the top.',
      'Serve garnished with julienned ginger, chopped green chilies, coriander, and lemon wedges.'
    ],
    calories: 650,
    icon: '🍖'
  },
  {
    dishName: 'Daal Chawal (Lentils & Rice)',
    prepTime: '10 mins',
    cookTime: '30 mins',
    difficulty: 'Easy',
    matchedIngredients: ['Red Lentils (Masoor)', 'Yellow Lentils (Moong)', 'Basmati Rice', 'Garlic', 'Cumin'],
    missingIngredients: ['Pickle (Achar)'],
    instructions: [
      'Wash and boil the mixed lentils with turmeric, salt, and red chili powder until soft and mushy.',
      'Whisk the lentils to a smooth consistency.',
      'Prepare the tadka (tempering): Heat oil/ghee, add cumin seeds, chopped garlic, and whole dried red chilies until fragrant and golden.',
      'Pour the hot tadka over the cooked lentils.',
      'Boil the basmati rice with a pinch of salt until fully cooked and fluffy.',
      'Serve the hot daal over the white rice with a side of spicy pickle and fresh salad.'
    ],
    calories: 380,
  },
  {
    dishName: 'Peshawari Chapli Kabab',
    prepTime: '20 mins',
    cookTime: '15 mins',
    difficulty: 'Medium',
    matchedIngredients: ['Minced Beef', 'Onions', 'Tomatoes', 'Coriander Seeds'],
    missingIngredients: ['Pomegranate Seeds (Anardana)', 'Maize Flour (Makki Ka Atta)'],
    instructions: [
      'Finely chop the onions and tomatoes. Squeeze out excess water from the onions.',
      'In a large bowl, mix minced beef with the chopped vegetables, crushed coriander seeds, salt, and spices.',
      'Add crushed pomegranate seeds for tartness and maize flour to bind the mixture.',
      'Knead the mixture well for 5 minutes and let it rest in the fridge for 30 minutes.',
      'Wet your hands and form large, thin, flat patties.',
      'Shallow fry in hot oil or tallow (animal fat) on medium heat until dark brown and crispy on both sides.',
      'Serve hot with mint chutney and fresh naan.'
    ],
    calories: 450,
    icon: '🍔'
  },
  {
    dishName: 'Shahi Haleem',
    prepTime: 'Overnight',
    cookTime: '6 hours',
    difficulty: 'Hard',
    matchedIngredients: ['Beef', 'Wheat', 'Barley', 'Lentils', 'Onions'],
    missingIngredients: ['Haleem Masala', 'Fried Onions (Birista)'],
    instructions: [
      'Soak the wheat, barley, and mixed lentils overnight.',
      'Boil the soaked grains until extremely soft, then blend them into a coarse paste.',
      'In a separate pot, cook the beef with onions, ginger-garlic, and Haleem masala until it falls apart.',
      'Shred the cooked beef completely.',
      'Combine the shredded beef and the blended grains in a large pot. Cook on low heat (dum) for several hours, continuously mashing and stirring with a wooden spoon (ghota) until sticky and homogeneous.',
      'Garnish generously with fried onions, ginger juliennes, chopped green chilies, coriander, and lemon juice.'
    ],
    calories: 520,
    icon: '🥣'
  }
];

export default function ClassicsLibraryPage() {
  const router = useRouter();
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);

  const handleCookClassic = async (recipe: any) => {
    try {
      setLoadingRecipe(recipe.dishName);
      toast.loading('Preparing your kitchen...', { id: 'classic' });
      
      const response = await Api.post('/recipes/session', {
        dishName: recipe.dishName,
        ingredients: recipe.matchedIngredients,
        recipe: { ...recipe, isClassic: true }
      });
      
      toast.dismiss('classic');
      toast.success('Ready!');
      router.push(`/recipe/${response.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start cooking session', { id: 'classic' });
      setLoadingRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-amber-500/30">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">👨‍🍳</span>
            <span className="text-xl font-bold font-heading text-amber-500 tracking-tight">BawarchiKhana Classics</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Pakistani <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Classics</span>
            </h1>
            <p className="text-neutral-400 text-lg">
              Don't know what to cook? Browse our curated library of authentic, traditional recipes. Ready to cook instantly without waiting for AI.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {CLASSIC_DISHES.map((recipe, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="flex flex-col h-full bg-neutral-900 border-neutral-800 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all overflow-hidden rounded-3xl group">
                <CardHeader className="pb-4 border-b border-neutral-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 text-6xl opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                    {recipe.icon}
                  </div>
                  <CardTitle className="text-2xl text-white relative z-10">{recipe.dishName}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 py-6 space-y-6 relative z-10">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-neutral-800 text-neutral-300 border-neutral-700">
                      <Clock className="w-3 h-3 mr-1 text-blue-400"/> 
                      {recipe.prepTime} + {recipe.cookTime}
                    </Badge>
                    <Badge variant="outline" className="bg-neutral-800 text-neutral-300 border-neutral-700">
                      <Flame className="w-3 h-3 mr-1 text-red-400"/> 
                      {recipe.difficulty}
                    </Badge>
                    <Badge variant="default" className="bg-amber-500/20 text-amber-400 border-none">
                      {recipe.calories} kcal
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider text-xs">
                      Key Ingredients
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.matchedIngredients.map((ing, i) => (
                        <span key={i} className="px-2 py-1 bg-neutral-800 rounded-md text-sm text-neutral-300">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 pb-6 p-6">
                  <Button 
                    className="w-full rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] py-6 text-lg font-bold" 
                    onClick={() => handleCookClassic(recipe)}
                    disabled={loadingRecipe === recipe.dishName}
                  >
                    {loadingRecipe === recipe.dishName ? 'Loading...' : 'Cook This Classic'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
