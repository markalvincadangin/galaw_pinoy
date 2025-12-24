'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon } from 'lucide-react';
import InfoCard from '../InfoCard/page';

export default function Patintero() {
  const galleryImages = ['patintero1.jpg', 'patintero2.jpg', 'patintero3.jpg'];

  return (
    <>
      <Navigation />

      <main className="min-h-screen pb-20 md:pb-0 px-6 md:px-8">
        {/* Hero Section */}
        <section className="min-h-[70vh] flex flex-col justify-center items-center text-center py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl w-full"
          >
            <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-yellow">
              Traditional Filipino Game
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              <span className="text-brand-blue">Patintero</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              The most popular Filipino street game, involving two teams: one trying to cross a grid and the other trying to block them.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard icon={Flag} title="Description" color="from-brand-red to-red-700">
            <em>The most popular Filipino street game, involving two teams: one trying to cross a grid and the other trying to block them.</em>
          </InfoCard>

          <InfoCard icon={History} title="History" color="from-brand-yellow to-yellow-600">
            Derived from the Spanish word <em>tinte</em> (ink/tint), referring to the lines drawn on the ground. It is also known as <em>Tubigan</em> because lines were often drawn by pouring water on dusty soil.
          </InfoCard>

          <InfoCard icon={Users} title="Rules" color="from-brand-blue to-blue-700">
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Taggers</strong>: Must stay on their assigned lines.</li>
              <li><strong>The Patotot</strong>: Leader of taggers, can move along both the horizontal and middle vertical line.</li>
              <li><strong>Scoring</strong>: Runners earn points by reaching the far end and returning without being tagged.</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Activity} title="Step-by-Step Gameplay" color="from-brand-red to-red-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Draw a rectangular grid (usually 3x2 squares).</li>
              <li>The "It" team guards the lines; the "Runners" stand at the entrance.</li>
              <li>Runners try to dodge through the squares.</li>
              <li>If a runner is tagged by a guard with both feet on the line, that player is "out".</li>
            </ul>
          </InfoCard>
        </section>

        {/* Video Section */}
        <section className="py-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <PlayCircle className="w-6 h-6 text-brand-blue" />
              <h2 className="text-2xl font-display font-bold text-white">Gameplay Video</h2>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/JXEbn9iubic"
                title="Patintero Gameplay Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <small className="text-white/70 mt-2 block">
              Demonstration of traditional Patintero gameplay
            </small>
          </motion.div>
        </section>

        {/* Gallery */}
        <section className="py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-6 h-6 text-brand-yellow" />
              <h2 className="text-2xl font-display font-bold text-white">Gallery</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {galleryImages.map((img, i) => (
                <motion.img
                  key={i}
                  src={`/images/${img}`}
                  alt={`Patintero ${i + 1}`}
                  className="rounded-3xl object-cover h-64 w-full hover:scale-105 transition-transform duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* References */}
        <section className="py-16 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-6 md:p-8"
          >
            <h2 className="text-2xl font-display font-bold text-white mb-4">References</h2>
            <ul className="text-white/90 list-disc list-inside space-y-2">
              <li>
                <a
                  href="https://www.scribd.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Scribd – Patintero Mechanics
                </a>
              </li>
            </ul>
          </motion.div>
        </section>
      </main>
    </>
  );
}

