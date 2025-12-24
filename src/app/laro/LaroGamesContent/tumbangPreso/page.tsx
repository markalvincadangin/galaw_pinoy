'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon } from 'lucide-react';
import InfoCard from '../InfoCard/page';

export default function TumbangPreso() {
  const galleryImages = ['tumbangpreso1.jpg', 'tumbangpreso2.jpg', 'tumbangpreso3.jpg'];

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
            <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-red">
              Traditional Filipino Game
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
              <span className="text-brand-blue">Tumbang Preso</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Tumbang preso, which translates to "knock down the prisoner," is a traditional Filipino children's game enjoyed in groups and in the streets.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard icon={Flag} title="Short Description" color="from-brand-red to-red-700">
            <em>
              Tumbang preso, also known as Presohan in Luzon and Tumba-Patis/Tumba-Lata in Visayas, is a game enjoyed in groups in the streets.
            </em>
          </InfoCard>

          <InfoCard icon={History} title="History" color="from-brand-yellow to-yellow-600">
            Even though Tumbang Preso is a native Filipino game, there is no exact origin date. Some suspect it developed during the Spanish colonial period (1569-1898). Its popularity has been passed down generations and still captures the interest of children and adults today.
          </InfoCard>

          <InfoCard icon={Users} title="Rules" color="from-brand-blue to-blue-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Players must have slippers. The slippers serve as throwing objects to hit the can precisely.</li>
              <li>The It and the hitter must never cross into each other's zones unless under specific conditions.</li>
              <li>Every hitter must throw their slipper; otherwise, they become It in the next round.</li>
              <li>If all players miss the can and none are in the player zone with slippers, It ticks the can three times.</li>
              <li>It will never tag a player if the can is knocked out.</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Activity} title="Step-by-Step Gameplay" color="from-brand-red to-red-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Each hitter takes a turn tossing their sandal toward the can zone to knock it out.</li>
              <li>Each hitter crosses the toe line to retrieve their sandal. The tayá waits until the hitter touches the sandal before attempting to tag them.</li>
              <li>The tayá tries to tag a hitter to become It in the next round. Once another person becomes tayá, the first one returns to being a hitter.</li>
              <li>Play as many rounds as desired; there is no single winner.</li>
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
                src="https://www.youtube.com/embed/b1oK0Uh4a24"
                title="Tumbang Preso Gameplay Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <small className="text-white/70 mt-2 block">
              Demonstration of Tumbang Preso gameplay
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
                  alt={`Tumbang Preso ${i + 1}`}
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
                <a href="https://www.studocu.com/ph/document/university-of-the-immaculate-conception/java/tumbang-preso-history-report/41369390" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">
                  Tumbang Preso: A Cultural History of the Traditional Filipino Game
                </a>
              </li>
              <li>
                <a href="https://kami.com.ph/112149-how-play-tumbang-preso-philippines.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">
                  How to play Tumbang Preso in Philippines
                </a>
              </li>
              <li>
                <a href="https://www.wikihow.com/Tumbang-Preso" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-yellow">
                  How to Play Tumbang Preso: Rules, Variations & History
                </a>
              </li>
            </ul>
          </motion.div>
        </section>
      </main>
    </>
  );
}

