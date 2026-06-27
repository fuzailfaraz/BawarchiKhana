'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Api } from '@/lib/api';
import { MagneticButton } from '@/components/ui/MagneticButton';
import WarpShaderBg from '@/components/ui/warp-shader';
import gsap from 'gsap';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const formRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline();
    
    tl.fromTo(leftPanelRef.current, 
      { opacity: 0, x: -50 }, 
      { opacity: 1, x: 0, duration: 1, ease: "power3.out" }
    )
    .fromTo(".auth-stagger", 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
      "-=0.5"
    );
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await Api.post('/auth/request-otp', { phone });
      
      // For demo purposes, display the OTP to the user
      if (response.otp) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-bold">Demo OTP Received:</span>
              <span className="text-2xl tracking-[0.3em] font-mono font-black text-amber-500">{response.otp}</span>
              <span className="text-xs text-neutral-400 mt-1">Check the field, it might be pre-filled!</span>
            </div>
          ), 
          { duration: 8000, position: 'top-center' }
        );
        // Pre-fill the OTP to make testing even smoother
        setOtp(response.otp);
      }

      // Animate transition to step 2
      gsap.to(".auth-step-1", { opacity: 0, x: -20, duration: 0.3, onComplete: () => {
        setStep(2);
        gsap.fromTo(".auth-step-2", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4 });
      }});
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await Api.post('/auth/verify-otp', { phone, otp });
      localStorage.setItem('token', response.accessToken);
      
      // Success animation
      gsap.to(formRef.current, { scale: 0.95, opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => {
        router.push('/dashboard');
      }});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050505] relative overflow-hidden text-neutral-100 selection:bg-amber-500/30">
      <WarpShaderBg />
      
      {/* Left Panel - Visuals */}
      <div ref={leftPanelRef} className="hidden lg:flex flex-1 relative items-center justify-center border-r border-white/5 p-12">
        <div className="absolute inset-0 bg-black/20">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay pointer-events-none"></div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-lg">
          <div className="relative w-24 h-24 mb-8 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
          </div>
          <h1 className="text-5xl font-black font-heading text-white leading-[1.1] mb-6">
            Your personal <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              AI Sous-Chef.
            </span>
          </h1>
          <p className="text-lg text-neutral-400 font-medium leading-relaxed mb-10">
            Join thousands of users who have transformed their daily cooking experience. No more food waste, no more wondering what to make.
          </p>
          
          <div className="space-y-4">
            {['100% Halal Recipes', 'Urdu Voice Support', 'Zero-Waste Cooking'].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-neutral-300 font-medium bg-white/5 border border-white/5 px-4 py-3 rounded-xl w-max backdrop-blur-sm">
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <Link href="/" className="absolute top-8 left-8 text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div ref={formRef} className="w-full max-w-md">
          <div className="auth-stagger text-center lg:text-left mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight mb-3">
              {step === 1 ? 'Welcome Back' : 'Verify Phone'}
            </h2>
            <p className="text-neutral-400 text-lg">
              {step === 1
                ? 'Enter your phone number to continue.'
                : `We sent a secure 6-digit code to ${phone}.`}
            </p>
          </div>

          <div className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative">
            {/* Step 1 — Phone */}
            {step === 1 && (
              <form className="auth-step-1 auth-stagger space-y-6" onSubmit={handleRequestOtp}>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <Input
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={error}
                      required
                      autoComplete="tel"
                      className="relative bg-black border-white/10 text-white focus:border-amber-500/50 rounded-xl py-6 px-4 text-lg shadow-inner"
                    />
                  </div>
                </div>

                <MagneticButton className="w-full mt-4">
                  <Button type="submit" className="w-full bg-white hover:bg-neutral-200 text-black font-black py-7 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] text-lg transition-transform" loading={loading}>
                    Continue with Phone
                  </Button>
                </MagneticButton>
                
                <p className="text-center text-xs text-neutral-500 font-medium mt-6">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            )}

            {/* Step 2 — OTP */}
            {step === 2 && (
              <form className="auth-step-2 space-y-6" onSubmit={handleVerifyOtp}>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Secure Code</label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur opacity-30 transition duration-500"></div>
                    <Input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      error={error}
                      required
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className="relative text-center text-3xl tracking-[0.5em] font-mono bg-black border-amber-500/30 text-white focus:border-amber-500 rounded-xl py-8 shadow-inner"
                    />
                  </div>
                </div>

                <MagneticButton className="w-full mt-4">
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-7 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] text-lg" loading={loading}>
                    Verify & Access Kitchen <Sparkles className="w-5 h-5 ml-2" />
                  </Button>
                </MagneticButton>

                <div className="flex items-center justify-center mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      gsap.to(".auth-step-2", { opacity: 0, x: 20, duration: 0.3, onComplete: () => {
                        setStep(1);
                        setOtp('');
                        setError('');
                        gsap.fromTo(".auth-step-1", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4 });
                      }});
                    }}
                    className="text-sm text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium border-b border-transparent hover:border-white pb-0.5"
                  >
                    Wrong number? Go back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}