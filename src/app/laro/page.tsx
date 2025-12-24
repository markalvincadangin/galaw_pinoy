'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Zap, Users, Target, Flame, Shield, Activity, Heart } from 'lucide-react';

export default function Laro() {
  const games = [
    {
      name: 'Luksong Baka',
      description: 'A jumping game that develops leg strength, balance, and courage.',
      icon: Zap,
      color: 'from-brand-blue to-blue-700',
    },
    {
      name: 'Luksong Tinik',
      description: 'Jump over hurdles moving down the screen! Manage stamina and perfect your timing across 5 progressive levels.',
      icon: Target,
      color: 'from-brand-yellow to-yellow-600',
    },
    {
      name: 'Patintero',
      description: 'Dodge blockers by moving left/right between three lanes. Collect power-ups and trigger Fever Mode for 2x score!',
      icon: Users,
      color: 'from-brand-red to-red-700',
    },
    {
      name: 'Piko',
      description: 'Balance on one leg and hop to target cells on a 3×5 grid. Complete all 15 cells to win!',
      icon: Activity,
      color: 'from-brand-blue to-blue-700',
    },
    {
      name: 'Tumbang Preso',
      description: 'Develops accuracy, speed, and agility.',
      icon: Shield,
      color: 'from-brand-yellow to-yellow-600',
    },
    {
      name: 'Agawan Base',
      description: 'Run in place with high knees to reach the enemy base at 50% distance! Beat the enemy in this HIIT workout.',
      icon: Flame,
      color: 'from-brand-red to-red-700',
    },
    {
      name: 'Langit-Lupa',
      description: 'React quickly to commands! Stand/Jump for LANGIT (Heaven) or Squat for LUPA (Earth). Reaction time gets faster each level.',
      icon: Heart,
      color: 'from-brand-blue to-blue-700',
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="min-h-[70vh] flex flex-col justify-center items-center text-center px-6 md:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl w-full px-4"
          >
            <div className="mb-6">
              <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-yellow">
                Traditional Games
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              Most Played <span className="text-brand-blue">Laro</span>{' '}
              <span className="text-brand-red">ng Lahi</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              These traditional games have been played for generations and continue to
              shape Filipino childhood and culture.
            </p>
          </motion.div>
        </section>

        {/* Games Grid */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-7xl mx-auto pb-20 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {games.map((game, index) => {
              const Icon = game.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass-modern rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group h-full flex flex-col"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white mb-2 sm:mb-3 drop-shadow-md">
                    {game.name}
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-white/90 m-0 leading-relaxed font-body flex-1">
                    {game.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}

