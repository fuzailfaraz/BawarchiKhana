'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { FileUp, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function ImportFromDriveButton() {
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');

  const handleFetchFiles = async (query = '') => {
    setIsFetching(true);
    try {
      const data = await Api.get(`/google-drive/files${query ? `?q=${encodeURIComponent(query)}` : ''}`);
      setFiles(data.files || []);
      if (data.files && data.files.length === 0 && !query) {
        toast.error('No PDF files found in your Google Drive.');
      } else {
        setShowModal(true);
      }
    } catch (error: any) {
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
        toast.error(error.message || 'Failed to fetch files from Drive.');
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = async (fileId: string) => {
    setIsImporting(true);
    const toastId = toast.loading('Extracting recipe from PDF using AI...', {
      style: { background: '#1e1e1e', color: '#34d399', border: '1px solid #34d399' }
    });
    try {
      const data = await Api.post('/google-drive/import', { fileId });
      toast.success('Recipe imported successfully!', { id: toastId });
      setShowModal(false);
      router.push(`/recipe/${data.recipe.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import recipe.', { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => handleFetchFiles('')}
        disabled={isFetching}
        variant="outline"
        size="sm"
        className="gap-1.5 bg-white/5 border border-white/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-300 transition-all rounded-full py-1.5 px-4 h-auto backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
      >
        {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5 mr-1" />}
        {isFetching ? 'Fetching PDFs...' : 'Import PDF'}
      </Button>

      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-emerald-400" /> Select Recipe PDF
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white p-2">✕</button>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Search in your Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchFiles(searchQuery)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
              <Button 
                onClick={() => handleFetchFiles(searchQuery)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl"
              >
                Search
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {files.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">No PDFs found matching "{searchQuery}"</div>
              ) : (
                files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden pr-4">
                      <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-neutral-200 truncate">{file.name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleImport(file.id)}
                      disabled={isImporting}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex-shrink-0 rounded-lg px-4"
                    >
                      {isImporting ? '...' : 'Import'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
