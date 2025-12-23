'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import KineticButton from '@/components/ui/KineticButton';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark">
      {/* Enhanced Animated Gradient Mesh Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blue Blob - Trust, Movement */}
        <motion.div
          className="absolute w-[900px] h-[900px] bg-brand-blue rounded-full blur-3xl animate-pulse-glow"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            top: '15%',
            left: '-15%',
            opacity: 0.4,
          }}
        />
        {/* Red Blob - Energy, Strength */}
        <motion.div
          className="absolute w-[800px] h-[800px] bg-brand-red rounded-full blur-3xl animate-pulse-glow"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            bottom: '10%',
            right: '-10%',
            opacity: 0.35,
          }}
        />
        {/* Yellow Blob - Joy, Culture */}
        <motion.div
          className="absolute w-[600px] h-[600px] bg-brand-yellow rounded-full blur-3xl animate-pulse-glow"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            top: '45%',
            left: '45%',
            opacity: 0.25,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 text-center">
        {/* Website Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6"
        >
          <span className="text-sm md:text-base font-display font-bold uppercase tracking-[0.2em] text-brand-yellow">
            GALAW PINOY
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="text-6xl md:text-8xl lg:text-9xl font-display font-black uppercase leading-[0.9] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span
            className="block"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            GALAW
          </span>
          <span
            className="block mt-2"
            style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            KATAWAN
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <p className="text-2xl md:text-3xl lg:text-4xl font-display font-bold italic text-white/95 mb-2">
            <span className="text-brand-blue">Galaw</span>{' '}
            <span className="text-brand-yellow">Katawan.</span>
          </p>
          <p className="text-2xl md:text-3xl lg:text-4xl font-display font-bold italic text-white/95">
            <span className="text-brand-red">Buhay</span>{' '}
            <span className="text-brand-yellow">Kultura.</span>
          </p>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl lg:text-2xl text-white/95 mb-12 max-w-3xl mx-auto leading-relaxed font-body drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}
        >
          Reviving Laro ng Lahi for Health & Fitness
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
        >
          <Link href="/play">
            <KineticButton variant="primary" size="lg">
              START MOVING
            </KineticButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

