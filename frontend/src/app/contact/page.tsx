'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WarpShaderBg from "@/components/ui/warp-shader";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500/30">
      <WarpShaderBg />
      
      <div className="max-w-2xl w-full relative z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">Contact Us</h1>
        <p className="text-xl text-neutral-400 font-light mb-12">
          We'd love to hear from you. Reach out to us for support, partnerships, or just to say hello.
        </p>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 md:p-12 text-left">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Name</label>
              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
              <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Message</label>
              <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="How can we help?"></textarea>
            </div>
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,122,0,0.2)]">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
