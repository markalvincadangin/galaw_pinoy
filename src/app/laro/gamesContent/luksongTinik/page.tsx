'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon } from 'lucide-react';
import InfoCard from '../InfoCard/page';

export default function LuksongTinik() {
  const galleryImages = ['luksongtinik1.jpeg', 'luksongtinik2.jpg', 'luksongtinik3.jpg'];

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
              <span className="text-brand-blue">Luksong Tinik</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Luksong Tinik means "jumping over thorns." Players leap over a rising stack of hands and feet formed by two "thorns" without touching them.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard icon={Flag} title="Short Description" color="from-brand-red to-red-700">
            <em>
              A traditional Filipino folk game where players jump over a stacked arrangement of hands and feet called "thorns," testing agility and coordination.
            </em>
          </InfoCard>

          <InfoCard icon={History} title="History" color="from-brand-yellow to-yellow-600">
            Originating in Cabanatuan, Nueva Ecija, Luksong Tinik is part of the "Palaro ng Lahi" games, promoting physical skill and outdoor play among children.
          </InfoCard>

          <InfoCard icon={Users} title="Rules" color="from-brand-blue to-blue-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Two teams select a "nanay" (mother) leader who jumps highest; remaining players are "anak" (children).</li>
              <li>Two "thorns" sit facing each other, stacking feet and hands to form levels.</li>
              <li>Jumpers must clear the stack without touching it or full-body contact.</li>
              <li>Failed jumps allow extra tries; thorns rotate after rounds.</li>
            </ul>
          </InfoCard>

          <InfoCard icon={PlayCircle} title="Step-by-Step Gameplay" color="from-brand-red to-red-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Teams decide the first jumpers and thorns; thorns sit soles touching for level 1.</li>
              <li>Jumpers queue and leap over; after all clear, thorns add feet for level 2 (one foot base, one on top).</li>
              <li>Progress to levels 3-8, stacking feet alternately then hands (level 8: all four hands/feet).</li>
              <li>Failed jumps get extra tries; thorns rotate after rounds. Continue until players complete all levels or decide to end the game.</li>
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
                src="https://www.youtube.com/embed/Ashwb23rex8"
                title="Luksong Tinik Gameplay Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <small className="text-white/70 mt-2 block">
              Demonstration of Luksong Tinik gameplay
            </small>
          </motion.div>
        </section>

        {/* Gallery Section */}
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
                  alt={`Luksong Tinik ${i + 1}`}
                  className="rounded-3xl object-cover h-64 w-full hover:scale-105 transition-transform duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              ))}
            </div>
            <small className="text-white/70 mt-2 block">
              Images showing Luksong Tinik gameplay and stacking levels
            </small>
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
            <ul className="list-disc list-inside space-y-2 text-white/90">
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Luksong_tinik"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Wikipedia – Luksong Tinik
                </a>
              </li>
              <li>
                <a
                  href="https://filipinoculture643599086.wordpress.com/2018/07/26/luksong-tinik/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Filipino Culture Blog – Luksong Tinik
                </a>
              </li>
              <li>
                <a
                  href="https://lapyahan-devcom.blogspot.com/2010/10/how-to-play-luksong-tinikjumping-over.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Lapyahan DevCom – How to Play Luksong Tinik
                </a>
              </li>
              <li>
                <a
                  href="https://www.christies.com/en/lot/lot-5452577"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Christies – Luksong Tinik reference
                </a>
              </li>
            </ul>
          </motion.div>
        </section>
      </main>
    </>
  );
}
