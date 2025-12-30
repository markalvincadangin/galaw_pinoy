'use client';

import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import {
    Zap,
    Users,
    Target,
    Flame,
    Shield,
    Activity,
    Heart,
} from 'lucide-react';

export default function Laro() {
    const games = [
        {
            name: 'Luksong Baka',
            slug: 'luksongBaka',
            description: 'Jump over an obstacle that increases in height. Builds leg strength, balance, and courage.',
            icon: Zap,
            color: 'from-brand-blue to-blue-700',
        },
        {
            name: 'Luksong Tinik',
            slug: 'luksongTinik',
            description: 'Jump over growing gaps formed by hands or feet. Promotes flexibility, coordination, and timing.',
            icon: Target,
            color: 'from-brand-yellow to-yellow-600',
        },
        {
            name: 'Patintero',
            slug: 'patintero',
            description: 'A team-based game where players try to cross lines while avoiding blockers. Develops agility, teamwork, and strategy.',
            icon: Users,
            color: 'from-brand-red to-red-700',
        },
        {
            name: 'Piko',
            slug: 'piko',
            description: 'Hop across a drawn grid while maintaining balance. Improves coordination, focus, and stability.',
            icon: Activity,
            color: 'from-brand-blue to-blue-700',
        },
        {
            name: 'Tumbang Preso',
            slug: 'tumbangPreso',
            description: 'Throw and chase a can to knock it down. Enhances accuracy, speed, and agility.',
            icon: Shield,
            color: 'from-brand-yellow to-yellow-600',
        },
        {
            name: 'Agawan Base',
            slug: 'agawanBase',
            description: 'Fast-paced team game focused on capturing the opponent’s base. Builds endurance, teamwork, and strategic thinking.',
            icon: Flame,
            color: 'from-brand-red to-red-700',
        },
        {
            name: 'Langit-Lupa',
            slug: 'langitLupa',
            description: 'Chase game involving jumping and squatting to avoid being tagged. Improves reaction time and cardiovascular endurance.',
            icon: Heart,
            color: 'from-brand-blue to-blue-700',
        },
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
            <span className="text-sm font-display font-bold uppercase tracking-wider text-brand-yellow">
              Traditional Games
            </span>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-black uppercase leading-tight tracking-tight text-white mb-6 drop-shadow-xl">
                            Most Played <span className="text-brand-blue">Laro</span>{' '}
                            <span className="text-brand-red">ng Lahi</span>
                        </h1>

                        <p className="text-lg md:text-xl lg:text-2xl text-white/95 leading-relaxed font-body drop-shadow-md max-w-3xl mx-auto">
                            These traditional games have been played for generations and continue to
                            shape Filipino childhood and culture.
                        </p>
                    </motion.div>
                </section>

                {/* Games Grid */}
                <section className="py-16 md:py-20 px-6 md:px-8 max-w-7xl mx-auto pb-20 md:pb-28">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {games.map((game, index) => {
                            const Icon = game.icon;

                            return (
                                <motion.div
                                    key={game.slug}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="flex flex-col justify-between glass-modern rounded-3xl p-6 md:p-8 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full"
                                >
                                    <div>
                                        <div
                                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                                        >
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>

                                        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 drop-shadow-md">
                                            {game.name}
                                        </h3>

                                        <p className="text-base md:text-lg text-white/90 leading-relaxed font-body mb-6">
                                            {game.description}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/laro/LaroGamesContent/${game.slug}`}
                                        className="mt-auto inline-block w-full text-center py-2 px-4 bg-brand-yellow text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors duration-300"
                                    >
                                        View
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </main>
        </>
    );
}
