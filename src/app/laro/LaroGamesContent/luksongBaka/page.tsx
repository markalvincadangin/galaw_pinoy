'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { Flag, History, Users, Activity, PlayCircle, Image as ImageIcon } from 'lucide-react';
import InfoCard from '@/components/laro/InfoCard';

export default function LuksongBaka() {
  const galleryImages = ['luksongbaka1.jpg', 'luksongbaka2.jpg', 'luksongbaka3.jpeg'];

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
              <span className="text-brand-blue">Luksong Baka</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
              Luksong baka translates to "Jump over the Cow." Players jump over a bent-over "cow" player, testing agility and balance.
            </p>
          </motion.div>
        </section>

        {/* Info Sections */}
        <section className="py-16 md:py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <InfoCard icon={Flag} title="Short Description" color="from-brand-red to-red-700">
            <em>
              A traditional Filipino children's game where players leap over a crouched "baka" without touching them.
            </em>
          </InfoCard>

          <InfoCard icon={History} title="History" color="from-brand-yellow to-yellow-600">
            Luksong baka originated in Bulacan, Philippines during the pre-Hispanic era. It trained Tagalog children in agility and evolved into a popular folk game passed down through generations.
          </InfoCard>

          <InfoCard icon={Users} title="Rules" color="from-brand-blue to-blue-700">
            <ul className="list-disc list-inside space-y-2">
              <li>One player starts as the "baka" (cow), bending over with hands on knees.</li>
              <li>Jumpers must leap over without full-body contact or falling; only hands may lightly touch the baka's back for balance.</li>
              <li>A failed jump means the jumper becomes the new baka.</li>
            </ul>
          </InfoCard>

          <InfoCard icon={PlayCircle} title="Step-by-Step Gameplay" color="from-brand-red to-red-700">
            <ul className="list-disc list-inside space-y-2">
              <li>Players (3-10) choose the first baka, who kneels bent over.</li>
              <li>Others line up and jump over one by one.</li>
              <li>After a full round, the baka rises slightly taller for the next round of jumps.</li>
              <li>Continue until a jumper fails and swaps places; repeat with increasing height until the game ends.</li>
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
              src="https://www.youtube.com/embed/VeLVOIE9XxQ"
              title="Luksong Baka Gameplay Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />

            </div>
            <small className="text-white/70 mt-2 block">
              Demonstration of Luksong Baka gameplay
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
                  alt={`Luksong Baka ${i + 1}`}
                  className="rounded-3xl object-cover h-64 w-full hover:scale-105 transition-transform duration-300"
                  whileHover={{ scale: 1.05 }}
                />
              ))}
            </div>
            <small className="text-white/70 mt-2 block">
              Images showing Luksong Baka gameplay and player positions
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
                  href="https://en.wikipedia.org/wiki/Luksong_baka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Wikipedia – Luksong Baka
                </a>
              </li>
              <li>
                <a
                  href="https://www.scribd.com/document/678272129/History-of-Luksong-Baka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Scribd – History of Luksong Baka
                </a>
              </li>
              <li>
                <a
                  href="https://kids.kiddle.co/Luksong_baka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Kids Kiddle – Luksong Baka
                </a>
              </li>
              <li>
                <a
                  href="https://filipinobloggerph.blogspot.com/2018/03/luksong-baka.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Filipino Blogger PH – Luksong Baka
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/nationalmuseumofthephilippines/posts/how-high-could-you-jump-over-the-cow-more-than-just-a-fun-nostalgic-game-we-play/1274860698002540/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand-yellow"
                >
                  Facebook – National Museum PH
                </a>
              </li>
            </ul>
          </motion.div>
        </section>
      </main>
    </>
  );
}

