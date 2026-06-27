'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Leaf, Droplets, Globe2, Activity, Calculator, Sparkles, CircleDollarSign, CookingPot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Api } from '@/lib/api';

const impactData: Record<string, { co2: number, water: number, icon: string, color: string }> = {
  'Beef': { co2: 27.0, water: 15415, icon: '🥩', color: 'from-red-500/20 to-red-900/20 border-red-500/50 text-red-400' },
  'Mutton': { co2: 24.0, water: 8763, icon: '🍖', color: 'from-orange-500/20 to-orange-900/20 border-orange-500/50 text-orange-400' },
  'Cheese': { co2: 13.5, water: 3178, icon: '🧀', color: 'from-yellow-500/20 to-yellow-900/20 border-yellow-500/50 text-yellow-400' },
  'Chicken': { co2: 6.9, water: 4325, icon: '🍗', color: 'from-amber-500/20 to-amber-900/20 border-amber-500/50 text-amber-400' },
  'Eggs': { co2: 4.8, water: 3265, icon: '🥚', color: 'from-yellow-200/20 to-yellow-600/20 border-yellow-300/50 text-yellow-200' },
  'Rice': { co2: 2.7, water: 2497, icon: '🍚', color: 'from-blue-500/20 to-blue-900/20 border-blue-500/50 text-blue-400' },
  'Tomatoes': { co2: 1.1, water: 214, icon: '🍅', color: 'from-rose-500/20 to-rose-900/20 border-rose-500/50 text-rose-400' },
  'Potatoes': { co2: 0.5, water: 287, icon: '🥔', color: 'from-green-500/20 to-green-900/20 border-green-500/50 text-green-400' },
};

export default function SustainabilityPage() {
  const [savedFood, setSavedFood] = useState(1247.5);
  const [recentSaves, setRecentSaves] = useState<{user: string, item: string, amount: number, id: number}[]>([]);
  const [userImpact, setUserImpact] = useState<{ itemsSaved: number, moneySaved: number, kgWasteAvoided: number, mealsCooked: number } | null>(null);
  
  // Calculator State
  const [selectedIngredient, setSelectedIngredient] = useState<string>('Beef');
  const [amount, setAmount] = useState<number>(1);

  useEffect(() => {
    // Fetch real impact data from backend
    const fetchImpact = async () => {
      try {
        const data = await Api.get('/users/impact');
        if (data.wasteSaved) {
          setUserImpact({
            itemsSaved: data.wasteSaved.itemsSaved || 0,
            moneySaved: data.wasteSaved.moneySaved || 0,
            kgWasteAvoided: data.wasteSaved.kgWasteAvoided || 0,
            mealsCooked: data.mealsCooked || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load user impact', err);
      }
    };
    fetchImpact();

    // Dynamic global counter ticking up randomly
    const counterInterval = setInterval(() => {
      setSavedFood(prev => prev + (Math.random() * 2));
    }, 3500);

    // Live feed of simulated saves
    const items = ['Chicken', 'Tomatoes', 'Rice', 'Onions', 'Beef', 'Potatoes'];
    const users = ['Ali', 'Zainab', 'Omar', 'Fatima', 'Hassan', 'Ayesha'];
    let idCounter = 0;
    
    const feedInterval = setInterval(() => {
      const newItem = {
        id: idCounter++,
        user: users[Math.floor(Math.random() * users.length)],
        item: items[Math.floor(Math.random() * items.length)],
        amount: Number((Math.random() * 2 + 0.1).toFixed(1))
      };
      setRecentSaves(prev => [newItem, ...prev].slice(0, 4));
    }, 4500);

    return () => {
      clearInterval(counterInterval);
      clearInterval(feedInterval);
    };
  }, []);

  const currentImpact = impactData[selectedIngredient];

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col relative overflow-hidden selection:bg-green-500/30">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-green-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0">
            <span className="text-2xl">👨‍🍳</span>
            <span className="text-2xl font-bold font-heading text-amber-500 tracking-tight group-hover:text-amber-400 transition-colors">BawarchiKhana</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <button className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                Cook Now
              </button>
            </Link>
            <Link href="/">
              <button className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-20 relative z-10 max-w-6xl">
        
        {/* Global Impact Header */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-8 bg-green-500/50"></div>
              <span className="text-green-400 text-xs font-bold uppercase tracking-[0.4em]">Live Tracker</span>
              <div className="h-[1px] w-8 bg-green-500/50"></div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black font-heading text-white mb-6 tracking-tight">
              Food saved is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">future secured.</span>
            </h1>
            <p className="text-xl text-neutral-400 font-light leading-relaxed max-w-lg mb-8">
              Every time you use Zero-Waste Mode, you contribute to a massive reduction in global emissions and water waste.
            </p>
            
            <div className="inline-flex flex-col p-8 rounded-[2.5rem] bg-neutral-900/80 border border-white/10 shadow-2xl backdrop-blur-xl hover:border-green-500/30 transition-colors">
              <span className="text-5xl md:text-7xl font-black text-white font-mono tracking-tighter mb-2 tabular-nums">
                {savedFood.toFixed(1)} <span className="text-3xl text-green-400">kg</span>
              </span>
              <span className="text-neutral-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-blue-400" /> Saved Globally by users
              </span>
            </div>

            {/* Personal Impact Dashboard (Phase 4) */}
            {userImpact && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div className="text-amber-500 mb-2"><CircleDollarSign className="w-6 h-6" /></div>
                  <div className="text-3xl font-black text-white mb-1">Rs. {userImpact.moneySaved.toLocaleString()}</div>
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Money Saved</div>
                </div>
                <div className="bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div className="text-green-500 mb-2"><Leaf className="w-6 h-6" /></div>
                  <div className="text-3xl font-black text-white mb-1">{userImpact.kgWasteAvoided.toFixed(1)} kg</div>
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Waste Avoided</div>
                </div>
                <div className="bg-neutral-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div className="text-blue-500 mb-2"><CookingPot className="w-6 h-6" /></div>
                  <div className="text-3xl font-black text-white mb-1">{userImpact.mealsCooked}</div>
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Meals Cooked</div>
                </div>
              </div>
            )}

          </motion.div>

          {/* Live Feed Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[400px]"
          >
            <div className="bg-[#0a0a0a] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
              <h3 className="font-bold text-white mb-6 flex items-center gap-2 px-2 z-10">
                <Activity className="w-5 h-5 text-green-400" /> Recent Community Saves
              </h3>
              
              <div className="flex-1 overflow-hidden relative z-10 flex flex-col gap-4">
                <AnimatePresence>
                  {recentSaves.map((save) => (
                    <motion.div
                      key={save.id}
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-black font-bold">
                        {save.user[0]}
                      </div>
                      <div>
                        <p className="text-sm text-neutral-300">
                          <strong className="text-white">{save.user}</strong> saved <strong className="text-amber-400">{save.item}</strong>
                        </p>
                        <p className="text-xs text-green-400 font-medium">
                          {save.amount}kg rescued from the bin! 🎉
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {recentSaves.length === 0 && (
                  <div className="h-full flex items-center justify-center text-neutral-500 animate-pulse text-sm">
                    Listening for live saves...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interactive Calculator */}
        <div className="mb-24 relative z-10">
          <div className="bg-neutral-900/60 rounded-[3rem] p-8 md:p-16 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-amber-500/10 blur-[100px] pointer-events-none" />
            
            <div className="text-center mb-12 relative z-10">
              <h2 className="text-4xl md:text-5xl font-black font-heading text-white mb-4 flex items-center justify-center gap-3">
                <Calculator className="w-8 h-8 text-amber-500" /> The True Cost of Waste
              </h2>
              <p className="text-neutral-400 max-w-2xl mx-auto">Select an ingredient and amount to see exactly how much environmental impact is caused when it gets thrown away.</p>
            </div>

            <div className="grid md:grid-cols-12 gap-12 items-center relative z-10">
              {/* Controls */}
              <div className="md:col-span-5 space-y-8">
                <div>
                  <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Select Ingredient</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.keys(impactData).map(ing => (
                      <button
                        key={ing}
                        onClick={() => setSelectedIngredient(ing)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                          selectedIngredient === ing 
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                            : 'bg-black/50 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {impactData[ing].icon} {ing}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex justify-between">
                    Amount Wasted 
                    <span className="text-white bg-white/10 px-2 py-0.5 rounded text-xs">{amount} kg</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.1" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-2 font-mono">
                    <span>100g</span>
                    <span>5kg</span>
                  </div>
                </div>
              </div>

              {/* Visualization */}
              <div className="md:col-span-7">
                <motion.div 
                  key={selectedIngredient}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br border ${currentImpact.color} relative overflow-hidden transition-colors duration-500`}
                >
                  <div className="absolute top-4 right-6 text-[8rem] opacity-20 rotate-12 select-none pointer-events-none">
                    {currentImpact.icon}
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-8 relative z-10">Wasting {amount}kg of {selectedIngredient} equates to:</h3>
                  
                  <div className="space-y-8 relative z-10">
                    <div>
                      <div className="flex items-end gap-3 mb-2">
                        <Globe2 className="w-8 h-8 opacity-80" />
                        <span className="text-4xl md:text-5xl font-black font-mono tracking-tighter tabular-nums">
                          {(currentImpact.co2 * amount).toFixed(1)} <span className="text-lg uppercase tracking-widest font-bold opacity-60">kg CO₂</span>
                        </span>
                      </div>
                      <p className="text-sm font-medium opacity-80 ml-11">
                        Equivalent to driving a gas car for ~{Math.round(currentImpact.co2 * amount * 4)} km.
                      </p>
                    </div>

                    <div className="w-full h-px bg-current opacity-20" />

                    <div>
                      <div className="flex items-end gap-3 mb-2">
                        <Droplets className="w-8 h-8 opacity-80" />
                        <span className="text-4xl md:text-5xl font-black font-mono tracking-tighter tabular-nums">
                          {(currentImpact.water * amount).toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-lg uppercase tracking-widest font-bold opacity-60">Liters Water</span>
                        </span>
                      </div>
                      <p className="text-sm font-medium opacity-80 ml-11">
                        Equivalent to taking ~{Math.round((currentImpact.water * amount) / 65)} average showers.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-12 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Stop throwing away your resources.</h2>
          <Link href="/dashboard">
            <button className="px-10 py-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black text-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-center gap-3 mx-auto">
              <Sparkles className="w-6 h-6" /> Try Zero-Waste Mode Now
            </button>
          </Link>
        </div>

      </main>

      <footer className="border-t border-white/5 bg-black py-8 mt-auto z-10 relative">
        <div className="container mx-auto px-4 text-center text-sm text-neutral-600 font-medium">
          © 2026 BawarchiKhana by Fuzail Faraz | Built for Hackathon
        </div>
      </footer>
    </div>
  );
}
