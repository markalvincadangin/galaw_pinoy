'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import useSound from 'use-sound';

export type FeedbackType = 'perfect' | 'good' | 'miss' | 'wobbly' | 'stable';

interface FeedbackState {
  type: FeedbackType | null;
  key: number;
}

/**
 * Game feedback hook for audio/visual feedback
 * Provides screen flashes, shakes, and sound effects
 */
export function useGameFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, key: 0 });
  const [screenShake, setScreenShake] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(5); // Default 5px, increased to 10px for 'miss'
  const [screenFlash, setScreenFlash] = useState<{ color: string; opacity: number } | null>(null);
  
  // Sound effects with preloading for instant playback
  // All sounds are preloaded to ensure instant playback on triggers
  const [playPerfect] = useSound('/sounds/ting.mp3', { volume: 0.5, preload: true });
  const [playGood] = useSound('/sounds/ding.mp3', { volume: 0.4, preload: true });
  const [playMiss] = useSound('/sounds/buzzer.mp3', { volume: 0.6, preload: true });
  
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFeedback = useCallback((type: FeedbackType) => {
    // Set feedback popup
    setFeedback({ type, key: Date.now() });
    
    // Auto-dismiss after 2 seconds
    setTimeout(() => {
      setFeedback({ type: null, key: Date.now() });
    }, 2000);

    // Play sound effects
    switch (type) {
      case 'perfect':
        playPerfect();
        // Gold flash
        setScreenFlash({ color: '#fbbf24', opacity: 0.3 });
        // Slight shake (5px)
        setShakeIntensity(5);
        setScreenShake(true);
        break;
      case 'good':
        playGood();
        // Green flash
        setScreenFlash({ color: '#22c55e', opacity: 0.2 });
        break;
      case 'miss':
        playMiss();
        // Red flash
        setScreenFlash({ color: '#ef4444', opacity: 0.3 });
        // Strong shake (increased from 5px to 10px)
        setShakeIntensity(10);
        setScreenShake(true);
        break;
      case 'wobbly':
        // Orange flash
        setScreenFlash({ color: '#f59e0b', opacity: 0.2 });
        break;
      case 'stable':
        // Blue flash
        setScreenFlash({ color: '#3b82f6', opacity: 0.2 });
        break;
    }

    // Clear flash after animation
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = setTimeout(() => {
      setScreenFlash(null);
    }, 300);

    // Clear shake after animation
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setScreenShake(false);
    }, 500);
  }, [playPerfect, playGood, playMiss]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

  return {
    feedback,
    screenShake,
    shakeIntensity, // Shake intensity in pixels (5px default, 10px for 'miss')
    screenFlash,
    triggerFeedback,
  };
}

/**
 * Feedback popup component
 */
export function FeedbackPopup({ feedback }: { feedback: FeedbackState }): React.ReactElement | null {
  if (!feedback.type) return null;

  const config = {
    perfect: { text: 'PERFECT!', color: 'from-yellow-400 to-yellow-600', textColor: 'text-yellow-900' },
    good: { text: 'GOOD!', color: 'from-green-400 to-green-600', textColor: 'text-green-900' },
    miss: { text: 'MISS!', color: 'from-red-400 to-red-600', textColor: 'text-red-900' },
    wobbly: { text: 'WOBBLY!', color: 'from-orange-400 to-orange-600', textColor: 'text-orange-900' },
    stable: { text: 'STABLE!', color: 'from-blue-400 to-blue-600', textColor: 'text-blue-900' },
  };

  const style = config[feedback.type];

  return (
    <motion.div
      key={feedback.key}
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.5, y: -100 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        duration: 0.5 
      }}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
    >
      <div
        className={`px-8 py-4 rounded-2xl font-display font-bold text-4xl md:text-5xl drop-shadow-2xl bg-gradient-to-r ${style.color} ${style.textColor}`}
        style={{
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        }}
      >
        {style.text}
      </div>
    </motion.div>
  );
}

