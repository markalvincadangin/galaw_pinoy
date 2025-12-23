'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import KineticButton from '@/components/ui/KineticButton';
import { Zap, Users } from 'lucide-react';

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
              {/* Luksong Tinik Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center mb-6 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                  Luksong Tinik
                </h2>
                <p className="text-white/95 mb-8 font-body leading-relaxed">
                  Jump over virtual hurdles. Test your flexibility and coordination.
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
                  Dodge blockers and move through lanes. Build agility and reaction time.
                </p>
                <Link href="/play/patintero" className="block">
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

