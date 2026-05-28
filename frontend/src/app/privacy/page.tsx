'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WarpShaderBg from "@/components/ui/warp-shader";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden text-neutral-100 flex flex-col items-center p-6 pt-24 selection:bg-amber-500/30">
      <WarpShaderBg />
      
      <div className="max-w-3xl w-full relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-medium mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">Privacy Policy</h1>
        <p className="text-xl text-neutral-400 font-light mb-16">Last updated: May 2026</p>

        <div className="prose prose-invert prose-amber max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-neutral-400 leading-relaxed font-light">
              Welcome to BawarchiKhana. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. The Data We Collect About You</h2>
            <p className="text-neutral-400 leading-relaxed font-light mb-4">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 text-neutral-400 space-y-2 font-light">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Personal Data</h2>
            <p className="text-neutral-400 leading-relaxed font-light">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-neutral-400 space-y-2 font-light mt-4">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
