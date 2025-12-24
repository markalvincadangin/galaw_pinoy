'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { FileText, Video, Camera, CheckCircle, Code, Users, Award } from 'lucide-react';

export default function Proof() {
  const implementationItems = [
    { icon: Code, text: 'Website planning and content design' },
    { icon: Video, text: 'Development of interactive webcam-based features' },
    { icon: Users, text: 'Actual physical participation using Laro ng Lahi' },
  ];

  const evidenceItems = [
    { icon: Video, text: 'Screen recordings of gameplay sessions' },
    { icon: Camera, text: 'Webcam footage showing physical movement' },
    { icon: FileText, text: 'Screenshots with timestamps' },
    { icon: CheckCircle, text: 'Final advocacy documentation video' },
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
                Project Documentation
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              Proof & <span className="text-brand-blue">Documentation</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              This page documents the planning, implementation, and actual participation
              involved in the Galaw Pinoy advocacy.
            </p>
          </motion.div>
        </section>

        {/* Documentation Grid */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Implementation Overview */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 drop-shadow-md">
                Implementation Overview
              </h2>
              <ul className="list-none m-0 p-0 space-y-4">
                {implementationItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={index} className="text-base md:text-lg text-white/95 font-body flex items-start gap-3">
                      <Icon className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Evidence Provided */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 drop-shadow-md">
                Evidence Provided
              </h2>
              <ul className="list-none m-0 p-0 space-y-4">
                {evidenceItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={index} className="text-base md:text-lg text-white/95 font-body flex items-start gap-3">
                      <Icon className="w-6 h-6 text-brand-yellow flex-shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Documentation Notes */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-5xl mx-auto pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-6 drop-shadow-lg">
              Documentation Notes
            </h2>
            <p className="text-base md:text-lg text-white/95 leading-relaxed font-body m-0">
              All evidence materials are collected to demonstrate real participation,
              ethical use of technology, and alignment with the goals of the advocacy.
            </p>
          </motion.div>
        </section>
      </main>
    </>
  );
}

