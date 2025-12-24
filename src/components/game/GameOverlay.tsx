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
      {/* Safe Zone: Top 20% on mobile, 15% on desktop - Score and Timer */}
      <div className="absolute top-0 left-0 right-0 h-[20%] md:h-[15%] flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-2 md:py-0 pointer-events-none gap-2 md:gap-0">
        {/* Score - Large, Transparent, Centered */}
        <motion.div
          className="flex-1 flex justify-center w-full md:w-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-full px-4 py-2 md:px-8 md:py-4 shadow-xl">
            <span className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-lg">
              {score}
            </span>
          </div>
        </motion.div>

        {/* Timer and Controls - Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          <motion.div
            className="backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-full px-4 py-2 md:px-6 md:py-3 shadow-xl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              {timer}
            </span>
          </motion.div>

          {/* Menu/Pause Button - Larger on mobile for touch */}
          <div className="pointer-events-auto">
            {isPaused ? (
              <button
                onClick={onPause}
                className="backdrop-blur-xl bg-white/10 border-2 border-white/20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center active:bg-white/20 transition-all duration-200 shadow-xl touch-manipulation"
                aria-label="Resume"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            ) : (
              <button
                onClick={onPause || onMenu}
                className="backdrop-blur-xl bg-white/10 border-2 border-white/20 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center active:bg-white/20 transition-all duration-200 shadow-xl touch-manipulation"
                aria-label={onPause ? 'Pause' : 'Menu'}
              >
                {onPause ? (
                  <Pause className="w-5 h-5 md:w-6 md:h-6 text-white" />
                ) : (
                  <Menu className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Instructions - Better mobile positioning */}
      {instruction && (
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none px-4 w-full max-w-[95vw]">
          <p
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold uppercase tracking-wide text-white text-center"
            style={{
              textShadow: '2px 2px 10px rgba(0, 0, 0, 0.95), -1px -1px 5px rgba(0, 0, 0, 0.95), 1px 1px 5px rgba(0, 0, 0, 0.95)',
              WebkitTextStroke: '1.5px rgba(0, 0, 0, 0.8)',
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
