'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import InfoCard from '@/components/laro/InfoCard';

export default function AgawanBase() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0">
        <div className="pt-28 px-6 md:px-8 max-w-7xl mx-auto">
          <Link 
            href="/laro" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white hover:translate-x-[-4px] transition-all duration-300 font-display uppercase tracking-wide text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Link>
        </div>

        {/* Hero Section */}
        <section className="min-h-[60vh] flex flex-col justify-center items-center text-center px-6 md:px-8 py-10 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl w-full"
          >
            <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-red">
              Traditional Filipino Game
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              Agawan <span className="text-brand-blue">Base</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              A fast-paced team game of speed, strategy, and teamwork where
              players defend their base while daring to capture the enemy’s.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 px-6 md:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard
            icon={Flag}
            title="Description"
            color="from-brand-red to-red-700"
          >
            Agawan Base is a classic outdoor Filipino team game where two groups
            guard their own base while attempting to touch the opponent’s base
            without being tagged. It transforms open spaces into energetic
            battlefields that build agility, strategy, and cooperation.
          </InfoCard>

          <InfoCard
            icon={History}
            title="History"
            color="from-brand-yellow to-yellow-600"
          >
            Passed down through generations, Agawan Base has long been played in
            schoolyards, beaches, and barangay streets. Its name comes from
            <strong> “agawan”</strong> (to grab) and <strong>“base”</strong>,
            reflecting its competitive goal of seizing territory.
          </InfoCard>

          <InfoCard
            icon={Users}
            title="Rules"
            color="from-brand-blue to-blue-700"
          >
            <ul className="list-disc list-inside space-y-2">
              <li>Two teams with equal players</li>
              <li>Each team guards a designated base</li>
              <li>Tagged players become prisoners</li>
              <li>Prisoners may be rescued by teammates</li>
            </ul>
          </InfoCard>

          <InfoCard
            icon={Activity}
            title="Gameplay"
            color="from-brand-red to-red-700"
          >
            <ul className="list-disc list-inside space-y-2">
              <li>Bases are placed 10–15 meters apart</li>
              <li>Players attack, defend, and retreat strategically</li>
              <li>The game ends when a base is captured</li>
            </ul>
          </InfoCard>
        </section>

        {/* Video Section */}
        <section className="py-16 px-6 md:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <PlayCircle className="w-6 h-6 text-brand-blue" />
              <h2 className="text-2xl font-display font-bold text-white">
                Gameplay Video
              </h2>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/vH5pVOAfLWw"
                title="Agawan Base Gameplay"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </section>

        {/* Gallery */}
        <section className="py-16 px-6 md:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-6 h-6 text-brand-yellow" />
              <h2 className="text-2xl font-display font-bold text-white">
                Gallery
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['agawanBase1.png', 'agawanBase2.jpg', 'agawanBase3.jpeg'].map((img, i) => (
                <motion.img
                  key={i}
                  src={`/images/${img}`}
                  alt={`Agawan Base ${i + 1}`}
                  className="rounded-3xl object-cover h-64 w-full hover:scale-105 transition-transform duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              ))}
            </div>
          </motion.div>
        </section>

        {/* References */}
        <section className="py-16 px-6 md:px-8 max-w-5xl mx-auto">
          <div className="card glass-modern rounded-3xl p-6 md:p-8 mb-4">
            <div className="card-body">
              <h2 className="card-title text-2xl font-display font-bold text-white mb-4">References</h2>
              <ul className="card-text list-disc list-inside space-y-2 text-white/90">
                <li>
                  <a href="https://www.scribd.com/document/526637336/Traditional-games-in-the-Philippines" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Scribd – Traditional Games in the Philippines (Agawan Base section)
                  </a>
                </li>
                <li>
                  <a href="https://www.scribd.com/doc/115441366/Agawan-Base" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Scribd – Agawan Base | PDF
                  </a>
                </li>
                <li>
                  <a href="https://www.studocu.com/ph/document/central-mindanao-university/physical-activities-towards-health-and-fitness-ii-path-fit-ii/pe-finals-4-5-mechanics-of-the-game-laro-ng-lahi/31242255" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Studocu / PATH-Fit – Mechanics and Rules of Agawan Base
                  </a>
                </li>
                <li>
                  <a href="https://www.studocu.com/ph/document/lyceum-of-the-philippines-university/physical-education/p-agawang-base-with-a-twist/37348539" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Studocu – Modified Agawang Base Game
                  </a>
                </li>
                <li>
                  <a href="http://larongbata.blogspot.com/2007/03/stealing-bases-agawan-base.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Larong Bata Blogspot – Stealing Bases (Agawan Base)
                  </a>
                </li>
                <li>
                  <a href="https://larong-pinoy.weebly.com/all-traditional-filipino-gamescompilation.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Weebly – All Traditional Filipino Games (Agawan Base section)
                  </a>
                </li>
                <li>
                  <a href="https://www.scribd.com/presentation/588202647/Agawan-Base" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-blue">
                    Slideshare – Agawan Base presentation
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
