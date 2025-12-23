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
        backgroundColor: '#ffffff',
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
            className="bg-gradient-to-br from-blue-50 to-white border-4 border-blue-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: '400px', minHeight: '600px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6 text-center flex-shrink-0">
              <h2 className="text-2xl font-bold tracking-wide">Galaw Pinoy Champion</h2>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center justify-center flex-1 py-12 px-6">
              {/* Score */}
              <div className="mb-8 text-center">
                <div className="text-7xl font-bold text-blue-600 mb-2 leading-none">{score}</div>
                <div className="text-lg text-neutral-600">Points</div>
              </div>

              {/* Calories */}
              <div className="bg-blue-50 rounded-xl p-6 w-full max-w-xs border-2 border-blue-100 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{calories}</div>
                  <div className="text-base text-neutral-700 font-medium">Calories Burned</div>
                </div>
              </div>

              {/* Reflection Input */}
              <form onSubmit={handleReflectionSubmit} className="w-full max-w-xs">
                <label htmlFor="reflection" className="block text-sm font-medium text-neutral-700 mb-2">
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
                    className="flex-1 px-4 py-2 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-neutral-100 disabled:cursor-not-allowed text-neutral-900"
                    maxLength={50}
                  />
                  <button
                    type="submit"
                    disabled={!reflection.trim() || isSubmittingReflection}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                  >
                    {isSubmittingReflection ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Press Enter to submit</p>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-neutral-100 border-t-2 border-neutral-200 py-4 px-6 text-center flex-shrink-0">
              <p className="text-sm text-neutral-600 font-medium">
                Beat my score at{' '}
                <span className="text-blue-600 font-semibold">galaw-pinoy.vercel.app</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 justify-center">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
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
                className="px-8 py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
