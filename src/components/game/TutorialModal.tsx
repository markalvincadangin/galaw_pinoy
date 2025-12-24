'use client';

import React from 'react';
import Lottie from 'lottie-react';
import { Play, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import jumpAnim from '@/assets/lottie/jump.json';
import dodgeAnim from '@/assets/lottie/dodge.json';
import squatAnim from '@/assets/lottie/squat.json';
import balanceAnim from '@/assets/lottie/balance.json';
import runAnim from '@/assets/lottie/run.json';

export type GameType = 'luksong-tinik' | 'patintero' | 'langit-lupa' | 'piko' | 'agawan-base';

interface TutorialModalProps {
  gameType: GameType;
  isOpen: boolean;
  onComplete: () => void;
  isChallengeComplete: boolean;
}

interface GameConfig {
  title: string;
  instruction: string;
  desc: string;
  color: string;
  anim: unknown; // Lottie animation data
}

const gameConfig: Record<GameType, GameConfig> = {
  'luksong-tinik': {
    title: 'Luksong Tinik',
    instruction: 'JUMP HIGH!',
    desc: 'Bend your knees and jump over the hurdle.',
    color: 'text-brand-blue',
    anim: jumpAnim,
  },
  patintero: {
    title: 'Patintero',
    instruction: 'DODGE SIDEWAYS!',
    desc: 'Move Left or Right to avoid blockers.',
    color: 'text-brand-yellow',
    anim: dodgeAnim,
  },
  'langit-lupa': {
    title: 'Langit Lupa',
    instruction: 'SQUAT DOWN!',
    desc: "Squat for 'Lupa' and Stand for 'Langit'.",
    color: 'text-brand-red',
    anim: squatAnim,
  },
  piko: {
    title: 'Piko',
    instruction: 'BALANCE ON ONE LEG!',
    desc: 'Lift one foot and hold balance to unlock.',
    color: 'text-purple-400',
    anim: balanceAnim,
  },
  'agawan-base': {
    title: 'Agawan Base',
    instruction: 'RUN IN PLACE!',
    desc: 'Lift your knees high to build speed.',
    color: 'text-green-400',
    anim: runAnim,
  },
};

/**
 * Tutorial Modal Component
 * Displays game instructions with Lottie animations
 * Holographic design with challenge completion status
 */
export default function TutorialModal({
  gameType,
  isOpen,
  onComplete,
  isChallengeComplete,
}: TutorialModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  const config = gameConfig[gameType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-md w-full bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className={`text-3xl font-display font-bold mb-2 ${config.color}`}>
            {config.title}
          </h2>
          <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">
            Mission Briefing
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-white/90 text-sm mb-6 font-body">
          {config.desc}
        </p>

        {/* Animation Stage */}
        <div className="relative bg-black/50 rounded-2xl overflow-hidden mb-6 h-64 flex items-center justify-center">
          <Lottie
            animationData={config.anim}
            loop={true}
            className="w-full h-full"
          />

          {/* Status Badge */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            {isChallengeComplete ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur-sm rounded-full border-2 border-green-400/50 shadow-lg"
              >
                <span className="text-white font-semibold text-sm">MOVEMENT VERIFIED!</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/90 backdrop-blur-sm rounded-full border-2 border-blue-400/50 shadow-lg">
                <span className="text-white font-semibold text-sm">Try the move above!</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="w-full py-4 px-6 rounded-xl font-display font-bold text-lg transition-all duration-200 bg-brand-yellow text-black shadow-lg hover:shadow-xl cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              START MISSION
            </span>
          </motion.button>

          {/* Info Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 text-white/60 text-xs justify-center"
          >
            <Info className="w-4 h-4" />
            <span>Practice the move, or click Start when ready.</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

