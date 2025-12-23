'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/home/HeroSection';
import KineticButton from '@/components/ui/KineticButton';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="pb-20 md:pb-0">
        {/* Hero Section */}
        <HeroSection />

        {/* Problem Statement */}
        <section className="py-20 md:py-28 px-6 md:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight tracking-tight text-white mb-6 drop-shadow-lg">
              Why Movement and Culture Matter Today
            </h2>
            <p className="text-lg md:text-xl text-white/95 leading-relaxed font-body">
              Many Filipino youth today live sedentary lifestyles due to prolonged
              screen time and limited physical activity. At the same time, traditional
              Filipino games are slowly being forgotten. Galaw Pinoy addresses both
              issues by using technology as a tool for movement and cultural awareness.
            </p>
          </motion.div>
        </section>

        {/* Advocacy Pillars */}
        <section className="py-20 md:py-28 px-6 md:px-8 max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-display font-bold leading-tight tracking-tight text-white text-center mb-16 drop-shadow-lg"
          >
            Our Advocacy Pillars
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Move Pillar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-modern rounded-3xl p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cultural-texture group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">Move</h3>
              <p className="text-base md:text-lg text-white/90 m-0 font-body leading-relaxed">
                Encourage physical activity through dynamic, body-based interaction.
              </p>
            </motion.div>

            {/* Preserve Pillar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-modern rounded-3xl p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cultural-texture group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">Preserve</h3>
              <p className="text-base md:text-lg text-white/90 m-0 font-body leading-relaxed">
                Revive traditional Filipino games and pass them on to the next generation.
              </p>
            </motion.div>

            {/* Engage Pillar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-modern rounded-3xl p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cultural-texture group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">Engage</h3>
              <p className="text-base md:text-lg text-white/90 m-0 font-body leading-relaxed">
                Use webcam-based activities to create fun and accessible movement experiences.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Featured Game */}
        <section className="py-20 md:py-28 px-6 md:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture hover:shadow-2xl transition-all duration-300"
          >
            <div className="mb-6">
              <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-yellow">
                Featured Game
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 drop-shadow-lg">
              Virtual Luksong Tinik
            </h2>
            <p className="text-lg md:text-xl text-white/95 mb-10 leading-relaxed font-body">
              Jump over a virtual line displayed on screen while your webcam tracks your
              movement. Levels increase in difficulty to simulate the traditional game.
            </p>
            <div className="flex justify-start">
              <Link href="/play">
                <KineticButton variant="primary" size="lg">
                  Try Virtual Luksong Tinik
                </KineticButton>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
