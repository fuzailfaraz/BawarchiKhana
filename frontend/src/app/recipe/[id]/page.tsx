'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, ArrowLeft, CheckCircle2, Clock, Flame, Check, Sparkles, Leaf, Info, AlertTriangle, AlertCircle, ShoppingCart, MessageCircle, X, Send, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Api } from '@/lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ExportToDriveButton, ExportToSheetsButton } from '@/components/ExportToDriveButton';

const weights: Record<string, number> = {
  tomato: 120, onion: 100, egg: 55, chicken: 250, potato: 150, garlic: 10, rice: 200, flour: 100
};
const getWeight = (ing: string) => {
  const match = Object.keys(weights).find(k => ing.toLowerCase().includes(k));
  return match ? weights[match] : 50;
};

const foodPandaPrices: Record<string, number> = {
  tomato: 20, onion: 15, egg: 25, chicken: 180, potato: 30, garlic: 10, rice: 180, flour: 120, yogurt: 60, cream: 80, oil: 150, salt: 10, milk: 70
};
const getPrice = (ing: string) => {
  const match = Object.keys(foodPandaPrices).find(k => ing.toLowerCase().includes(k));
  return match ? foodPandaPrices[match] : 50;
};

export default function RecipePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [checkedMissing, setCheckedMissing] = useState<string[]>([]);

  const [wasteSaved, setWasteSaved] = useState(0);
  const [co2Saved, setCo2Saved] = useState(0);
  const [pantryCost, setPantryCost] = useState(0);
  const [missingCost, setMissingCost] = useState(0);

  // Copilot State
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [copilotMessages, setCopilotMessages] = useState<{ role: string, content: string }[]>([{ role: 'model', content: "Hi! I'm your Cooking Copilot. Ask me anything about this recipe!" }]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Substitution State
  const [substitutions, setSubstitutions] = useState<Record<string, { sub: string, reason: string, loading: boolean }>>({});

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInputMin, setTimerInputMin] = useState('5');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      toast.success('⏰ Timer Finished!', { icon: '🔔', duration: 8000, style: { background: '#f59e0b', color: '#000', fontWeight: 'bold' } });
      try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play();
      } catch (e) { }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startTimer = () => {
    const mins = parseInt(timerInputMin) || 5;
    setTimerSeconds(mins * 60);
    setIsTimerRunning(true);
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const data = await Api.get(`/recipes/session/${sessionId}`);
        setSession(data);

        // Calculate Waste
        if (data.recipe?.matchedIngredients) {
          const totalWeight = data.recipe.matchedIngredients.reduce((acc: number, ing: string) => acc + getWeight(ing), 0);
          setWasteSaved(totalWeight);
          setCo2Saved(Number((totalWeight * 0.0025).toFixed(2)));

          const pCost = data.recipe.matchedIngredients.reduce((acc: number, ing: string) => acc + getPrice(ing), 0);
          setPantryCost(pCost);
        }

        if (data.recipe?.missingIngredients) {
          const mCost = data.recipe.missingIngredients.reduce((acc: number, ing: string) => acc + getPrice(ing), 0);
          setMissingCost(mCost);
          setCheckedMissing(data.recipe.missingIngredients);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchSession();
  }, [sessionId]);

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter(i => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const toggleMissing = (ing: string) => {
    if (checkedMissing.includes(ing)) {
      setCheckedMissing(checkedMissing.filter(i => i !== ing));
    } else {
      setCheckedMissing([...checkedMissing, ing]);
    }
  };

  const completeCooking = async () => {
    try {
      await Api.patch(`/recipes/session/${sessionId}/complete`, {});
      setIsFinished(true);
    } catch (err: any) {
      alert('Failed to mark as complete');
    }
  };

  const sendCopilotMessage = async () => {
    if (!copilotInput.trim() || !session) return;
    const userMsg = { role: 'user', content: copilotInput };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput('');
    setIsCopilotTyping(true);

    try {
      const response = await Api.post('/ai/copilot', {
        message: userMsg.content,
        recipeContext: session.recipe,
        history: copilotMessages.slice(1).map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }))
      });
      setCopilotMessages(prev => [...prev, { role: 'model', content: response.reply }]);
    } catch (err) {
      toast.error('Copilot failed to respond');
      setCopilotMessages(prev => [...prev, { role: 'model', content: "Oops, I'm having trouble thinking right now." }]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  const COMMON_SUBSTITUTIONS: Record<string, string[]> = {
    "butter": ["oil", "ghee", "margarine"],
    "cream": ["yogurt", "milk", "coconut milk"],
    "eggs": ["yogurt", "banana", "flaxseed"],
    "milk": ["water + yogurt", "coconut milk"],
    "bread crumbs": ["crushed crackers", "flour", "oats"],
    "vinegar": ["lemon juice"],
    "soy sauce": ["salt + a drop of vinegar"],
    "cornstarch": ["flour", "arrowroot"],
  };

  const handleSubstitute = async (e: React.MouseEvent, ing: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Check hardcoded map first for instant, free swaps
    const normalizedIng = ing.toLowerCase();
    const commonMatch = Object.keys(COMMON_SUBSTITUTIONS).find(k => normalizedIng.includes(k));

    if (commonMatch) {
      const options = COMMON_SUBSTITUTIONS[commonMatch];
      // Try to find if user has one of the options, else pick first
      const available = options.filter(opt => session?.recipe.matchedIngredients?.some((ui: string) => ui.toLowerCase().includes(opt)));
      const bestSub = available[0] || options[0];

      setSubstitutions(prev => ({
        ...prev,
        [ing]: { sub: bestSub, reason: "Common pantry substitute. Works perfectly in this recipe.", loading: false }
      }));
      return;
    }

    // Fallback to AI for uncommon ingredients
    setSubstitutions(prev => ({ ...prev, [ing]: { sub: '', reason: '', loading: true } }));

    try {
      const response = await Api.post('/ai/substitute', {
        ingredientToReplace: ing,
        availableIngredients: session?.recipe.matchedIngredients || []
      });
      setSubstitutions(prev => ({
        ...prev,
        [ing]: { sub: response.substitution, reason: response.reason, loading: false }
      }));
    } catch (err) {
      toast.error('Failed to find substitute');
      setSubstitutions(prev => {
        const newSubs = { ...prev };
        delete newSubs[ing];
        return newSubs;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin text-amber-500"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /><path d="M7 21h10" /><path d="M19.5 12 22 6" /><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.33 1.24.72 1.62" /><path d="M11.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.33 1.24.72 1.62" /><path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.33 1.24.72 1.62" /></svg></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-[#050505]">
        <p className="text-red-500">{error || 'Session not found'}</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const recipe = session.recipe;
  const allStepsCompleted = recipe.instructions && completedSteps.length === recipe.instructions.length;

  const orderingOut = 800;
  const totalCost = pantryCost + missingCost;
  const savings = orderingOut - totalCost;

  const currentCartTotal = checkedMissing.reduce((acc, ing) => acc + getPrice(ing), 0);

  return (
    <div className="min-h-screen bg-transparent text-white pb-24 relative overflow-hidden selection:bg-amber-500/30">

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

      <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0">
            <span className="text-2xl">👨‍🍳</span>
            <span className="text-2xl font-bold font-heading text-amber-500 tracking-tight group-hover:text-amber-400 transition-colors">BawarchiKhana</span>
          </Link>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-medium">Exit Cooking Mode</span>
          </button>
        </div>
      </header>

      {isFinished ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="container mx-auto px-4 py-32 text-center max-w-2xl relative z-10"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(52,211,153,0.3)] border-4 border-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-black font-heading text-white mb-6">Masterpiece Complete!</h1>
          <p className="text-xl text-neutral-400 mb-10">
            You successfully cooked <span className="text-amber-400 font-bold">{recipe.dishName}</span>. We hope it tastes as good as it looks!
          </p>
          <Button size="lg" onClick={() => router.push('/dashboard')} className="rounded-2xl px-10 py-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-all">
            Cook Something Else <Sparkles className="w-6 h-6 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <main className="container mx-auto px-4 pt-12 max-w-5xl relative z-10">

          {/* Feature 1: Waste Reduction Meter */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="flex justify-between text-sm font-bold text-green-400 mb-2 px-1">
              <span className="flex items-center gap-2"><Leaf className="w-4 h-4" /> Waste Saved</span>
              <span>~{co2Saved} kg CO₂ Prevented</span>
            </div>
            <div className="h-3 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (wasteSaved / 1000) * 100)}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-600 to-green-400"
              />
            </div>
            <p className="text-center text-xs text-neutral-500 mt-2">
              By using what you already have, you just saved <strong className="text-neutral-300">{wasteSaved}g</strong> of food from the bin! 🌍
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {recipe.isClassic && (
              <div className="mb-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-black shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                👑 BawarchiKhana Classic
              </div>
            )}
            <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 font-heading mb-6 tracking-tight drop-shadow-sm">
              {recipe.dishName}
            </h1>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="bg-white/5 border-white/10 text-neutral-300 backdrop-blur-md px-4 py-2 text-sm"><Clock className="w-4 h-4 mr-2 text-blue-400" /> Prep: {recipe.prepTime}</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-neutral-300 backdrop-blur-md px-4 py-2 text-sm"><Clock className="w-4 h-4 mr-2 text-blue-400" /> Cook: {recipe.cookTime}</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10 text-neutral-300 backdrop-blur-md px-4 py-2 text-sm"><Flame className="w-4 h-4 mr-2 text-red-500" /> {recipe.difficulty}</Badge>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <ExportToDriveButton recipeId={session.id} recipeName={recipe.dishName} />
              <ExportToSheetsButton recipeId={session.id} recipeName={recipe.dishName} />
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-8">

              <div className="bg-neutral-900/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-xl">
                <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" /> Ready to Use
                </h3>
                <ul className="space-y-3 mb-6">
                  {recipe.matchedIngredients?.map((ing: string, i: number) => (
                    <li key={i} className="text-neutral-300 capitalize flex items-start gap-3">
                      <span className="text-green-400 mt-1">•</span> {ing}
                    </li>
                  ))}
                </ul>

                {/* Feature 10: Cost Estimation Card */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                    🍽️ Estimated Meal Cost
                  </h3>
                  <div className="space-y-2 text-sm text-neutral-400">
                    <div className="flex justify-between">
                      <span>From pantry:</span>
                      <span className="text-amber-400">Rs. {pantryCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>To buy:</span>
                      <span className="text-amber-400">Rs. {missingCost}</span>
                    </div>
                    <div className="w-full h-px bg-white/10 my-2" />
                    <div className="flex justify-between font-bold text-white">
                      <span>Total Cost:</span>
                      <span>Rs. {totalCost} (2 servings)</span>
                    </div>
                    <div className="flex justify-between text-neutral-500">
                      <span>vs. Ordering out:</span>
                      <span className="line-through">~Rs. 800</span>
                    </div>
                    <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-center font-bold">
                      💚 You save Rs. {savings > 0 ? savings : 0} cooking at home!
                    </div>
                  </div>
                </div>
              </div>

              {/* Cooking Timer Widget */}
              <div className="bg-neutral-900/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-xl mt-8">
                <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-3">
                  <Timer className="w-6 h-6 text-amber-500" /> Kitchen Timer
                </h3>
                <div className="flex flex-col items-center">
                  <div className="text-6xl font-black font-heading text-white tracking-tighter mb-6 font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {formatTime(timerSeconds)}
                  </div>
                  {!isTimerRunning && timerSeconds === 0 ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="number"
                        value={timerInputMin}
                        onChange={(e) => setTimerInputMin(e.target.value)}
                        className="w-16 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-center text-white outline-none focus:border-amber-500"
                        min="1"
                      />
                      <span className="text-neutral-400 mr-2">min</span>
                      <Button onClick={startTimer} className="flex-1 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-bold">
                        <Play className="w-4 h-4 mr-2" /> Start
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      <Button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`flex-1 rounded-xl font-bold ${isTimerRunning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/30' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
                      >
                        {isTimerRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isTimerRunning ? 'Pause' : 'Resume'}
                      </Button>
                      <Button onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} variant="outline" className="px-4 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <h2 className="text-3xl font-black font-heading mb-8 text-white">Let's Get Cooking</h2>

              <div className="space-y-6">
                {recipe.instructions?.map((step: string, index: number) => {
                  const isCompleted = completedSteps.includes(index);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => toggleStep(index)}
                      className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 cursor-pointer flex gap-6 ${isCompleted
                          ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                          : 'border-white/10 hover:border-amber-500/50 bg-neutral-900/60 hover:bg-neutral-900/80 backdrop-blur-md shadow-xl'
                        }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors duration-300 font-bold text-lg ${isCompleted
                          ? 'bg-green-500 border-green-400 text-black shadow-lg shadow-green-500/30'
                          : 'border-neutral-700 text-neutral-500 bg-neutral-900'
                        }`}>
                        {isCompleted ? <Check className="w-6 h-6" /> : index + 1}
                      </div>
                      <p className={`text-lg leading-relaxed pt-2 transition-colors duration-300 ${isCompleted ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                        {step}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Feature 6: Nutrition Insight Card */}
              {recipe.nutrition && (
                <div className="mt-8 bg-neutral-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-wrap gap-4 items-center justify-between shadow-lg">
                  <div className="w-full text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" /> ~ AI Estimated Nutrition
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 px-4 py-2 text-sm font-semibold">
                    🔥 {recipe.nutrition.calories}
                  </Badge>
                  <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${recipe.nutrition.protein === 'High' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-neutral-300'}`}>
                    💪 Protein: {recipe.nutrition.protein}
                  </Badge>
                  <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${recipe.nutrition.fat === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-neutral-300'}`}>
                    🛢️ Fat: {recipe.nutrition.fat}
                  </Badge>
                  <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${recipe.nutrition.fiber === 'Low' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                    🫐 Fiber: {recipe.nutrition.fiber}
                  </Badge>
                </div>
              )}

              {/* Feature 7: Smart Health Warnings */}
              {recipe.healthWarnings && recipe.healthWarnings.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {recipe.healthWarnings.map((warning: string, i: number) => {
                    const isGood = warning.toLowerCase().includes('no major concerns');
                    return (
                      <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${isGood ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {isGood ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {warning}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Feature 8: Missing Ingredients List */}
              {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                <div className="mt-12 bg-neutral-900 p-8 rounded-[2rem] border border-white/5">
                  <h3 className="font-bold text-2xl mb-6 text-white flex items-center gap-3">
                    🛒 You'll Need to Buy:
                  </h3>
                  <div className="space-y-4">
                    {recipe.missingIngredients.map((ing: string, i: number) => {
                      const subInfo = substitutions[ing];
                      return (
                        <div key={i} className="flex flex-col gap-2">
                          <label className="flex items-center gap-4 cursor-pointer group">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checkedMissing.includes(ing) ? 'bg-amber-500 border-amber-500 text-black' : 'border-neutral-600 group-hover:border-amber-500'}`}>
                              {checkedMissing.includes(ing) && <Check className="w-4 h-4 font-bold" />}
                            </div>
                            <div className={`flex-1 flex flex-wrap items-center justify-between gap-3 text-lg transition-colors ${checkedMissing.includes(ing) ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                              <span>{ing} <span className="text-neutral-500 text-sm ml-2">(~Rs. {getPrice(ing)})</span></span>
                              {!subInfo && (
                                <button
                                  onClick={(e) => handleSubstitute(e, ing)}
                                  className="text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/20 transition-all flex items-center gap-1 z-10"
                                >
                                  🔄 Swap
                                </button>
                              )}
                            </div>
                            <input type="checkbox" className="hidden" checked={checkedMissing.includes(ing)} onChange={() => toggleMissing(ing)} />
                          </label>
                          {subInfo && (
                            <div className="ml-10 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-neutral-300">
                              {subInfo.loading ? (
                                <span className="flex items-center gap-2 animate-pulse text-amber-500"><Sparkles className="w-4 h-4" /> Finding best swap...</span>
                              ) : (
                                <div>
                                  <strong className="text-amber-400">💡 Swap with: {subInfo.sub}</strong>
                                  <p className="text-neutral-400 mt-1">{subInfo.reason}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Feature 9: FoodPanda Grocery Section (Pink Theme) */}
              {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                <div className="mt-12 relative overflow-hidden rounded-[2.5rem] bg-[#FFF0F5] border border-[#D61F69]/20 shadow-2xl">
                  {/* Geometric Shapes Background */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFE135] transform rotate-45 translate-x-32 -translate-y-32" />
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#D61F69] transform rotate-[30deg] translate-x-48 -translate-y-10" />

                  <div className="relative z-10 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-[#D61F69] rounded-full flex items-center justify-center text-white">
                        {/* Simple panda face approximation */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="white" /><circle cx="8" cy="10" r="2" fill="#D61F69" /><circle cx="16" cy="10" r="2" fill="#D61F69" /><path d="M10 15C10 15 11 17 12 17C13 17 14 15 14 15" stroke="#D61F69" strokeWidth="2" strokeLinecap="round" /></svg>
                      </div>
                      <span className="text-[#D61F69] font-black text-xl tracking-tight">pandamart <span className="text-neutral-500 font-normal text-sm ml-2">by foodpanda</span></span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-black leading-[1.1] mb-6 max-w-sm">
                      Get missing ingredients <br />
                      <span className="text-[#D61F69]">delivered in 30 mins</span>
                    </h2>

                    <p className="text-neutral-700 font-medium mb-10">BawarchiKhana detected these from your recipe — add them to your order.</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {recipe.missingIngredients.map((ing: string, i: number) => {
                        const price = getPrice(ing);
                        const isAdded = checkedMissing.includes(ing);
                        return (
                          <div key={i} className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm text-center transition-all hover:shadow-md flex flex-col items-center">
                            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center text-3xl mb-4">
                              {ing.includes('tomato') ? '🍅' : ing.includes('onion') ? '🧅' : ing.includes('chicken') ? '🍗' : ing.includes('egg') ? '🥚' : ing.includes('garlic') ? '🧄' : ing.includes('chilli') ? '🌶️' : ing.includes('yogurt') ? '🥛' : '🍲'}
                            </div>
                            <h4 className="font-bold text-black text-sm capitalize mb-1">{ing}</h4>
                            <p className="text-[#D61F69] font-black text-sm mb-4">Rs. {price}</p>
                            <button
                              onClick={() => toggleMissing(ing)}
                              className={`w-full py-2.5 rounded-2xl font-bold text-sm transition-all ${isAdded ? 'bg-neutral-100 text-neutral-400 border border-neutral-200' : 'bg-white text-[#D61F69] border border-[#D61F69]/20 hover:bg-[#FFF0F5]'}`}
                            >
                              {isAdded ? 'Added' : '+ Add'}
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <div className="bg-[#FDEEF4] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#D61F69]/10">
                      <div>
                        <h4 className="text-black font-black text-lg">{checkedMissing.length} items in cart — Rs. {currentCartTotal}</h4>
                        <p className="text-neutral-500 text-sm">Free delivery on orders above Rs. 500 | ~30 min delivery</p>
                      </div>
                      <button
                        onClick={() => {
                          toast.success('Order Placed Successfully via pandamart! 🛵💨', { duration: 4000 });
                        }}
                        className={`px-8 py-4 rounded-full font-black text-white shadow-lg transition-transform hover:scale-105 ${checkedMissing.length > 0 ? 'bg-[#D61F69]' : 'bg-[#D61F69]/50 cursor-not-allowed'}`}
                        disabled={checkedMissing.length === 0}
                      >
                        Order via pandamart
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#D61F69] p-4 text-center flex flex-col sm:flex-row justify-between items-center px-8 text-sm">
                    <span className="text-white/80 font-medium">Powered by pandamart x BawarchiKhana</span>
                    <span className="bg-white text-[#D61F69] px-4 py-1.5 rounded-full font-bold mt-2 sm:mt-0">30-min delivery</span>
                  </div>
                </div>
              )}

              <div className="mt-12 text-center pb-12">
                <Button
                  size="lg"
                  className={`w-full py-8 text-xl rounded-2xl shadow-xl transition-all duration-500 font-bold ${allStepsCompleted
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-black shadow-[0_0_30px_rgba(52,211,153,0.4)] transform hover:scale-105'
                      : 'bg-white/5 text-neutral-500 opacity-50 cursor-not-allowed'
                    }`}
                  disabled={!allStepsCompleted}
                  onClick={completeCooking}
                >
                  <CheckCircle2 className="w-7 h-7 mr-3" /> Complete Cooking Session
                </Button>
                {!allStepsCompleted && (
                  <p className="mt-4 text-sm text-neutral-500 font-medium">
                    Check off all steps to complete this recipe!
                  </p>
                )}
              </div>
            </div>

            {/* Right Sidebar: Copilot */}
            <div className="lg:col-span-3">
              <div className="sticky top-28 bg-neutral-900 border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col h-[600px] max-h-[80vh]">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 flex justify-between items-center shadow-md z-10">
                  <div className="flex items-center gap-3 text-black">
                    <ChefHat className="w-6 h-6" />
                    <span className="font-black font-heading text-xl tracking-tight">Cooking Copilot</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900/50">
                  {copilotMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-amber-500 text-black rounded-tr-sm' : 'bg-white/10 text-white border border-white/5 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isCopilotTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-4 rounded-2xl bg-white/10 text-white border border-white/5 rounded-tl-sm flex gap-1">
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-neutral-900 border-t border-white/10">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendCopilotMessage(); }}
                    className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-full p-1"
                  >
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      className="flex-1 bg-transparent text-white px-4 py-2 text-sm focus:outline-none placeholder:text-neutral-500"
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!copilotInput.trim() || isCopilotTyping}
                      className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black disabled:opacity-50 disabled:bg-neutral-700 disabled:text-neutral-500 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </main>
      )}
    </div>
  );
}
