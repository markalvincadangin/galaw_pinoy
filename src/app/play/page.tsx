'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import KineticButton from '@/components/ui/KineticButton';
import { Zap, Users, Heart, Activity, Flame } from 'lucide-react';

export default function Play() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0">
        <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 md:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-6">
              <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-yellow">
                Choose Your Game
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              <span className="text-brand-blue drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">Galaw</span>{' '}
              <span className="text-brand-red drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]">Pinoy</span>
            </h1>
            <p className="text-lg md:text-xl text-white/95 mb-16 max-w-2xl mx-auto font-body drop-shadow-md">
              Step back until your full body is visible on camera. Ready to move?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {/* Luksong Tinik Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                  Luksong Tinik
                </h2>
                <p className="text-white/95 mb-8 font-body leading-relaxed">
                  Jump over hurdles moving down the screen! Manage your stamina system and perfect your timing across 5 progressive levels.
                </p>
                <Link href="/play/luksong-tinik" className="block">
                  <KineticButton variant="primary" size="md" className="w-full">
                    Play Now
                  </KineticButton>
                </Link>
              </motion.div>

              {/* Patintero Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                  Patintero
                </h2>
                <p className="text-white/95 mb-8 font-body leading-relaxed">
                  Dodge blockers by moving left/right between three lanes. Collect power-ups, trigger Fever Mode for 2x score, and survive as long as possible!
                </p>
                <Link href="/play/patintero" className="block">
                  <KineticButton variant="danger" size="md" className="w-full">
                    Play Now
                  </KineticButton>
                </Link>
              </motion.div>

              {/* Langit-Lupa Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                  Langit-Lupa
                </h2>
                <p className="text-white/95 mb-8 font-body leading-relaxed">
                  React quickly to commands! Stand/Jump for LANGIT (Heaven) or Squat for LUPA (Earth). Reaction time gets faster each level.
                </p>
                <Link href="/play/langit-lupa" className="block">
                  <KineticButton variant="primary" size="md" className="w-full">
                    Play Now
                  </KineticButton>
                </Link>
              </motion.div>

              {/* Piko Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                  Piko
                </h2>
                <p className="text-white/95 mb-8 font-body leading-relaxed">
                  Balance on one leg and hop to target cells on a 3×5 grid. Complete all 15 cells to win!
                </p>
                <Link href="/play/piko" className="block">
                  <KineticButton variant="primary" size="md" className="w-full">
                    Play Now
                  </KineticButton>
                </Link>
              </motion.div>

              {/* Agawan Base Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                  Agawan Base
                </h2>
                <p className="text-white/95 mb-8 font-body leading-relaxed">
                  Run in place with high knees to reach the enemy base at 50% distance! Beat the enemy before they catch you in this HIIT workout.
                </p>
                <Link href="/play/agawan-base" className="block">
                  <KineticButton variant="danger" size="md" className="w-full">
                    Play Now
                  </KineticButton>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}

