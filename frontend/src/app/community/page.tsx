'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Clock, Heart, Users, Sparkles, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Api } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CommunityHubPage() {
  const router = useRouter();
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);

  const fetchCommunityRecipes = async () => {
    try {
      const data = await Api.get('/recipes/community');
      setTrending(data.trending || []);
      setRecent(data.recent || []);
    } catch (err: any) {
      toast.error('Failed to load community recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityRecipes();
  }, []);

  const handleUpvote = async (recipeId: string) => {
    try {
      await Api.post(`/recipes/community/${recipeId}/upvote`, {});
      // Optimistic update
      setTrending(trending.map(r => r.id === recipeId ? { ...r, upvotes: r.upvotes + 1 } : r));
      setRecent(recent.map(r => r.id === recipeId ? { ...r, upvotes: r.upvotes + 1 } : r));
      toast.success('Upvoted!', { icon: '❤️' });
    } catch (err: any) {
      toast.error('Failed to upvote');
    }
  };

  const handleCookCommunityRecipe = async (recipe: any) => {
    try {
      setLoadingRecipe(recipe.id);
      toast.loading('Preparing your kitchen...', { id: 'community' });
      
      const response = await Api.post('/recipes/session', {
        dishName: recipe.name,
        ingredients: recipe.ingredients,
        recipe: {
          dishName: recipe.name,
          matchedIngredients: recipe.ingredients,
          instructions: recipe.instructions,
          difficulty: recipe.difficulty,
          cookTime: recipe.cookTime ? `${recipe.cookTime} mins` : 'N/A'
        }
      });
      
      toast.dismiss('community');
      toast.success('Ready!');
      router.push(`/recipe/${response.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start cooking session', { id: 'community' });
      setLoadingRecipe(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-pink-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🌍</span>
            <span className="text-2xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">Community Hub</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-neutral-400 hover:text-white font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 max-w-6xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl md:text-7xl font-black font-heading tracking-tight mb-6 text-white">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500">Global Kitchen</span>
            </h1>
            <p className="text-neutral-400 text-xl font-light leading-relaxed">
              Discover creations from home chefs around the world. Top-rated recipes are automatically ingested into BawarchiKhana's AI Knowledge Base for everyone to enjoy!
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin text-purple-500"><Sparkles className="w-10 h-10" /></div>
          </div>
        ) : (
          <>
            {/* Trending Section */}
            <section className="mb-20">
              <div className="flex items-center gap-3 mb-8">
                <Flame className="w-8 h-8 text-rose-500" />
                <h2 className="text-3xl font-black font-heading text-white">Trending Now</h2>
                <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 ml-2 animate-pulse">Hot</Badge>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trending.length === 0 ? (
                  <p className="text-neutral-500">No trending recipes yet.</p>
                ) : (
                  trending.map((recipe, index) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      index={index} 
                      onUpvote={() => handleUpvote(recipe.id)}
                      onCook={() => handleCookCommunityRecipe(recipe)}
                      isLoading={loadingRecipe === recipe.id}
                      isTrending={true}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Recent Section */}
            <section className="mb-20">
              <div className="flex items-center gap-3 mb-8">
                <Clock className="w-8 h-8 text-blue-400" />
                <h2 className="text-3xl font-black font-heading text-white">Recently Published</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recent.length === 0 ? (
                  <p className="text-neutral-500">No recent recipes.</p>
                ) : (
                  recent.map((recipe, index) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      index={index} 
                      onUpvote={() => handleUpvote(recipe.id)}
                      onCook={() => handleCookCommunityRecipe(recipe)}
                      isLoading={loadingRecipe === recipe.id}
                      isTrending={false}
                    />
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function RecipeCard({ recipe, index, onUpvote, onCook, isLoading, isTrending }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full bg-neutral-900/60 backdrop-blur-xl border-white/5 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all overflow-hidden rounded-[2rem] group relative">
        {isTrending && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] pointer-events-none" />
        )}
        
        <CardHeader className="pb-4 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="bg-black/50 text-neutral-300 border-white/10 backdrop-blur-md">
              <ChefHat className="w-3 h-3 mr-1 text-purple-400"/> 
              By {recipe.creator?.name || 'Chef'}
            </Badge>
            <button 
              onClick={onUpvote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors font-bold text-sm"
            >
              <Heart className="w-4 h-4 fill-current" /> {recipe.upvotes}
            </button>
          </div>
          <CardTitle className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{recipe.name}</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 py-4 space-y-4 relative z-10">
          <div className="flex flex-wrap gap-2">
            {recipe.cookTime && (
              <Badge variant="outline" className="bg-white/5 text-neutral-400 border-white/10">
                <Clock className="w-3 h-3 mr-1 text-blue-400"/> {recipe.cookTime} mins
              </Badge>
            )}
            {recipe.difficulty && (
              <Badge variant="outline" className="bg-white/5 text-neutral-400 border-white/10">
                <Flame className="w-3 h-3 mr-1 text-orange-400"/> {recipe.difficulty}
              </Badge>
            )}
          </div>
          
          <div>
            <p className="text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Ingredients</p>
            <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">
              {recipe.ingredients.join(', ')}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="pt-4 pb-6 px-6 relative z-10">
          <Button 
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] py-6 font-bold" 
            onClick={onCook}
            disabled={isLoading}
          >
            {isLoading ? 'Cooking...' : 'Cook This Recipe'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
