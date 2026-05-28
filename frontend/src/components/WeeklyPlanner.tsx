'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Calendar, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Api } from '@/lib/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WeeklyPlanner({ ingredients }: { ingredients: any[] }) {
  const [plan, setPlan] = useState<Record<string, { lunch: string, dinner: string }>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('bk_meal_plan');
    if (saved) {
      try { setPlan(JSON.parse(saved)); } catch (e) {}
    } else {
      const emptyPlan: Record<string, { lunch: string, dinner: string }> = {};
      DAYS.forEach(d => emptyPlan[d] = { lunch: '', dinner: '' });
      setPlan(emptyPlan);
    }
  }, []);

  const savePlan = (newPlan: any) => {
    setPlan(newPlan);
    localStorage.setItem('bk_meal_plan', JSON.stringify(newPlan));
  };

  const handleUpdate = (day: string, type: 'lunch' | 'dinner', value: string) => {
    savePlan({ ...plan, [day]: { ...plan[day], [type]: value } });
  };

  const handleAutoFill = async () => {
    if (ingredients.length < 2) {
      toast.error('Add more ingredients to your fridge first!');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('AI is planning your week...');
    try {
      const response = await Api.post('/ai/meal-plan', { 
        ingredients: ingredients.map(i => i.name) 
      });
      savePlan(response.plan);
      toast.success('Meal plan generated!', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to generate meal plan.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading('Exporting to Sheets...');
    try {
      const res = await Api.post('/google-drive/export-weekly-plan', { plan });
      toast.success(
        <div>
          <p className="font-bold mb-1">Exported successfully!</p>
          <a href={res.driveLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline text-sm">
            Open Google Sheet
          </a>
        </div>, 
        { id: toastId, duration: 8000 }
      );
    } catch (err: any) {
      toast.error('Failed to export. Is Drive connected?', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-2xl border border-white/5 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-2xl font-black font-heading text-white flex items-center gap-2">
          <Calendar className="text-emerald-400" /> Weekly Planner
        </h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleAutoFill} 
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform border-none font-bold rounded-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Auto-fill AI
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={exporting}
            size="sm"
            variant="outline"
            className="bg-white/5 border border-white/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all rounded-full"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 relative z-10">
        {DAYS.map(day => (
          <div key={day} className="bg-black/40 rounded-2xl p-4 border border-white/5">
            <h3 className="font-bold text-emerald-400 mb-3 text-sm uppercase tracking-wider">{day}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-500 w-12">LUNCH</span>
                <input 
                  type="text" 
                  value={plan[day]?.lunch || ''} 
                  onChange={e => handleUpdate(day, 'lunch', e.target.value)}
                  placeholder="e.g. Daal Chawal"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-500 w-12">DINNER</span>
                <input 
                  type="text" 
                  value={plan[day]?.dinner || ''} 
                  onChange={e => handleUpdate(day, 'dinner', e.target.value)}
                  placeholder="e.g. Chicken Karahi"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
