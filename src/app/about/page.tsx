'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

export default function About() {
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
                About Us
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              What is <span className="text-brand-blue">Galaw</span> <span className="text-brand-red">Pinoy</span>?
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Galaw Pinoy is a health and fitness advocacy that uses traditional Filipino
              games as a medium to encourage physical movement, cultural appreciation,
              and digital engagement.
            </p>
          </motion.div>
        </section>

        {/* Why This Advocacy */}
        <section className="py-16 md:py-15 px-6 md:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 cultural-texture"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
              Why This Advocacy Was Chosen
            </h2>
            <ul className="list-none m-0 p-0 space-y-3 sm:space-y-4">
              <li className="text-base sm:text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Physical inactivity among youth is increasing</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Cultural traditions are slowly fading</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Conventional exercise feels unengaging to many students</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Laro ng Lahi promotes movement, teamwork, and discipline</span>
              </li>
            </ul>
          </motion.div>
        </section>

        {/* Advocacy Objectives */}
        <section className="py-16 md:py-10 px-6 md:px-8 max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight tracking-tight text-white text-center mb-8 sm:mb-10 md:mb-12 drop-shadow-lg"
          >
            Advocacy Objectives
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300"
            >
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                General Objective
              </h3>
              <p className="text-base md:text-lg text-white/95 m-0 font-body leading-relaxed">
                To promote physical fitness while preserving Filipino cultural heritage
                through interactive digital experiences.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-modern rounded-3xl p-8 md:p-10 cultural-texture hover:shadow-2xl transition-all duration-300"
            >
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 drop-shadow-md">
                Specific Objectives
              </h3>
              <ul className="list-none m-0 p-0 space-y-3">
                <li className="text-base md:text-lg text-white/95 font-body flex items-start gap-2">
                  <span className="text-brand-yellow text-xl font-bold">•</span>
                  <span>Encourage regular physical activity</span>
                </li>
                <li className="text-base md:text-lg text-white/95 font-body flex items-start gap-2">
                  <span className="text-brand-yellow text-xl font-bold">•</span>
                  <span>Increase awareness of traditional Filipino games</span>
                </li>
                <li className="text-base md:text-lg text-white/95 font-body flex items-start gap-2">
                  <span className="text-brand-yellow text-xl font-bold">•</span>
                  <span>Integrate culture into modern fitness practices</span>
                </li>
                <li className="text-base md:text-lg text-white/95 font-body flex items-start gap-2">
                  <span className="text-brand-yellow text-xl font-bold">•</span>
                  <span>Demonstrate positive use of technology</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="py-10 md:py-10 px-6 md:px-8 max-w-5xl mx-auto pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-white mb-6 drop-shadow-lg">
              Target Audience
            </h2>
            <ul className="list-none m-0 p-0 space-y-4">
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>First- to fourth-year students in IT, Computer Science, and related technology programs seeking a healthy outlet to de-stress and maintain physical wellness.</span>
              </li>
              <li className="text-lg md:text-xl text-white/95 font-body flex items-start gap-3">
                <span className="text-brand-yellow text-2xl font-bold">•</span>
                <span>Members of IT-related organizations who want to strengthen teamwork and friendship through play.</span>
              </li>
            </ul>
          </motion.div>
        </section>
      </main>
    </>
  );
}

