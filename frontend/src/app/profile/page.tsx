'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import Image from 'next/image';

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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0800 40%, #0a0a0a 100%)',
        color: 'white',
        fontFamily: 'var(--font-body)',
        paddingBottom: '80px',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'rgba(23,23,23,0.95)',
          borderBottom: '1px solid #262626',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '0 16px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div style={{ position: 'relative', width: '32px', height: '32px' }}>
              <Image src="/BK.png" alt="Logo" fill style={{ objectFit: 'contain' }} />
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#f59e0b',
                letterSpacing: '-0.02em',
              }}
            >
              BawarchiKhana
            </span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              color: '#a3a3a3',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 16px 0' }}>
        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 800,
            marginBottom: '32px',
            letterSpacing: '-0.02em',
          }}
        >
          My{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Profile
          </span>
        </h1>

        {/* Profile Card */}
        <div
          style={{
            border: profile.isPremium ? '1px solid rgba(245,158,11,0.4)' : '1px solid #262626',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 32px)',
            background: profile.isPremium
              ? 'linear-gradient(135deg, #171717 0%, #0a0a0a 100%)'
              : '#171717',
            boxShadow: profile.isPremium ? '0 0 60px rgba(245,158,11,0.1)' : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Avatar + Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: profile.isPremium ? '2px solid #f59e0b' : '2px solid #404040',
                background: profile.isPremium
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.2))'
                  : 'linear-gradient(135deg, #262626, #171717)',
                boxShadow: profile.isPremium ? '0 0 24px rgba(245,158,11,0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: '32px' }}>{profile.isPremium ? '👑' : '👤'}</span>
            </div>

            {profile.isPremium ? (
              <div
                style={{
                  padding: '6px 20px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                  color: 'black',
                  fontSize: '13px',
                  fontWeight: 900,
                  boxShadow: '0 0 20px rgba(245,158,11,0.4)',
                }}
              >
                PRO MEMBER
              </div>
            ) : (
              <div
                style={{
                  padding: '4px 16px',
                  borderRadius: '9999px',
                  background: '#262626',
                  border: '1px solid #404040',
                  color: '#a3a3a3',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Free Tier
              </div>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', fontWeight: 600, marginBottom: '4px' }}>
              Phone Number
            </div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#e5e5e5' }}>
              {profile.phone}
            </div>
          </div>

          {/* Skill + Spicy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(38,38,38,0.6)', borderRadius: '16px', padding: '16px', border: '1px solid #262626' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', fontWeight: 600, marginBottom: '4px' }}>
                Skill Level
              </div>
              <div style={{ fontSize: '16px', color: '#d4d4d4', textTransform: 'capitalize' }}>
                {profile.skillLevel}
              </div>
            </div>
            <div style={{ background: 'rgba(38,38,38,0.6)', borderRadius: '16px', padding: '16px', border: '1px solid #262626' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', fontWeight: 600, marginBottom: '4px' }}>
                Spicy Tolerance
              </div>
              <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    style={{
                      fontSize: '16px',
                      opacity: level <= profile.spicyTolerance ? 1 : 0.25,
                      filter: level <= profile.spicyTolerance ? 'none' : 'grayscale(1)',
                    }}
                  >
                    🌶️
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', fontWeight: 600, marginBottom: '8px' }}>
              Dietary Restrictions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.dietaryRestrictions.length > 0 ? (
                profile.dietaryRestrictions.map((req, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      background: '#262626',
                      border: '1px solid #404040',
                      fontSize: '13px',
                      color: '#d4d4d4',
                    }}
                  >
                    {req}
                  </span>
                ))
              ) : (
                <span style={{ color: '#737373', fontStyle: 'italic', fontSize: '14px' }}>None specified</span>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div
          style={{
            marginTop: '24px',
            background: '#171717',
            border: '1px solid #262626',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 24px)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
            📦 Subscription
          </h3>
          {profile.isPremium ? (
            <div>
              <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '12px' }}>
                You have unlimited access to AI recipe generation.
              </p>
              <p style={{ color: '#737373', fontSize: '12px' }}>
                Renews: {profile.subscriptionExpiresAt ? format(new Date(profile.subscriptionExpiresAt), 'MMM dd, yyyy') : 'N/A'}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '16px' }}>
                Upgrade to unlock unlimited recipes and premium features.
              </p>
              <button
                onClick={() => router.push('/premium')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#f59e0b',
                  color: '#0a0a0a',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(245,158,11,0.2)',
                }}
              >
                Upgrade to Premium
              </button>
            </div>
          )}
        </div>

        {/* Connected Services Card */}
        <div
          style={{
            marginTop: '24px',
            background: '#171717',
            border: '1px solid #262626',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 24px)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
            🔗 Connected Services
          </h3>
          <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '16px' }}>
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
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#262626',
              color: '#d4d4d4',
              fontWeight: 500,
              fontSize: '14px',
              border: '1px solid #404040',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.0003 1.58594L3.89648 15.6172H6.94531L15.0492 1.58594H12.0003Z" fill="#34A853"/>
              <path d="M12.0003 1.58594L8.95117 6.86719L17.055 20.8984H20.1038L12.0003 1.58594Z" fill="#EA4335"/>
              <path d="M3.89648 15.6172L8.95117 24.3828H20.1038L15.0492 15.6172H3.89648Z" fill="#FBBC04"/>
              <path d="M3.89648 15.6172L6.94531 20.8984L12.0003 12.1328L8.95117 6.86719L3.89648 15.6172Z" fill="#4285F4"/>
            </svg>
            Connect Google Drive
          </button>
        </div>

        {/* Log Out Card */}
        <div
          style={{
            marginTop: '24px',
            background: '#171717',
            border: '1px solid #262626',
            borderRadius: '24px',
            padding: 'clamp(20px, 4vw, 24px)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#262626',
              color: '#a3a3a3',
              fontWeight: 500,
              fontSize: '14px',
              border: '1px solid #404040',
              cursor: 'pointer',
            }}
          >
            🚪 Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
