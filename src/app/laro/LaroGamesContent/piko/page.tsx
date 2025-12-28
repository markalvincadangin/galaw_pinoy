'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon } from 'lucide-react';
import InfoCard from '@/components/laro/InfoCard';

export default function Piko() {
  const galleryImages = ['piko1.jpg', 'piko2.jpg', 'piko3.jpg'];

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
              <span className="text-brand-blue">Piko</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Piko is the Philippine version of hopscotch, traditionally played outdoors using a grid drawn on the ground.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard icon={Flag} title="Short Description" color="from-brand-red to-red-700">
            <em>Piko is the Philippine version of hopscotch, traditionally played outdoors using a grid drawn on the ground.</em>
          </InfoCard>

          <InfoCard icon={History} title="History" color="from-brand-yellow to-yellow-600">
            Hopscotch originated in ancient Rome and spread worldwide. In the Philippines, it evolved into the traditional game known as Piko.
          </InfoCard>

          <InfoCard icon={Users} title="Rules" color="from-brand-blue to-blue-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Stepping on a line ends the turn.</li>
              <li>Losing balance ends the turn.</li>
              <li>The first player to finish all squares wins.</li>
            </ul>
          </InfoCard>

          <InfoCard icon={PlayCircle} title="Gameplay of Piko" color="from-brand-red to-red-700">
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Grid Drawing</strong>: Players draw a grid of squares on the ground.
                <div className="my-3 text-center">
                  <img
                    src="/images/Piko.png"
                    alt="Traditional Piko grid drawing"
                    className="mx-auto rounded-lg object-cover w-full max-w-md"
                  />
                  <small className="text-white/70 block mt-1">Traditional Piko grid layout</small>
                </div>
              </li>
              <li><strong>Starting the Game</strong>: Players decide the order of play.</li>
              <li><strong>Pamato Use</strong>: A marker is thrown into the first square.</li>
              <li><strong>Hopping Sequence</strong>: Players hop on one foot, avoiding lines.</li>
              <li><strong>Retrieving the Pamato</strong>: The marker is picked up on the return.</li>
              <li><strong>Progression</strong>: The process repeats for each square.</li>
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
                src="https://www.youtube.com/embed/6Od2e1I7Nzc"
                title="Piko Gameplay Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <small className="text-white/70 mt-2 block">
              Demonstration of traditional Piko gameplay
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
                  alt={`Piko ${i + 1}`}
                  className="rounded-3xl object-cover h-64 w-full hover:scale-105 transition-transform duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              ))}
            </div>
            <small className="text-white/70 mt-2 block">
              Images showing traditional Piko gameplay and layouts
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
            <p className="text-white/90">
              Wikipedia contributors. <em>Traditional games in the Philippines</em>.{' '}
              <a
                href="https://en.wikipedia.org/wiki/Traditional_games_in_the_Philippines#:~:text=Piko%20is%20the%20Philippine%20variation%20of%20the,a%20cross%20or%20a%20stylized%20human%20figure"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-yellow"
              >
                Link
              </a>
            </p>
          </motion.div>
        </section>
      </main>
    </>
  );
}

