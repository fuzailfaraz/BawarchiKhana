'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FileDown, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Api } from '@/lib/api';

interface ExportToDriveButtonProps {
  recipeId: string;
  recipeName?: string;
}

export function ExportToDriveButton({ recipeId, recipeName }: ExportToDriveButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const data = await Api.post('/google-drive/export-recipe', { recipeId });
      
      setExported(true);
      
      toast.success(
        <div>
          <p className="font-semibold">Exported to Google Drive!</p>
          <a 
            href={data.driveLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-600 underline"
          >
            Open in Drive →
          </a>
        </div>,
        { duration: 5000 }
      );
      
    } catch (error: any) {
      console.error('Export error:', error);
      if (error.message && error.message.includes('not connected')) {
         toast.error(
          <div>
            <p className="font-semibold">Google Drive not connected</p>
            <button 
              onClick={() => window.location.href = '/profile?connect_drive=true'}
              className="text-emerald-600 underline"
            >
              Connect in Profile →
            </button>
          </div>
        );
      } else {
        toast.error(error.message || 'Failed to export. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || exported}
      variant="outline"
      className="gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
    >
      {exported ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Exported
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export to Drive'}
        </>
      )}
    </Button>
  );
}

export function ExportToSheetsButton({ recipeId, recipeName }: ExportToDriveButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading(`Exporting ${recipeName} to Sheets...`, {
      style: { background: '#1e1e1e', color: '#10b981', border: '1px solid #10b981' }
    });

    try {
      const data = await Api.post('/google-drive/export-sheet', { recipeId });
      toast.success(
        <div>
          <p className="font-bold mb-1">Exported successfully!</p>
          <a href={data.driveLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline text-sm">
            Open Google Sheet
          </a>
        </div>, 
        { id: toastId, duration: 8000 }
      );
    } catch (error: any) {
      if (error.message && error.message.includes('not connected')) {
         toast.error(
          <div>
            <p className="font-semibold">Google Drive not connected</p>
            <button onClick={() => window.location.href = '/profile?connect_drive=true'} className="text-emerald-400 underline">
              Connect in Profile →
            </button>
          </div>,
          { id: toastId, duration: 6000 }
        );
      } else {
        toast.error(error.message || 'Failed to export to Google Sheets.', { id: toastId });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 backdrop-blur-md rounded-2xl"
    >
      {isExporting ? <span className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full" /> : <span className="font-serif">📄</span>}
      {isExporting ? 'Exporting...' : 'Export to Sheets'}
    </Button>
  );
}
