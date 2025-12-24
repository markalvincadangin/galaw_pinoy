'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Users, Heart, Activity, Flame, Target } from 'lucide-react';
import KineticButton from '@/components/ui/KineticButton';

type GameType = 'luksong-tinik' | 'patintero' | 'langit-lupa' | 'piko' | 'agawan-base';

interface GameMechanicsModalProps {
  gameType: GameType;
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

interface GameMechanics {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  objective: string;
  howToPlay: string[];
  features: string[];
  tips: string[];
}

const gameMechanicsData: Record<GameType, GameMechanics> = {
  'luksong-tinik': {
    title: 'Luksong Tinik',
    icon: Zap,
    color: 'text-brand-yellow',
    objective: 'Jump over hurdles that move down the screen! Perfect your timing to maximize your score.',
    howToPlay: [
      'Jump when hurdles approach the ground line',
      'Perfect timing (hurdle within 10% of ground) = Perfect jump',
      'Good timing (hurdle within 20% of ground) = Good jump',
      'Manage your stamina - jumping costs 20 stamina points',
      'Regenerate stamina by standing still (15 points/second)',
      'Need at least 30 stamina to jump',
      'Survive 5 levels with increasing difficulty!',
    ],
    features: [
      'Stamina management system',
      'Perfect/Good timing scoring',
      '5 progressive levels',
      '60-second timer per level',
      'Combo bonuses for perfect jumps',
    ],
    tips: [
      'Time your jumps carefully - perfect timing gives bonus points!',
      'Watch your stamina bar - rest when it gets low',
      'Higher levels mean faster hurdles - be ready!',
    ],
  },
  patintero: {
    title: 'Patintero',
    icon: Users,
    color: 'text-brand-red',
    objective: 'Dodge blockers by moving left or right between three lanes. Survive as long as possible!',
    howToPlay: [
      'Move your body left or right to switch lanes',
      'Three lanes: Left, Center, Right',
      'Avoid blockers moving down the lanes',
      'Dodge 10 consecutive blockers to trigger Fever Mode',
      'Fever Mode = 2x score multiplier!',
      'Collect power-ups that spawn randomly',
      'Shield: Protects from one hit (5 seconds)',
      'Slow Time: Slows blockers down (5 seconds)',
      'Speed increases over time for added challenge',
    ],
    features: [
      '3-lane dodging system',
      'Fever Mode with combo tracking',
      'Power-ups (Shield & Slow Time)',
      'Adaptive difficulty (speed increases)',
      'Rubber banding (protection after multiple hits)',
    ],
    tips: [
      'Anticipate blocker patterns - don\'t wait until the last second!',
      'Fever Mode doubles your score - try to maintain combos',
      'Use power-ups strategically - they can save you in tight spots',
    ],
  },
  'langit-lupa': {
    title: 'Langit Lupa',
    icon: Heart,
    color: 'text-brand-blue',
    objective: 'React quickly to commands! Stand/Jump for LANGIT (Heaven) or Squat for LUPA (Earth).',
    howToPlay: [
      'Watch for the command: LANGIT or LUPA',
      'LANGIT (Heaven) = Stand up or jump',
      'LUPA (Earth) = Squat down',
      'React within the time limit to score points',
      'Reaction time starts at 2 seconds',
      'Reaction time decreases by 100ms each level',
      'Level up every 5 points',
      'Minimum reaction time: 0.8 seconds',
    ],
    features: [
      'Fast-paced reaction game',
      'Two pose detection modes (Stand/Jump vs Squat)',
      'Progressive difficulty (faster reaction times)',
      'Level-based progression system',
      'Real-time reaction time tracking',
    ],
    tips: [
      'React quickly but accurately - wrong pose means no points!',
      'As levels increase, reaction time gets shorter - stay focused!',
      'Clear your space - you\'ll need room to jump and squat',
    ],
  },
  piko: {
    title: 'Piko',
    icon: Activity,
    color: 'text-purple-400',
    objective: 'Balance on one leg and hop to target cells on a 3×5 grid. Complete all cells to win!',
    howToPlay: [
      'Lift one foot to enter one-leg balance mode',
      'Hold your balance (0.5 second grace period)',
      'Hop to highlighted target cells on the grid',
      'Complete cells by landing on them',
      'Grid: 3 columns × 5 rows (15 cells total)',
      'Track your progress: X/15 cells completed',
      'Maintain balance - falling resets your progress',
    ],
    features: [
      'One-leg balance detection',
      'Grid-based progression (3×5 cells)',
      'Balance grace period system',
      'Pose physics analyzer for accurate detection',
      'Cell completion tracking',
    ],
    tips: [
      'Find a stable base - balance is key to success!',
      'Take your time with hops - precision over speed',
      'Practice holding one-leg balance before starting',
    ],
  },
  'agawan-base': {
    title: 'Agawan Base',
    icon: Flame,
    color: 'text-green-400',
    objective: 'Run in place with high knees to reach the enemy base at 50% distance before the enemy catches you!',
    howToPlay: [
      'Run in place by lifting your knees high',
      'Knee must be at least 10% higher than your hip',
      'Each knee lift moves you forward on the track',
      '300ms cooldown between knee lift detections',
      'Reach 50% distance to win (enemy base)',
      'Enemy moves toward you - if they reach 0%, you lose!',
      'Score based on distance traveled + time bonus',
      '100 point victory bonus for reaching the base',
    ],
    features: [
      'High knee running detection',
      'Enemy pursuit mechanics',
      'Distance-based progression',
      'Real-time position tracking',
      'HIIT-style workout (~8 calories/second)',
    ],
    tips: [
      'Lift those knees high - the higher, the better!',
      'Maintain a steady pace - consistency wins',
      'The enemy is catching up - don\'t slow down!',
    ],
  },
};

export default function GameMechanicsModal({
  gameType,
  isOpen,
  onClose,
  onContinue,
}: GameMechanicsModalProps): React.ReactElement | null {
  if (!isOpen) return null;

  const mechanics = gameMechanicsData[gameType];
  const Icon = mechanics.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative max-w-2xl w-full glass-modern rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 border-white/20 cultural-texture max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white/70 hover:text-white" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br flex-shrink-0 ${
            gameType === 'luksong-tinik' ? 'from-brand-yellow to-yellow-600' :
            gameType === 'patintero' ? 'from-brand-red to-red-700' :
            gameType === 'langit-lupa' ? 'from-brand-blue to-blue-700' :
            gameType === 'piko' ? 'from-purple-500 to-purple-700' :
            'from-green-500 to-green-700'
          }`}>
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-1 ${mechanics.color} break-words`}>
              {mechanics.title}
            </h2>
            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">
              Game Mechanics
            </p>
          </div>
        </div>

        {/* Objective */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-xs sm:text-sm font-display font-bold text-white/70 uppercase tracking-wider mb-2">
            Objective
          </h3>
          <p className="text-sm sm:text-base text-white/90 font-body leading-relaxed">
            {mechanics.objective}
          </p>
        </div>

        {/* How to Play */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow flex-shrink-0" />
            <span>How to Play</span>
          </h3>
          <ul className="space-y-2 sm:space-y-2.5">
            {mechanics.howToPlay.map((step, index) => (
              <li key={index} className="flex items-start gap-2 sm:gap-3 text-white/90 font-body">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-blue/30 text-brand-blue font-display font-bold text-xs sm:text-sm flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                <span className="text-sm sm:text-base leading-relaxed flex-1">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-display font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow flex-shrink-0" />
            <span>Features</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mechanics.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 sm:p-2.5 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/90 font-body">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-brand-yellow/10 border border-brand-yellow/30">
          <h3 className="text-xs sm:text-sm font-display font-bold text-brand-yellow uppercase tracking-wider mb-2">
            💡 Pro Tips
          </h3>
          <ul className="space-y-1.5 sm:space-y-2">
            {mechanics.tips.map((tip, index) => (
              <li key={index} className="text-white/90 font-body text-xs sm:text-sm leading-relaxed flex items-start gap-2">
                <span className="text-brand-yellow flex-shrink-0 mt-0.5">•</span>
                <span className="flex-1">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
          <KineticButton
            variant="ghost"
            size="md"
            onClick={onClose}
            className="flex-1 w-full sm:w-auto"
          >
            Cancel
          </KineticButton>
          <KineticButton
            variant="primary"
            size="md"
            onClick={onContinue}
            className="flex-1 w-full sm:w-auto"
          >
            Continue to Tutorial
          </KineticButton>
        </div>
      </motion.div>
    </div>
  );
}

