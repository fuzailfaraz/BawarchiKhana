'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FoodPandaPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFF0F5] text-black overflow-hidden relative font-sans">
      
      {/* Geometric Shapes Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFE135] transform rotate-[-15deg] translate-x-1/3 -translate-y-1/3 z-0" />
      <div className="absolute top-0 right-0 w-[800px] h-[1000px] bg-[#D61F69] transform rotate-12 translate-x-1/2 -translate-y-1/4 z-0" />

      {/* Navigation */}
      <nav className="relative z-10 p-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-[#D61F69] hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-bold text-neutral-600">
          <MapPin className="w-4 h-4 text-[#D61F69]" /> Delivery to: Current Location
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-10 pb-20 relative z-10 flex flex-col md:flex-row items-center min-h-[80vh]">
        
        {/* Left Content */}
        <div className="flex-1 md:pr-10 z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-[#D61F69] rounded-full flex items-center justify-center shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="white"/><circle cx="8" cy="10" r="2.5" fill="#D61F69"/><circle cx="16" cy="10" r="2.5" fill="#D61F69"/><path d="M10 15C10 15 11 17 12 17C13 17 14 15 14 15" stroke="#D61F69" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </div>
            <span className="text-[#D61F69] font-black text-3xl tracking-tight">pandamart <span className="text-neutral-500 font-normal text-lg ml-2">by foodpanda</span></span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-black text-[#1A1A1A] leading-[1.05] mb-8"
          >
            Get missing <br/> ingredients <br/>
            <span className="text-[#D61F69]">delivered in 30 mins</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-600 font-medium mb-10 max-w-lg"
          >
            Order from pandamart and foodpanda shops straight to your kitchen.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-3 rounded-[2rem] shadow-xl flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="flex-1 flex items-center bg-neutral-100 rounded-2xl px-4 py-4">
              <MapPin className="w-5 h-5 text-[#D61F69] mr-3" />
              <input type="text" placeholder="Locate me" className="bg-transparent border-none outline-none w-full text-black font-medium" defaultValue="Current Location" />
            </div>
            <button className="bg-[#D61F69] hover:bg-[#b51857] text-white px-8 py-4 rounded-2xl font-black text-lg transition-colors shadow-md shadow-pink-500/20 whitespace-nowrap">
              Find shops near you
            </button>
          </motion.div>
        </div>

        {/* Right Content - Mascot Bag */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          className="flex-1 relative mt-20 md:mt-0 flex justify-center z-10"
        >
          {/* Bag Handle */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-24 border-[12px] border-white rounded-t-full z-0" />
          
          {/* Pink Bag */}
          <div className="w-80 h-96 bg-[#D61F69] rounded-[3rem] shadow-2xl relative z-10 flex flex-col items-center justify-center border-4 border-white/20">
            {/* Panda Face on Bag */}
            <div className="w-48 h-48 bg-white rounded-full flex flex-col items-center justify-center relative shadow-inner">
              {/* Ears */}
              <div className="absolute -top-4 -left-2 w-16 h-16 bg-black rounded-full border-4 border-white" />
              <div className="absolute -top-4 -right-2 w-16 h-16 bg-black rounded-full border-4 border-white" />
              
              {/* Eyes */}
              <div className="flex gap-8 mb-4 z-10">
                <div className="w-10 h-12 bg-black rounded-full flex items-center justify-center transform -rotate-12">
                  <div className="w-3 h-3 bg-white rounded-full mb-4 mr-2" />
                </div>
                <div className="w-10 h-12 bg-black rounded-full flex items-center justify-center transform rotate-12">
                  <div className="w-3 h-3 bg-white rounded-full mb-4 ml-2" />
                </div>
              </div>
              
              {/* Nose */}
              <div className="w-6 h-4 bg-pink-300 rounded-full mb-2" />
              
              {/* Mouth */}
              <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5C10 15 30 15 35 5" stroke="black" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            
            <div className="mt-8 text-white/50 font-black tracking-widest text-sm">foodpanda</div>
          </div>
        </motion.div>
      </main>

      {/* Processing overlay for mock checkout */}
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center"
        >
          <div className="w-16 h-16 border-4 border-neutral-100 border-t-[#D61F69] rounded-full animate-spin mb-4" />
          <h3 className="text-xl font-black text-black">Processing your cart...</h3>
          <p className="text-neutral-500 font-medium">Connecting to nearest pandamart</p>
        </motion.div>
      </div>

    </div>
  );
}
