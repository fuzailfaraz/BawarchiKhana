'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WarpShaderBg from "@/components/ui/warp-shader";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-neutral-100 flex flex-col items-center p-6 pt-24 selection:bg-amber-500/30">
      <WarpShaderBg />
      
      <div className="max-w-3xl w-full relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">Terms of Service</h1>
        <p className="text-xl text-neutral-400 font-light mb-16">Last updated: May 2026</p>

        <div className="prose prose-invert prose-amber max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-neutral-400 leading-relaxed font-light">
              By accessing our website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="text-neutral-400 leading-relaxed font-light mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on BawarchiKhana's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-neutral-400 space-y-2 font-light">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on BawarchiKhana's website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
            <p className="text-neutral-400 leading-relaxed font-light">
              The materials on BawarchiKhana's website are provided on an 'as is' basis. BawarchiKhana makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
            <p className="text-neutral-400 leading-relaxed font-light">
              In no event shall BawarchiKhana or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on BawarchiKhana's website, even if BawarchiKhana or a BawarchiKhana authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
