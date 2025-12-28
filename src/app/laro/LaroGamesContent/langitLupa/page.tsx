'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import InfoCard from '@/components/laro/InfoCard';

export default function LangitLupa() {
  const galleryImages = ['langit1.jpg', 'langit2.jpg', 'langit3.jpg'];

  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0 px-6 md:px-8">
        <div className="pt-28 px-4 max-w-7xl mx-auto">
          <Link 
            href="/laro" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white hover:translate-x-[-4px] transition-all duration-300 font-display uppercase tracking-wide text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Link>
        </div>

        {/* Hero Section */}
        <section className="min-h-[60vh] flex flex-col justify-center items-center text-center py-10 md:py-20">
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
              Langit-<span className="text-brand-blue">Lupa</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              A classic Filipino chasing game where players run on the ground (lupa) while trying to reach safe elevated spots (langit), turning any open space into a playful battlefield.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard icon={Flag} title="Description" color="from-brand-red to-red-700">
            <em>
              Langit-Lupa is a traditional Filipino chasing game where children run on the ground (lupa) while trying to reach safe elevated spots (langit) to avoid being tagged by the “it” or taya.
            </em>
          </InfoCard>

          <InfoCard icon={History} title="History" color="from-brand-yellow to-yellow-600">
            Langit-Lupa has been played for generations in Philippine schoolyards, backyards, and barangay streets, passed down informally from older kids to younger ones. The terms langit (heaven) and lupa (earth) reflect resourcefulness and community-based play.
          </InfoCard>

          <InfoCard icon={Users} title="Rules" color="from-brand-blue to-blue-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Players: At least 3 children; one becomes the taya (“it”) and the rest are runners.</li>
              <li>Objective: The taya must tag a runner on the ground (lupa). Players on elevated ground (langit) are safe and cannot be tagged.</li>
              <li>When tagged on lupa, that player becomes the new taya; the game continues following the same rule.</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Activity} title="Step-by-Step Gameplay" color="from-brand-red to-red-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Choose the taya using a chant (e.g., “Langit, lupa, impyerno…”) or jack-en-poy (rock–paper–scissors).</li>
              <li>Mark the playing area and identify safe langit spots such as benches, steps, rocks, or low walls.</li>
              <li>All runners start on lupa while the taya stands near the center and may recite the chant before starting.</li>
              <li>Runners try to reach langit spots while the taya chases and tags anyone still on lupa.</li>
              <li>A tagged runner becomes the new taya; repeat as long as players want.</li>
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
                src="https://www.youtube.com/embed/mz8tFQuy338"
                title="Langit-Lupa Gameplay Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
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
                  alt={`Langit-Lupa ${i + 1}`}
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
              <li><a href="https://www.studocu.com/ph/document/central-luzon-state-university/introduction-to-guidance-and-counseling/langit-lupa-a-guide-to-the-classic-filipino-game/132222258" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">Studocu – Langit Lupa: A Guide to the Classic Filipino Game</a></li>
              <li><a href="https://gamingph.com/2025/08/langit-lupa-a-beloved-traditional-filipino-game/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">GamingPH – Langit Lupa: A Beloved Traditional Filipino Game</a></li>
              <li><a href="https://www.scribd.com/document/844454338/Romeo-and-Juliet" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">Studocu – Langit Lupa: Traditional Filipino Game</a></li>
              <li><a href="https://www.studocu.com/ph/document/university-of-baguio/organic-chemistry/langit-lupa-game-mechanics-and-rules-group-7-guide/147171168" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">Scribd – Langit Lupa Game Mechanics and Rules</a></li>
              <li><a href="https://globalnation.inquirer.net/182162/15-filipino-games-to-play-this-national-childrens-month" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">Inquirer.net – 15 Filipino games (Langit-Lupa section)</a></li>
            </ul>
          </motion.div>
        </section>
      </main>
    </>
  );
}

