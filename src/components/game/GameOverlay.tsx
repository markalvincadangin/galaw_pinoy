'use client';

import { Menu, Pause, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface GameOverlayProps {
  score: number;
  timer: number | string;
  instruction?: string;
  isPaused?: boolean;
  onPause?: () => void;
  onMenu?: () => void;
  feedback?: 'good' | 'miss' | null;
  className?: string;
}

export default function GameOverlay({
  score,
  timer,
  instruction = 'Jump now!',
  isPaused = false,
  onPause,
  onMenu,
  feedback = null,
  className,
}: GameOverlayProps) {
  return (
    <div className={clsx('absolute inset-0 z-30 pointer-events-none', className)}>
      {/* Safe Zone: Top 15% - Score and Timer */}
      <div className="absolute top-0 left-0 right-0 h-[15%] flex items-center justify-between px-6 pointer-events-none">
        {/* Score - Large, Transparent, Centered */}
        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-8 py-4 shadow-lg">
            <span className="font-display text-6xl md:text-7xl font-black text-white">
              {score}
            </span>
          </div>
        </motion.div>

        {/* Timer - Right Side */}
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-3 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="font-display text-2xl md:text-3xl font-bold text-white">
            {timer}
          </span>
        </motion.div>

        {/* Menu/Pause Button - Right */}
        <div className="pointer-events-auto ml-4">
          {isPaused ? (
            <button
              onClick={onPause}
              className="backdrop-blur-xl bg-white/5 border border-white/10 w-14 h-14 rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-200 shadow-lg"
              aria-label="Resume"
            >
              <Play className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={onPause || onMenu}
              className="backdrop-blur-xl bg-white/5 border border-white/10 w-14 h-14 rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-200 shadow-lg"
              aria-label={onPause ? 'Pause' : 'Menu'}
            >
              {onPause ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Bar - Instructions */}
      {instruction && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <p
            className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wide text-white text-center"
            style={{
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9), -1px -1px 4px rgba(0, 0, 0, 0.9), 1px 1px 4px rgba(0, 0, 0, 0.9)',
              WebkitTextStroke: '1px rgba(0, 0, 0, 0.7)',
            }}
          >
            {instruction}
          </p>
        </div>
      )}

      {/* Full-Screen Feedback Borders */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className={clsx(
              'absolute inset-0 border-8 pointer-events-none',
              feedback === 'good' ? 'border-brand-yellow' : 'border-brand-red'
            )}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: feedback === 'miss' ? [1, 1.02, 0.98, 1] : 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              times: [0, 0.1, 0.9, 1],
            }}
            style={{
              boxShadow:
                feedback === 'good'
                  ? 'inset 0 0 50px #FFD600, 0 0 50px rgba(255, 214, 0, 0.5)'
                  : 'inset 0 0 50px #FF0F39, 0 0 50px rgba(255, 15, 57, 0.5)',
            }}
          >
            {/* Shake animation for miss */}
            {feedback === 'miss' && (
              <motion.div
                className="absolute inset-0"
                animate={{
                  x: [0, -5, 5, -5, 5, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: 'easeInOut',
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
