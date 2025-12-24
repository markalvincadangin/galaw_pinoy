'use client';

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { saveGameResult } from '@/app/actions/game';
import { submitReflection } from '@/app/actions';
import { Toast } from '@/components/ui/Toast';

interface ResultModalProps {
  score: number;
  calories: number;
  gameType: string; // e.g., 'luksong-tinik' or 'patintero'
  onClose?: () => void;
}

export default function ResultModal({ score, calories, gameType, onClose }: ResultModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [reflection, setReflection] = useState('');
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [toast, setToast] = useState<{ id: string; message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  // Save game result on mount (optimistic UI - score shows immediately)
  useEffect(() => {
    const saveResult = async () => {
      try {
        const result = await saveGameResult(gameType, score, calories);
        if (!result.success) {
          console.warn('Failed to save game result:', result.message);
          // Don't show error toast - user can still see their score
        }
      } catch (error) {
        console.error('Error saving game result:', error);
        // Don't block UI if save fails
      }
    };

    saveResult();
  }, [gameType, score, calories]);

  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsSharing(true);
    try {
      // Capture the card element as an image
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0F172A', // brand-dark
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          setIsSharing(false);
          return;
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'galaw-pinoy-result.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsSharing(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing image:', error);
      setIsSharing(false);
    }
  };

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reflection.trim()) {
      return;
    }

    setIsSubmittingReflection(true);
    
    try {
      const formData = new FormData();
      formData.append('content', reflection.trim());

      const result = await submitReflection(formData);
      
      if (result.success) {
        setReflection('');
        setToast({
          id: Date.now().toString(),
          message: 'Reflection Saved!',
          type: 'success',
        });
        // Clear toast after 3 seconds
        setTimeout(() => {
          setToast(null);
        }, 3000);
      } else {
        setToast({
          id: Date.now().toString(),
          message: result.message || 'Failed to save reflection',
          type: 'error',
        });
        setTimeout(() => {
          setToast(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting reflection:', error);
      setToast({
        id: Date.now().toString(),
        message: 'Failed to save reflection. Please try again.',
        type: 'error',
      });
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReflectionSubmit(e);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        {/* Trading Card */}
        <div className="relative">
          {/* Card Container - This is what gets captured */}
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-brand-dark via-brand-dark to-slate-900 border-4 border-brand-blue rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: '400px', minHeight: '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-blue to-blue-600 text-white py-6 px-6 text-center flex-shrink-0">
              <h2 className="text-2xl font-display font-bold tracking-wide uppercase">Galaw Pinoy Champion</h2>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center justify-center flex-1 py-12 px-6 bg-brand-dark">
              {/* Score */}
              <div className="mb-8 text-center">
                <div className="text-7xl font-display font-black text-brand-yellow mb-2 leading-none drop-shadow-lg">{score}</div>
                <div className="text-lg text-white/80 font-body">Points</div>
              </div>

              {/* Calories */}
              <div className="glass-modern rounded-xl p-6 w-full max-w-xs border-2 border-white/10 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-brand-red mb-2 drop-shadow-md">{calories}</div>
                  <div className="text-base text-white/80 font-body font-medium">Calories Burned</div>
                </div>
              </div>

              {/* Reflection Input */}
              <form onSubmit={handleReflectionSubmit} className="w-full max-w-xs">
                <label htmlFor="reflection" className="block text-sm font-medium text-white/95 mb-2 font-body">
                  One word to describe this workout?
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    id="reflection"
                    type="text"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., Energizing, Fun, Challenging..."
                    disabled={isSubmittingReflection}
                    className="flex-1 px-4 py-2 bg-white/10 border-2 border-white/20 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/50 disabled:bg-white/5 disabled:cursor-not-allowed text-white placeholder:text-white/50 font-body"
                    maxLength={50}
                  />
                  <button
                    type="submit"
                    disabled={!reflection.trim() || isSubmittingReflection}
                    className="px-4 py-2 bg-brand-blue hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold font-display uppercase tracking-wide rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                  >
                    {isSubmittingReflection ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/60 mt-1 font-body">Press Enter to submit</p>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-white/5 border-t-2 border-white/10 py-4 px-6 text-center flex-shrink-0">
              <p className="text-sm text-white/80 font-body font-medium">
                Beat my score at{' '}
                <span className="text-brand-yellow font-semibold">galaw-pinoy.vercel.app</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="px-8 py-3 bg-brand-blue hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold font-display uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.11 2.154a3 3 0 100 4.952l4.11 2.154a3 3 0 10.895-1.789l-4.11-2.154a3.028 3.028 0 000-.74l4.11-2.154A3 3 0 0015 8z" />
                  </svg>
                  Share
                </>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold font-display uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border border-white/20"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
