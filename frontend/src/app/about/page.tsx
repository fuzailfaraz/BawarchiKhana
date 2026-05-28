'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import WarpShaderBg from "@/components/ui/warp-shader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col relative overflow-hidden">
      {/* Ambient Background Glows */}
      <WarpShaderBg />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
            </div>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 font-heading tracking-tight">
              BawarchiKhana
            </span>
          </Link>
          <Link href="/">
            <button className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-20 relative z-10 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-10">
            <div className="relative w-32 h-32 transform hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]">
              <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black font-heading text-center text-white mb-12">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Us</span>
          </h1>

          <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-[2.5rem] p-10 md:p-14 border border-white/10 shadow-2xl space-y-8 text-lg leading-relaxed text-neutral-300">
            <p>
              Welcome to <strong className="text-white">BawarchiKhana</strong> — Pakistan's first fully integrated, AI-powered culinary assistant.
            </p>
            
            <p>
              We believe that cooking shouldn't be a chore or a puzzle of figuring out what to make with whatever happens to be in your fridge. It should be a seamless, creative, and delicious experience. That is why we built BawarchiKhana.
            </p>

            <h2 className="text-2xl font-bold text-white mt-10 mb-4">What We Really Are</h2>
            <p>
              At our core, we are an advanced technology platform designed to bridge the gap between traditional South Asian household cooking and cutting-edge Artificial Intelligence. 
            </p>
            <p>
              Whether you are a beginner trying to boil your first egg, or an experienced cook looking to whip up an authentic Nihari, our AI models (powered by Gemini) dynamically adapt to your skill level, health goals, dietary restrictions, and available ingredients. 
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-10">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-amber-400 mb-2">Our Mission</h3>
                <p className="text-sm">To eliminate food waste and culinary fatigue by providing instant, highly tailored, and culturally accurate Halal recipe suggestions.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-orange-400 mb-2">Our Vision</h3>
                <p className="text-sm">To become the digital brain of every kitchen in Pakistan and beyond, modernizing how families plan, prep, and cook their daily meals.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-transparent py-8 mt-auto z-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0 pointer-events-none" />
        <div className="container mx-auto px-4 text-center text-sm text-neutral-600 font-medium relative z-10">
          © 2026 BawarchiKhana by Fuzail Faraz
        </div>
      </footer>
    </div>
  );
}
