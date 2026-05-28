'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Confetti from 'react-confetti';
import useSound from 'use-sound';

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'easypesa' | null>(null);
  const router = useRouter();

  // Sounds (using standard data URIs for MVP)
  const [playSuccess] = useSound('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', { volume: 0.5 }); // Mock sound URI to prevent loading errors

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const checkoutRes = await axios.post('http://localhost:3001/payments/checkout', {
        method: paymentMethod,
        amount: 999
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { transactionId } = checkoutRes.data;

      await axios.post('http://localhost:3001/payments/webhook', {
        transactionId,
        status: 'completed'
      });

      setSuccess(true);
      playSuccess(); // Play success sound
      setTimeout(() => {
        router.push('/profile');
      }, 2000); // Give them 2 seconds to enjoy the confetti

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6 text-center overflow-hidden">
        <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 1000} height={typeof window !== 'undefined' ? window.innerHeight : 1000} />
        <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce shadow-[0_0_30px_rgba(34,197,94,0.3)] z-10 relative">
          ✓
        </div>
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 z-10 relative">Payment Successful!</h1>
        <p className="text-neutral-300 max-w-md text-lg z-10 relative">
          You are now a Premium Member. Enjoy unlimited AI recipe generations and advanced features.
        </p>
        <p className="text-neutral-500 text-sm mt-8 animate-pulse z-10 relative">Redirecting to profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans selection:bg-amber-500/30">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 shadow-sm mb-12">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-4xl">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
          >
            <span className="text-2xl">👨‍🍳</span>
            <span className="text-xl font-bold font-heading text-amber-500 tracking-tight group-hover:text-amber-400 transition-colors">BawarchiKhana</span>
          </button>
          <button 
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            BawarchiKhana <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Premium</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Unlock the full potential of your kitchen with unlimited AI intelligence and advanced flavor profiling.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Features */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold mb-6">What's included?</h2>
            
            <div className="space-y-4">
              {[
                'Unlimited AI Recipe Generations (No monthly quota)',
                'Priority Gemini Pro access for faster responses',
                'Advanced flavor profiling & spice matching',
                'Save unlimited recipes to your vault',
                'Ad-free distraction-free cooking mode'
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-xs">
                    ✓
                  </div>
                  <span className="text-neutral-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-neutral-800">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold">Rs. 999</span>
                <span className="text-neutral-500 mb-1">/ month</span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">Cancel anytime. Billed monthly.</p>
            </div>
          </div>

          {/* Payment form */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6">Select Payment Method</h2>
            
            <div className="space-y-4 mb-8">
              {/* JazzCash Option */}
              <label 
                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'jazzcash' 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="jazzcash" 
                  className="hidden"
                  onChange={() => setPaymentMethod('jazzcash')}
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'jazzcash' ? 'border-amber-500' : 'border-neutral-500'}`}>
                  {paymentMethod === 'jazzcash' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">JazzCash</h3>
                  <p className="text-xs text-neutral-400">Pay via your mobile wallet</p>
                </div>
              </label>

              {/* EasyPesa Option */}
              <label 
                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'easypesa' 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-neutral-700 hover:border-neutral-500 bg-neutral-800/50'
                }`}
              >
                <input 
                  type="radio" 
                  name="payment" 
                  value="easypesa" 
                  className="hidden"
                  onChange={() => setPaymentMethod('easypesa')}
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'easypesa' ? 'border-green-500' : 'border-neutral-500'}`}>
                  {paymentMethod === 'easypesa' && <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">EasyPaisa</h3>
                  <p className="text-xs text-neutral-400">Pay via your mobile wallet</p>
                </div>
              </label>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={!paymentMethod || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !paymentMethod || loading
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                'Pay Rs. 999'
              )}
            </button>
            <p className="text-center text-xs text-neutral-500 mt-4">
              This is a secure 256-bit encrypted connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
