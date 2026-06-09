'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChefHat, LogOut, Plus, Sparkles, X, Clock, Flame, Utensils, Mic, MicOff, Camera, ImagePlus, User, Globe, Activity, ToggleLeft, ToggleRight, Leaf, Info, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useSound from 'use-sound';
import { ImportFromDriveButton } from '@/components/ImportFromDriveButton';
import { WeeklyPlanner } from '@/components/WeeklyPlanner';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { NavHeader } from '@/components/ui/nav-header';
import gsap from 'gsap';

type IngredientStatus = 'Fresh' | 'Use Soon' | 'Expiring Today';
type Ingredient = { name: string, status: IngredientStatus };

export default function DashboardPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Hackathon Features State
  const [isListening, setIsListening] = useState(false);
  const [isUrdu, setIsUrdu] = useState(false);
  const [healthGoal, setHealthGoal] = useState<string>('🥗 Balanced');
  const [isLeftoverMode, setIsLeftoverMode] = useState(false);
  const [maxTime, setMaxTime] = useState('🕒 Any');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recipesRef = useRef<HTMLElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (recipes.length > 0 && recipesRef.current) {
      setTimeout(() => {
        recipesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [recipes]);

  // Sounds
  const [playPop] = useSound('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', { volume: 0.3 });
  const [playSuccess] = useSound('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', { volume: 0.5 });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // GSAP Entrance
    gsap.fromTo(".dashboard-stagger", 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );

    const checkAuthAndProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsPremium(data.user?.isPremium || false);
          if (data.user?.currentPantry && data.user.currentPantry.length > 0) {
            const parsed = data.user.currentPantry.map((p: string) => {
              const [name, status] = p.split(':');
              return { name, status: (status as IngredientStatus) || 'Fresh' };
            });
            setIngredients(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch profile', err);
      } finally {
        setIsLoaded(true);
      }
    };
    checkAuthAndProfile();
  }, [router]);

  useEffect(() => {
    if (isLoaded) {
      Api.patch('/users/pantry', { pantry: ingredients }).catch(err => console.error('Failed to sync pantry', err));
    }
  }, [ingredients, isLoaded]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const isValidIngredient = (ing: string) => {
    if (ing.length < 2 || ing.length > 40) return { valid: false, error: 'Must be between 2 and 40 characters.' };
    if (/[0-9]/.test(ing)) return { valid: false, error: 'Cannot contain numbers.' };
    if (!/^[a-zA-Z\s\-]+$/.test(ing)) return { valid: false, error: 'Only letters, spaces, and hyphens allowed.' };
    
    const blacklist = ['laptop', 'computer', 'phone', 'mobile', 'car', 'dog', 'cat', 'test', 'hello', 'world', 'keyboard', 'mouse', 'screen', 'desk', 'tv', 'television', 'watch'];
    if (blacklist.includes(ing.toLowerCase())) return { valid: false, error: `'${ing}' doesn't seem like a food ingredient.` };
    
    return { valid: true };
  };

  const addIngredient = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentInput.trim()) return;
    
    const rawInputs = currentInput.split(',').map(i => i.trim().toLowerCase()).filter(i => i !== '');
    
    const validInputs: string[] = [];
    for (const ing of rawInputs) {
      const { valid, error } = isValidIngredient(ing);
      if (!valid) {
        toast.error(`Invalid: ${error}`);
      } else {
        validInputs.push(ing);
      }
    }
    
    const uniqueNew = validInputs.filter(i => !ingredients.some(ing => ing.name === i));
    
    if (uniqueNew.length > 0) {
      setIngredients([...ingredients, ...uniqueNew.map(i => ({ name: i, status: 'Fresh' as IngredientStatus }))]);
      setCurrentInput('');
      playPop();
      toast.success(`Added ${uniqueNew.length} ingredient(s)!`, {
        icon: '🍅',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } else if (validInputs.length > 0) {
      toast.error('Ingredient(s) already added!');
    }
  };

  const removeIngredient = (ingredientName: string) => {
    setIngredients(ingredients.filter(i => i.name !== ingredientName));
  };

  const cycleIngredientStatus = (index: number) => {
    const newIngredients = [...ingredients];
    const currentStatus = newIngredients[index].status;
    if (currentStatus === 'Fresh') newIngredients[index].status = 'Use Soon';
    else if (currentStatus === 'Use Soon') newIngredients[index].status = 'Expiring Today';
    else newIngredients[index].status = 'Fresh';
    setIngredients(newIngredients);
  };

  const toggleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser doesn't support voice input.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = isUrdu ? 'ur-PK' : 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening...', { icon: '🎙️' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentInput(transcript);
      setIsListening(false);
      toast.success('Speech recognized');
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      toast.error(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Premium Feature</span>
            <span className="text-sm">Image analysis is only available for Pro users.</span>
            <button 
              onClick={() => { toast.dismiss(t.id); router.push('/premium'); }}
              className="mt-2 bg-amber-500 text-black px-4 py-1 rounded-full text-xs font-bold w-fit"
            >
              Upgrade Now
            </button>
          </div>
        ),
        { duration: 5000 }
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading('Analyzing fridge photo...', { id: 'vision' });
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Image = reader.result as string;
        const response = await Api.post('/ai/vision', { image: base64Image });
        
        if (response.ingredients && response.ingredients.length > 0) {
          const uniqueNew = response.ingredients.filter((i: string) => !ingredients.some(ing => ing.name === i));
          setIngredients([...ingredients, ...uniqueNew.map((i: string) => ({ name: i, status: 'Fresh' as IngredientStatus }))]);
          toast.success(`Found ${response.ingredients.length} ingredients!`, { id: 'vision' });
        } else {
          toast.error("Couldn't detect any food items.", { id: 'vision' });
        }
      } catch (err: any) {
        toast.error('Vision analysis failed.', { id: 'vision' });
      }
    };
  };

  const handleGenerate = async () => {
    if (ingredients.length < 2) {
      toast.error('Please add at least 2 ingredients for a good recipe!', { icon: '⚠️' });
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Consulting the AI Chef...', {
      style: { background: '#1e1e1e', color: '#f59e0b', border: '1px solid #f59e0b' }
    });
    
    const expiring = ingredients.filter(i => i.status !== 'Fresh').map(i => i.name);
    
    try {
      const response = await Api.post('/ai/suggest', { 
        ingredients: ingredients.map(i => i.name),
        language: isUrdu ? 'urdu' : 'english',
        healthGoal: healthGoal !== '🥗 Balanced' ? healthGoal : undefined,
        expiringIngredients: expiring,
        isLeftoverMode,
        maxTime: maxTime.replace(/[^0-9]/g, '') || 'Any' // Extract number or 'Any'
      });
      
      // Inject Leftover badge into recipes for UI display
      const processedRecipes = (response.recipes || []).map((r: any) => ({
        ...r,
        isZeroWaste: isLeftoverMode,
        isQuickCook: maxTime !== '🕒 Any'
      }));
      
      setRecipes(processedRecipes);
      playSuccess();
      toast.success('Recipes generated successfully!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to generate recipes. Try again later.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecipe = async (recipe: any) => {
    try {
      toast.loading('Preparing your kitchen...', { id: 'cooking' });
      const response = await Api.post('/recipes/session', {
        dishName: recipe.dishName,
        ingredients: ingredients.map(i => i.name),
        recipe: recipe
      });
      toast.dismiss('cooking');
      router.push(`/recipe/${response.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start cooking session', { id: 'cooking' });
    }
  };

  const getEcoScore = (matched: string[] = [], missing: string[] = []) => {
    const allIngs = [...matched, ...missing].join(' ').toLowerCase();
    let score = 0;
    let count = 0;
    
    // High impact
    if (allIngs.match(/beef|mutton|lamb|sausage|bacon|meat/)) { score += 3; count++; }
    // Medium impact
    if (allIngs.match(/chicken|egg|milk|cheese|butter|yogurt|cream/)) { score += 2; count++; }
    // Low impact
    if (allIngs.match(/tomato|onion|potato|garlic|rice|flour|dal|lentil|spinach|palak/)) { score += 1; count++; }
    
    if (count === 0) return { label: 'Low Impact 🟢', score: 1 };
    const avg = score / count;
    if (avg < 1.5) return { label: 'Low Impact 🟢', score: avg };
    if (avg < 2.5) return { label: 'Medium Impact 🟡', score: avg };
    return { label: 'High Impact 🔴', score: avg };
  };

  return (
    <div className={`min-h-screen bg-transparent flex flex-col ${isUrdu ? 'font-urdu dir-rtl' : ''} text-neutral-100 overflow-x-hidden relative`}>
      
      {/* Dynamic Video Background */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#050505] z-0" />
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50 z-10"
        >
          <source src="/Hero2Vid.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/20 to-[#050505]/80 z-20" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay z-30" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="w-full max-w-full px-4 sm:px-8 lg:px-16 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0">
            <div className="relative w-8 h-8 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
            </div>
            <span className="text-2xl font-bold font-heading text-amber-500 tracking-tight group-hover:text-amber-400 transition-colors">
              {isUrdu ? 'باورچی خانہ' : 'BawarchiKhana'}
            </span>
          </Link>
          <div className="hidden xl:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]">
            <NavHeader links={[
              { label: "Classics", href: "/classics" },
              { label: isUrdu ? 'تاریخ' : 'History', href: "/history" },
              { label: "Sustainability", href: "/sustainability" },
              { label: isUrdu ? 'پروفائل' : 'Profile', href: "/profile" },
            ]} />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 z-10">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsUrdu(!isUrdu)}
              className="text-xs font-semibold px-4 rounded-full border-white/10 text-neutral-300 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-md transition-all"
            >
              {isUrdu ? 'English' : 'اردو'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex text-xs font-semibold px-4 rounded-full border border-white/10 text-neutral-300 bg-white/5 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all group">
              <span>{isUrdu ? 'لاگ آؤٹ' : 'Logout'}</span>
            </Button>

            {/* Profile Button (Desktop) */}
            <button 
              onClick={() => router.push('/profile')}
              className="hidden xl:flex w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 items-center justify-center hover:border-amber-500 transition-colors shadow-md"
            >
              <User className="w-5 h-5 text-neutral-400" />
            </button>

            {/* Hamburger Menu Mobile */}
            <div className="relative xl:hidden flex items-center">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {isMobileMenuOpen && (
                <div className="absolute top-12 right-0 w-48 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl py-2 flex flex-col z-[200]">
                  <Link href="/classics" className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">Classics</Link>
                  <Link href="/history" className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">{isUrdu ? 'تاریخ' : 'History'}</Link>
                  <Link href="/sustainability" className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/5">Sustainability</Link>
                  <Link href="/profile" className="px-4 py-3 text-sm font-semibold text-amber-400 hover:bg-white/5 border-t border-white/10 mt-1">{isUrdu ? 'پروفائل' : 'Profile'}</Link>
                  <button onClick={handleLogout} className="px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 text-left border-t border-white/10">{isUrdu ? 'لاگ آؤٹ' : 'Logout'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-full px-4 sm:px-8 lg:px-16 py-6 sm:py-12 relative z-10">
        
        <div className="flex flex-col xl:flex-row justify-between gap-12 relative items-start">
          {/* Left Column (Fridge & Generation) */}
          <div className="flex-1 w-full max-w-5xl flex flex-col gap-12">
            
            {/* Ingredient Input Section */}
            <section className="w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-neutral-900/60 backdrop-blur-2xl rounded-[2rem] p-6 sm:p-10 shadow-2xl border border-white/5 relative overflow-hidden"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

            {/* Leftover Mode Toggle */}
            <div className="flex justify-end w-full mb-6 z-20">
              <button 
                onClick={() => setIsLeftoverMode(!isLeftoverMode)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                  isLeftoverMode 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-none font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105' 
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                }`}
                title="Uses only what you have to minimize waste"
              >
                <span className="text-sm font-semibold">Leftover Mode</span>
              </button>
            </div>

            <div className="dashboard-stagger text-center mb-8 relative z-10 mt-6">
              <h1 className="text-3xl md:text-5xl font-black text-white font-heading mb-4 tracking-tight">
                {isUrdu ? 'آپ کے کچن میں کیا ہے؟' : "What's in your kitchen?"}
              </h1>
              {isLeftoverMode ? (
                <p className="text-green-400 font-medium text-base md:text-lg animate-pulse">
                  🌿 Using only what you have to eliminate waste
                </p>
              ) : (
                <p className="text-neutral-400 text-base md:text-lg max-w-lg mx-auto">
                  {isUrdu 
                    ? 'اپنے اجزاء درج کریں (کوما لگا کر)، اور ہمارا AI بہترین ترکیب تجویز کرے گا۔' 
                    : 'Enter your ingredients separated by commas, and let our AI craft the perfect meal.'}
                </p>
              )}
            </div>
            
            <form onSubmit={addIngredient} className="dashboard-stagger relative flex flex-col sm:flex-row gap-3 mb-4 z-20">
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500 pointer-events-none"></div>
                <Input
                  type="text"
                  placeholder={isUrdu ? 'مثلاً چکن، ٹماٹر، پیاز...' : 'e.g., Chicken, Palak, Tomatoes...'}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  className={`relative z-10 w-full bg-black/80 border-white/10 focus:border-amber-500/50 text-white placeholder-neutral-500 pl-6 pr-[140px] py-6 text-base sm:text-lg rounded-2xl shadow-inner transition-all ${isUrdu ? 'text-right pr-6 pl-[140px]' : ''}`}
                />
                
                {/* Voice & Camera Input Overlays */}
                <div className={`absolute z-20 top-1/2 -translate-y-1/2 flex items-center gap-1 ${isUrdu ? 'left-4' : 'right-4'}`}>
                  <button 
                    type="button" 
                    onClick={toggleListen}
                    className={`p-2 rounded-xl transition-all duration-300 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse scale-110' : 'text-neutral-400 hover:bg-white/10 hover:text-amber-400'}`}
                    title="Voice Input"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1"></div>
                  <button 
                    type="button" 
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-2 rounded-xl text-neutral-400 hover:bg-white/10 hover:text-amber-400 transition-all duration-300"
                    title="Take Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-neutral-400 hover:bg-white/10 hover:text-amber-400 transition-all duration-300"
                    title="Upload Image"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={cameraInputRef} 
                    onChange={handleImageUpload}
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="px-6 sm:px-8 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold h-auto transition-transform transform hover:scale-105 active:scale-95 z-20 border-none">
                Add
              </Button>
            </form>

            <div className="flex justify-between items-center mb-6 z-20 relative">
              <ImportFromDriveButton />
              <Button 
                type="button" 
                onClick={(e) => {
                  const originalInput = currentInput;
                  if (!originalInput.trim()) return;
                  
                  const rawInputs = originalInput.split(',').map(i => i.trim().toLowerCase()).filter(i => i !== '');
                  
                  const validInputs: string[] = [];
                  for (const ing of rawInputs) {
                    const { valid, error } = isValidIngredient(ing);
                    if (!valid) {
                      toast.error(`Invalid: ${error}`);
                    } else {
                      validInputs.push(ing);
                    }
                  }
                  
                  const uniqueNew = validInputs.filter(i => !ingredients.some(ing => ing.name === i));
                  
                  if (uniqueNew.length > 0) {
                    setIngredients([...ingredients, ...uniqueNew.map(i => ({ name: i, status: 'Expiring Today' as IngredientStatus }))]);
                    setCurrentInput('');
                    playPop();
                    toast.success(`Added ${uniqueNew.length} expiring item(s)!`, { icon: '⏰' });
                  } else if (validInputs.length > 0) {
                    toast.error('Ingredient(s) already added!');
                  }
                }}
                variant="outline" 
                size="sm" 
                className="text-xs bg-white/5 border border-white/10 text-neutral-400 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 transition-all rounded-full py-1.5 px-4 h-auto backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
              >
                Add as Expiring
              </Button>
            </div>

            {/* Health Goal Tracker (Feature 5) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 z-30 relative bg-neutral-900/40 p-2 rounded-2xl backdrop-blur-sm border border-white/5">
              {['Balanced', 'High Protein', 'Low Oil', 'Vegetarian'].map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setHealthGoal(goal)}
                  className={`px-6 py-2 text-sm rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                    healthGoal === goal 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105 font-bold border-none' 
                      : 'bg-white/5 text-neutral-400 border border-white/10 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {!isLoaded ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center mb-10 z-30 relative"
                >
                  <div className="flex flex-wrap gap-3 justify-center w-full max-w-lg">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 w-24 bg-white/5 animate-pulse rounded-xl border border-white/5" />
                    ))}
                  </div>
                </motion.div>
              ) : ingredients.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center mb-10 z-30 relative"
                >
                  <p className="text-xs text-neutral-500 mb-3 font-medium uppercase tracking-widest flex items-center gap-1">
                    <Info className="w-3 h-3" /> Click tags to mark expiring items
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {ingredients.map((ing, idx) => (
                      <motion.div 
                        key={ing.name}
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        layout
                      >
                        <div 
                          className={`group text-sm py-2 pl-3 pr-2 flex items-center gap-2 backdrop-blur-md border transition-all shadow-lg rounded-xl cursor-pointer ${
                            ing.status === 'Expiring Today' ? 'bg-red-500/20 border-red-500/50 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
                            ing.status === 'Use Soon' ? 'bg-orange-500/20 border-orange-500/50 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' :
                            'bg-white/10 border-white/10 text-neutral-200 hover:bg-white/20'
                          }`}
                          onClick={() => cycleIngredientStatus(idx)}
                        >
                          <span className="flex items-center gap-1.5">
                            {ing.status === 'Fresh' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                            {ing.status === 'Use Soon' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                            {ing.status === 'Expiring Today' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                            {ing.name}
                          </span>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeIngredient(ing.name); }} 
                            className="opacity-60 hover:opacity-100 hover:text-red-400 p-1 rounded-full transition-colors ml-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Meal Filter (Feature 11) - MOVED HERE */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 z-30 relative bg-neutral-900/60 p-3 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-sm font-bold text-amber-400 mr-2 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Quick Cook:
              </span>
              {['⚡ Under 10 min', '🕐 Under 20 min', '🕑 Under 30 min', '🕒 Any'].map(time => (
                <button
                  key={time}
                  onClick={() => setMaxTime(time)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                    maxTime === time
                      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <motion.div className="relative z-30" whileHover={{ scale: ingredients.length >= 2 ? 1.02 : 1 }} whileTap={{ scale: ingredients.length >= 2 ? 0.98 : 1 }}>
              <Button 
                size="lg" 
                className={`w-full py-8 text-xl font-black rounded-2xl transition-all duration-500 border-none ${
                  ingredients.length >= 2
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:shadow-[0_0_60px_rgba(245,158,11,0.6)]'
                    : 'bg-white/5 text-neutral-500 shadow-none'
                }`}
                onClick={handleGenerate}
                loading={loading}
                disabled={ingredients.length < 2 && !loading}
              >
                {loading ? (isUrdu ? 'جادو ہو رہا ہے...' : 'Cooking up Magic...') : (isUrdu ? 'ترکیب بنائیں' : 'Generate AI Recipes')}
                {!loading && <Sparkles className={`ml-3 h-6 w-6 ${ingredients.length >= 2 ? 'animate-pulse' : ''}`} />}
              </Button>
            </motion.div>
            
          </motion.div>
        </section>

        {/* Results Section */}
        {recipes.length > 0 && (
          <section ref={recipesRef} className="w-full relative z-10 scroll-mt-24">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map((recipe, index) => {
                const eco = getEcoScore(recipe.matchedIngredients, recipe.missingIngredients);
                return (
                  <ScrollReveal key={index} delay={index * 0.1}>
                    <Card className="spotlight-card flex flex-col h-full bg-neutral-900/50 backdrop-blur-xl border-white/10 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-500 overflow-hidden rounded-[2rem] group relative">
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                      
                      {/* Zero Waste Pick Badge */}
                      {recipe.isZeroWaste && (
                        <div className="absolute top-4 right-4 z-20">
                          <span className="bg-green-500 text-black text-xs font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center gap-1">
                            ♻️ Zero Waste Pick
                          </span>
                        </div>
                      )}

                      {/* Quick Cook Badge */}
                      {recipe.isQuickCook && !recipe.isZeroWaste && (
                        <div className="absolute top-4 right-4 z-20">
                          <span className="bg-amber-400 text-black text-xs font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center gap-1">
                            ⚡ Quick Cook
                          </span>
                        </div>
                      )}
                      
                      <CardHeader className="pb-5 border-b border-white/5 relative z-10 pt-12">
                        <CardTitle className={`line-clamp-2 text-2xl font-bold text-white group-hover:text-amber-400 transition-colors ${isUrdu ? 'text-right' : ''}`}>
                          {recipe.dishName}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className={`flex-1 py-6 space-y-6 relative z-10 ${isUrdu ? 'text-right' : ''}`}>
                        <div className={`flex flex-wrap gap-2 ${isUrdu ? 'justify-end' : ''}`}>
                          <Badge variant="outline" className="bg-black/50 text-neutral-300 border-white/10 backdrop-blur-sm px-3 py-1">
                            <Clock className="w-3 h-3 mr-1.5 text-blue-400"/> 
                            {recipe.prepTime} + {recipe.cookTime}
                          </Badge>
                          <Badge variant="outline" className="bg-black/50 text-neutral-300 border-white/10 backdrop-blur-sm px-3 py-1">
                            <Flame className="w-3 h-3 mr-1.5 text-orange-500"/> 
                            {recipe.difficulty}
                          </Badge>
                          <Badge variant="outline" className={`bg-black/50 border-white/10 backdrop-blur-sm px-3 py-1 ${eco.score < 1.5 ? 'text-green-400' : eco.score < 2.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {eco.label}
                          </Badge>
                        </div>
                        
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                          <p className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 flex items-center gap-2">
                            <Utensils className="w-3.5 h-3.5 text-amber-500"/> 
                            {isUrdu ? 'استعمال ہونے والے اجزاء' : 'Using your ingredients'}
                          </p>
                          <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed">
                            {recipe.matchedIngredients?.join(', ')}
                          </p>
                        </div>

                        {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                          <div>
                            <p className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2">
                              {isUrdu ? 'مزید ضرورت ہے' : 'You might need'}
                            </p>
                            <p className="text-sm text-rose-400 line-clamp-2 mb-4">
                              {recipe.missingIngredients.join(', ')}
                            </p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); router.push('/foodpanda'); }}
                              className="w-full py-2.5 bg-[#D61F69]/10 hover:bg-[#D61F69]/20 text-[#D61F69] border border-[#D61F69]/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                              <span className="text-lg">🛒</span> Order missing on foodpanda
                            </button>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-0 pb-6 px-6 relative z-10 flex flex-col gap-4">
                        <Button 
                          className="w-full rounded-xl bg-white text-black hover:bg-amber-400 hover:text-black shadow-lg py-6 text-lg font-bold transition-all duration-300 group-hover:scale-[1.02]" 
                          onClick={() => handleViewRecipe(recipe)}
                        >
                          {isUrdu ? 'پکانا شروع کریں' : 'Start Cooking'}
                        </Button>
                        
                        {/* Eco Score Badge (Feature 3) */}
                        <div 
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 bg-black/40 text-neutral-300 flex items-center justify-center self-start group/tooltip relative cursor-help"
                        >
                          {eco.label}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-800 text-xs text-white rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all text-center shadow-xl border border-white/10 z-50">
                            Based on ingredient environmental footprint (Avg: {eco.score.toFixed(1)})
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </ScrollReveal>
                );
              })}
            </div>
          </section>
        )}

          </div>
          
          {/* Right Column (Weekly Planner) */}
          <div className="w-full xl:w-[450px] 2xl:w-[500px] flex-shrink-0 h-[800px] xl:sticky xl:top-28">
            <WeeklyPlanner ingredients={ingredients} />
          </div>
        </div>

      </main>
    </div>
  );
}
