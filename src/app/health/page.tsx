'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Heart, Brain, Activity } from 'lucide-react';

export default function Health() {
  const physicalBenefits = [
    'Improves cardiovascular health',
    'Enhances muscle strength',
    'Develops coordination and balance',
    'Encourages active lifestyle habits',
  ];

  const mentalBenefits = [
    'Reduces stress and anxiety',
    'Builds self-confidence',
    'Encourages teamwork and discipline',
    'Strengthens cultural identity',
  ];

  const routineSteps = [
    'Warm-up: Light stretching',
    'Webcam-based game activity',
    'Cool-down and breathing exercises',
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
                Wellness & Movement
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              Health & <span className="text-brand-red">Fitness</span> Benefits
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Galaw Pinoy promotes holistic health by combining physical movement,
              mental wellness, and cultural engagement through traditional Filipino games.
            </p>
          </motion.div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Physical Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 drop-shadow-md">
                Physical Benefits
              </h2>
              <ul className="list-none m-0 p-0 space-y-4">
                {physicalBenefits.map((benefit, index) => (
                  <li key={index} className="text-base md:text-lg text-white/95 font-body flex items-start gap-3">
                    <span className="text-brand-yellow text-2xl font-bold">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Mental and Social Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 drop-shadow-md">
                Mental and Social Benefits
              </h2>
              <ul className="list-none m-0 p-0 space-y-4">
                {mentalBenefits.map((benefit, index) => (
                  <li key={index} className="text-base md:text-lg text-white/95 font-body flex items-start gap-3">
                    <span className="text-brand-yellow text-2xl font-bold">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Activity Routine */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-5xl mx-auto pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center mb-6">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-4 drop-shadow-lg">
              Sample Activity Routine
            </h2>
            <h3 className="text-xl md:text-2xl font-display font-bold text-white/95 mb-8 drop-shadow-md">
              Galaw Pinoy 15-Minute Session
            </h3>
            <ol className="list-none m-0 p-0 space-y-4">
              {routineSteps.map((step, index) => (
                <li key={index} className="text-base md:text-lg text-white/95 font-body flex items-start gap-4">
                  <span className="text-brand-yellow font-bold text-2xl min-w-[32px] drop-shadow-md">
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </section>
      </main>
    </>
  );
}

