'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';
import { ExportToDriveButton } from '@/components/ExportToDriveButton';

interface CookingSession {
  id: string;
  dishName: string;
  startedAt: string;
  completedAt: string | null;
  rating: number | null;
  feedback: string | null;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<CookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth');
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSessions(response.data.history);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-sans selection:bg-amber-500/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Cooking <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">History</span>
          </h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center">
            <span className="text-5xl mb-4 grayscale opacity-50">🍳</span>
            <h3 className="text-xl font-semibold text-white mb-2">No cooking history yet</h3>
            <p className="text-neutral-400 mb-6 max-w-md">
              You haven't completed any cooking sessions. Go to your dashboard to generate a recipe and start cooking!
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              Find a Recipe
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white line-clamp-2 pr-4">{session.dishName}</h3>
                  {session.completedAt ? (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold whitespace-nowrap">
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold whitespace-nowrap">
                      In Progress
                    </span>
                  )}
                </div>

                <div className="text-sm text-neutral-400 mb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>📅</span>
                    <span>Started: {format(new Date(session.startedAt), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                  {session.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      <span>⭐</span>
                      <span>{session.rating} / 5</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <ExportToDriveButton recipeId={session.id} recipeName={session.dishName} />
                  </div>
                </div>

                <Link href={`/recipe/${session.id}`} className="w-full block">
                  <button className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors border border-neutral-700">
                    {session.completedAt ? 'View Recipe Details' : 'Resume Cooking'}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
