'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, Sparkles, Zap, UtensilsCrossed, ArrowRight, Play, Camera, Mic, CheckCircle, Menu, X } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { CinematicCursor } from "@/components/ui/CinematicCursor";
import WarpShaderBg from "@/components/ui/warp-shader";
import { NavHeader } from "@/components/ui/nav-header";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      setIsLoggedIn(true);
    }

    // Mouse follower orb and parallax in hero
    const handleMouseMove = (e: MouseEvent) => {
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 1.5,
          ease: "power3.out"
        });
      }
      
      // Parallax effect on hero
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      
      if (textRef.current) {
        gsap.to(textRef.current, {
          x: x * 1.5,
          y: y * 1.5,
          duration: 1.5,
          ease: "power2.out"
        });
      }
      
      gsap.to(".video-bg", {
        x: x * -1.5,
        y: y * -1.5,
        duration: 1.5,
        ease: "power2.out"
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Initial Hero Animation
    const tl = gsap.timeline();
    tl.fromTo(".hero-badge", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
      .fromTo(".hero-title-line", { y: 50, opacity: 0, rotateX: -30 }, { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.15, ease: "power3.out" }, "-=0.5")
      .fromTo(".hero-desc", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .fromTo(".hero-cta", { y: 20, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, "-=0.5");

    // Parallax on scroll for cinematic sections
    gsap.to(".video-bg", {
      y: 150,
      scale: 1.05,
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 overflow-hidden selection:bg-amber-500/30 relative">
      <WarpShaderBg />
      <CinematicCursor />
      
      {/* Global Mouse Tracker Orb */}
      <div 
        ref={orbRef} 
        className="fixed top-0 left-0 w-[500px] h-[500px] -ml-[250px] -mt-[250px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen"
      />

      {/* Cinematic Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer z-10 shrink-0">
            <div className="relative w-10 h-10 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 font-heading tracking-tight">BawarchiKhana</span>
          </Link>
          
          {/* Desktop Navigation Pill */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-max">
            <NavHeader />
          </div>
          
          {/* Desktop Auth / CTA */}
          <div className="hidden lg:flex items-center gap-6 z-10 shrink-0">
            {isLoggedIn ? (
              <>
                <button onClick={() => {
                  localStorage.removeItem('token');
                  setIsLoggedIn(false);
                }} className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                  Log Out
                </button>
                <MagneticButton>
                  <Link href="/dashboard" className="group relative flex items-center justify-center bg-white/5 border border-white/10 text-white px-7 py-3 rounded-full font-bold text-sm transition-all hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    Dashboard
                  </Link>
                </MagneticButton>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                  Log In
                </Link>
                <MagneticButton>
                  <Link href="/auth" className="group relative flex items-center justify-center bg-white/5 border border-white/10 text-white px-7 py-3 rounded-full font-bold text-sm transition-all hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    Start Free
                  </Link>
                </MagneticButton>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 -mr-2 text-neutral-300 hover:text-amber-400 transition-colors z-20 shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 flex flex-col items-center py-8 gap-6 shadow-2xl">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-semibold text-neutral-300 hover:text-amber-400 transition-colors">Home</Link>
            <Link href="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-semibold text-neutral-300 hover:text-amber-400 transition-colors">Features</Link>
            <Link href="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-semibold text-neutral-300 hover:text-amber-400 transition-colors">Pricing</Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-semibold text-neutral-300 hover:text-amber-400 transition-colors">About</Link>
            <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-semibold text-neutral-300 hover:text-amber-400 transition-colors">Contact</Link>
            
            <div className="w-16 h-[1px] bg-white/10 my-2"></div>
            
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-[200px] text-center bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  Dashboard
                </Link>
                <button onClick={() => {
                  localStorage.removeItem('token');
                  setIsLoggedIn(false);
                  setIsMobileMenuOpen(false);
                }} className="text-lg font-medium text-neutral-400 hover:text-white transition-colors">
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-[200px] text-center bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  Start Free
                </Link>
                <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-neutral-400 hover:text-white transition-colors">
                  Log In
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Cinematic Full-Screen Hero Section */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-between overflow-hidden z-10 bg-[#050505] pt-32 pb-8">
        
        {/* Background Video Layer */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            className="video-bg absolute w-[110vw] h-[130vh] object-cover opacity-70 max-w-none"
            style={{ top: '-15vh', left: '-5vw' }}
          >
            <source src="/HeroVid.mp4" type="video/mp4" />
          </video>
          {/* Overlays for depth and readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#050505] z-10" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay z-10 pointer-events-none" />
        </div>

        {/* Top spacer */}
        <div className="flex-1 w-full pointer-events-none" />

        <div className="w-full max-w-6xl mx-auto px-6 md:px-12 flex-none flex flex-col items-center justify-center relative z-20 text-center" ref={textRef}>
          
          <div className="hero-badge flex items-center gap-4 mb-10">
            <div className="h-[1px] w-8 bg-amber-500/50"></div>
            <span className="text-amber-500/90 text-xs font-bold uppercase tracking-[0.4em]">The Intelligent Cooking Assistant</span>
            <div className="h-[1px] w-8 bg-amber-500/50"></div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] font-black tracking-tighter text-white leading-[1.1] mb-6 py-2" style={{ perspective: "1000px" }}>
            <div className="hero-title-line origin-bottom">Stop Wondering,</div>
            <div className="hero-title-line origin-bottom text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 pb-2 sm:pb-4">
              Start Cooking.
            </div>
          </h1>
          
          <p className="hero-desc text-base sm:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
            Transform your everyday pantry ingredients into award-winning meals. 
            Pakistan's first smart cooking assistant tailored for authentic, zero-waste kitchens.
          </p>
          
          <div className="hero-cta flex flex-col sm:flex-row items-center gap-6 justify-center">
            <MagneticButton>
              <Link href={isLoggedIn ? "/dashboard" : "/auth"} className="group relative flex items-center gap-3 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-base transition-all hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-400 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                <span className="relative z-10">{isLoggedIn ? "Go to Dashboard" : "Start Cooking Free"}</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
            </MagneticButton>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex-1 w-full flex items-end justify-center z-20 opacity-60">
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-400">Scroll</span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-amber-400 to-transparent" />
          </div>
        </div>
      </section>

      {/* Cinematic Statement Section with BK Background */}
      <section className="py-40 relative flex items-center justify-center border-b border-white/5 overflow-hidden">
        {/* BK.png Background Layer */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.06] mix-blend-screen pointer-events-none">
          <Image src="/BK.png" alt="BawarchiKhana Background" fill className="object-contain object-center scale-150" />
        </div>
        
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay z-0"></div>
        
        <ScrollReveal className="relative z-10 max-w-5xl px-6 text-center">
          <UtensilsCrossed className="w-16 h-16 text-amber-500/80 mx-auto mb-12" />
          <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            "The future of cooking isn't about rigid recipes. It's about <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">intelligent adaptation</span> to what you already have."
          </h2>
        </ScrollReveal>
      </section>

      {/* Elegant Features Grid with BK Background */}
      <section id="features" className="py-40 relative overflow-hidden">
        {/* BK.png Background Texture */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Image src="/BK.png" alt="Texture" fill className="object-contain object-center scale-[2]" />
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-24">
            <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">The System</div>
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">Supercharge Your Kitchen.</h2>
            <p className="text-neutral-400 text-xl font-light">BawarchiKhana combines cutting-edge AI with deep culinary knowledge to eliminate food waste and elevate your daily meals.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Camera className="w-6 h-6 text-amber-400" />, title: "Vision Scan", desc: "Snap a photo of your open fridge. Our AI instantly identifies every ingredient.", color: "from-amber-500/20" },
              { icon: <Mic className="w-6 h-6 text-emerald-400" />, title: "Voice Input (Urdu & Eng)", desc: "Hands dirty? Just speak your ingredients naturally, even in Urdu.", color: "from-emerald-500/20" },
              { icon: <Sparkles className="w-6 h-6 text-purple-400" />, title: "Zero-Waste Mode", desc: "Strictly generate recipes using ONLY what you have. No grocery runs needed.", color: "from-purple-500/20" },
              { icon: <CheckCircle className="w-6 h-6 text-blue-400" />, title: "Health Optimization", desc: "Tailor recipes instantly for high-protein, low-oil, or balanced diets.", color: "from-blue-500/20" },
              { icon: <Zap className="w-6 h-6 text-rose-400" />, title: "Real-time Copilot", desc: "Chat with the AI while cooking. 'What's a substitute for cumin?'", color: "from-rose-500/20" },
              { icon: <Clock className="w-6 h-6 text-orange-400" />, title: "Weekly Meal Planner", desc: "Auto-generate 7 days of meals based on your current pantry and export to Google Sheets.", color: "from-orange-500/20" },
            ].map((feature, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.1} direction="up" distance={40}>
                <div className="group relative h-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 p-10 rounded-3xl hover:bg-[#111] transition-all duration-500 overflow-hidden hover:border-white/10">
                  <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl ${feature.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3`} />
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-neutral-400 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-40 relative border-t border-white/5">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">Pricing</div>
            <h2 className="text-5xl md:text-7xl font-black mb-6 text-white tracking-tighter">Start Cooking Smart.</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <ScrollReveal delay={0.1}>
              <div className="p-10 rounded-3xl bg-[#0a0a0a] border border-white/10 hover:border-amber-500/30 transition-colors h-full flex flex-col relative z-20">
                <h3 className="text-2xl font-bold text-white mb-2">Basic Chef</h3>
                <div className="text-4xl font-black text-white mb-6">Free</div>
                <ul className="space-y-4 mb-10 text-neutral-400 flex-grow">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> 5 AI Recipes per day</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> Basic text input</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> Standard recipes</li>
                </ul>
                <Link href="/auth" className="block w-full py-4 rounded-full border border-white/20 text-center font-bold text-white hover:bg-white/5 transition-colors">Get Started</Link>
              </div>
            </ScrollReveal>

            {/* Pro Tier */}
            <ScrollReveal delay={0.2}>
              <div className="p-10 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-amber-500/50 shadow-[0_0_30px_rgba(255,122,0,0.1)] relative h-full flex flex-col overflow-hidden z-20">
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">Popular</div>
                <h3 className="text-2xl font-bold text-amber-400 mb-2">Master Chef</h3>
                <div className="text-4xl font-black text-white mb-6">Rs. 999<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
                <ul className="space-y-4 mb-10 text-neutral-300 flex-grow">
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> Unlimited AI Recipes</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> Vision & Voice input</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> Real-time Copilot Chat</li>
                  <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-500" /> Weekly Meal Planning</li>
                </ul>
                <Link href="/auth" className="block w-full py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-center font-bold text-black hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,122,0,0.3)]">Upgrade Now</Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Cinematic CTA Section with BK Background */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.05] mix-blend-screen pointer-events-none">
          <Image src="/BK.png" alt="BawarchiKhana" fill className="object-contain object-center scale-150" />
        </div>
        
        <div className="w-full max-w-5xl mx-auto px-6 text-center relative z-10">
          <ScrollReveal>
            <div className="relative w-32 h-32 mx-auto mb-10 hover:scale-105 transition-transform drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
            </div>
            <h2 className="text-6xl md:text-[5.5rem] font-black text-white mb-8 tracking-tighter leading-none">Ready to cook?</h2>
            <p className="text-2xl text-neutral-400 mb-14 max-w-2xl mx-auto font-light">Join thousands of users transforming their daily meals with the power of AI.</p>
            <MagneticButton>
              <Link href="/auth" className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-black px-12 py-6 rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                Enter BawarchiKhana
              </Link>
            </MagneticButton>
          </ScrollReveal>
        </div>
      </section>

      {/* Cinematic Footer */}
      <footer className="border-t border-white/5 bg-transparent pt-24 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0 pointer-events-none" />
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-8 group">
                <div className="relative w-12 h-12 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
                </div>
                <span className="text-3xl font-black text-white tracking-tighter group-hover:text-amber-400 transition-colors">BawarchiKhana</span>
              </Link>
              <p className="text-neutral-400 max-w-sm font-light leading-relaxed text-lg">
                The intelligent cooking assistant that turns whatever you have in your kitchen into an incredible meal.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs">Product</h4>
              <ul className="space-y-5 text-neutral-400 font-medium text-sm">
                <li><Link href="#features" className="hover:text-amber-400 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</Link></li>
                <li><Link href="/auth" className="hover:text-amber-400 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-8 uppercase tracking-[0.2em] text-xs">Legal</h4>
              <ul className="space-y-5 text-neutral-400 font-medium text-sm">
                <li><Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-amber-400 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium text-neutral-500">
            <p>© 2026 BawarchiKhana by Fuzail Faraz. All rights reserved.</p>
            <p className="flex items-center gap-2">Designed with <HeartIcon className="w-4 h-4 text-amber-500" /> in Pakistan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeartIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}
