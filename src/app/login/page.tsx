'use client';

import Navigation from '@/components/Navigation';
import AuthButton from '@/components/auth/AuthButton';
import { motion } from 'framer-motion';

// Force dynamic rendering to avoid build-time Supabase env var requirement
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen flex flex-col justify-center items-center px-8 py-24 bg-brand-dark relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-[600px] h-[600px] bg-brand-blue rounded-full blur-3xl opacity-20"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              top: '20%',
              left: '-10%',
            }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] bg-brand-red rounded-full blur-3xl opacity-20"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              bottom: '10%',
              right: '-5%',
            }}
          />
        </div>
        <div className="relative z-10 max-w-md w-full px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture shadow-xl"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight tracking-tight text-white mb-4 text-center drop-shadow-lg">
              Sign in to save your Galaw Pinoy progress.
            </h1>
            <p className="text-base md:text-lg text-white/95 mb-8 text-center leading-relaxed font-body drop-shadow-md">
              Track your scores, calories burned, and game history by signing in with your Google account.
            </p>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
