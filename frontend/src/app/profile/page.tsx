'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import Image from 'next/image';
import WarpShaderBg from '@/components/ui/warp-shader';

interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  skillLevel: string;
  dietaryRestrictions: string[];
  spicyTolerance: number;
  isPremium: boolean;
  subscriptionExpiresAt: string | null;
  currentPantry: string[];
  quotaUsed: number;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProfile(response.data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Could not load profile.</p>
        <button onClick={() => router.push('/dashboard')} className="text-amber-500 underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans selection:bg-amber-500/30 relative overflow-x-hidden">
      <WarpShaderBg />
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50 shadow-sm mb-12">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-3xl">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
          >
            <div className="relative w-8 h-8 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Image src="/BK.png" alt="Logo" fill className="object-contain mix-blend-screen" />
            </div>
            <span className="text-xl font-bold font-heading text-amber-500 tracking-tight group-hover:text-amber-400 transition-colors">BawarchiKhana</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10 px-4 md:px-0">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Profile</span>
          </h1>
        </div>

        <div className={`border rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-700 ${profile.isPremium ? 'bg-gradient-to-br from-neutral-900 to-black border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)]' : 'bg-neutral-900 border-neutral-800'}`}>
          {/* Decorative background element */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 ${profile.isPremium ? 'bg-amber-500/20' : 'bg-amber-500/5'}`}></div>

          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            {/* Avatar / Status Section */}
            <div className="flex flex-col items-center gap-4 w-full md:w-auto">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-inner border-2 ${profile.isPremium ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-700'}`}>
                <span className="text-3xl">{profile.isPremium ? '👑' : '👤'}</span>
              </div>
              
              {profile.isPremium ? (
                <div className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 transform hover:scale-105 transition-transform cursor-default">
                  PRO MEMBER
                </div>
              ) : (
                <div className="px-4 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm font-medium">
                  Free Tier
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-1">Phone Number</h3>
                <p className="text-xl font-medium text-neutral-200">{profile.phone}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-800/50 rounded-2xl p-4 border border-neutral-800">
                  <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-1">Skill Level</h3>
                  <p className="text-lg text-neutral-300 capitalize">{profile.skillLevel}</p>
                </div>
                <div className="bg-neutral-800/50 rounded-2xl p-4 border border-neutral-800">
                  <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-1">Spicy Tolerance</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <span 
                        key={level} 
                        className={`text-lg ${level <= profile.spicyTolerance ? 'text-red-500' : 'text-neutral-700 opacity-50 grayscale'}`}
                      >
                        🌶️
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mb-2">Dietary Restrictions</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.dietaryRestrictions.length > 0 ? (
                    profile.dietaryRestrictions.map((req, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-300">
                        {req}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500 italic">None specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription & Actions Area */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h3 className="text-lg font-semibold text-white mb-2 relative z-10">Subscription</h3>
            {profile.isPremium ? (
              <div className="relative z-10">
                <p className="text-neutral-400 text-sm mb-4">
                  You have unlimited access to AI recipe generation.
                </p>
                <p className="text-xs text-neutral-500">
                  Renews: {profile.subscriptionExpiresAt ? format(new Date(profile.subscriptionExpiresAt), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-neutral-400 text-sm mb-4">
                  Upgrade to unlock unlimited recipes and premium features.
                </p>
                <button 
                  onClick={() => router.push('/premium')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Connected Services</h3>
              <p className="text-neutral-400 text-sm mb-4">
                Connect third-party apps like Google Drive to export recipes.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/google-drive/connect`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data && res.data.url) {
                      window.location.href = res.data.url;
                    }
                  } catch (e) {
                    console.error('Failed to get connect URL', e);
                    alert('Failed to connect Google Drive.');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-emerald-500/20 text-neutral-300 hover:text-emerald-400 border border-neutral-700 hover:border-emerald-500/50 font-medium transition-colors mb-4 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.0003 1.58594L3.89648 15.6172H6.94531L15.0492 1.58594H12.0003Z" fill="#34A853"/>
                  <path d="M12.0003 1.58594L8.95117 6.86719L17.055 20.8984H20.1038L12.0003 1.58594Z" fill="#EA4335"/>
                  <path d="M3.89648 15.6172L8.95117 24.3828H20.1038L15.0492 15.6172H3.89648Z" fill="#FBBC04"/>
                  <path d="M3.89648 15.6172L6.94531 20.8984L12.0003 12.1328L8.95117 6.86719L3.89648 15.6172Z" fill="#4285F4"/>
                </svg>
                Connect Google Drive
              </button>
            </div>
            
            <div className="pt-4 border-t border-neutral-800">
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-neutral-700 hover:border-red-500/50 font-medium transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
