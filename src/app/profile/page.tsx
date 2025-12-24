import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, scores } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Trophy, Flame, Gamepad2, Calendar } from 'lucide-react';
import Image from 'next/image';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const userId = user.id;

  // Fetch user data
  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Fetch recent scores
  const recentScores = await db
    .select()
    .from(scores)
    .where(eq(scores.userId, userId))
    .orderBy(desc(scores.playedAt))
    .limit(10);

  // Calculate stats
  const totalGames = userData?.gamesPlayed || 0;
  const totalCalories = userData?.totalCalories || 0;
  const username = userData?.username || user.email?.split('@')[0] || 'Player';
  const avatarUrl = userData?.avatarUrl || user.user_metadata?.avatar_url;

  return (
    <>
      <Navigation />
      <main className="min-h-screen pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="py-16 md:py-20 px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                {/* Avatar */}
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-brand-blue to-brand-red flex items-center justify-center text-white text-3xl md:text-4xl font-bold font-display overflow-hidden shadow-xl ring-4 ring-white/20">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={username}
                      width={128}
                      height={128}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    username.charAt(0).toUpperCase()
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-2 drop-shadow-lg">
                    {username}
                  </h1>
                  <p className="text-white/90 mb-4 font-body">{user.email}</p>
                  {userData?.createdAt && (
                    <p className="text-sm text-white/80 flex items-center justify-center md:justify-start gap-2 font-body">
                      <Calendar className="w-4 h-4" />
                      Member since {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-8 md:py-12 px-6 md:px-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Games Played */}
            <div className="glass-modern rounded-3xl p-6 md:p-8 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 flex items-center justify-center shadow-lg">
                  <Gamepad2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-medium font-body">Games Played</p>
                  <p className="text-4xl font-bold text-white font-display drop-shadow-md">
                    {totalGames}
                  </p>
                </div>
              </div>
            </div>

            {/* Calories Burned */}
            <div className="glass-modern rounded-3xl p-6 md:p-8 cultural-texture hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center shadow-lg">
                  <Flame className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80 font-medium font-body">Total Calories</p>
                  <p className="text-4xl font-bold text-white font-display drop-shadow-md">
                    {totalCalories}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Games */}
        <section className="py-8 md:py-12 px-6 md:px-8 max-w-5xl mx-auto pb-20 md:pb-28">
          <div className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-7 h-7 text-brand-yellow drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white drop-shadow-lg">
                Recent Games
              </h2>
            </div>

            {recentScores.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/90 mb-6 font-body text-lg">No games played yet.</p>
                <a
                  href="/play"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-brand-red rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 font-display uppercase tracking-wide"
                >
                  Start Playing
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {recentScores.map((score) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                  >
                    <div>
                      <p className="font-semibold text-white capitalize text-lg font-display mb-1">
                        {score.gameType.replace('-', ' ')}
                      </p>
                      <p className="text-sm text-white/70 font-body">
                        {score.playedAt
                          ? new Date(score.playedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-brand-yellow font-display drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                        {score.score}
                      </p>
                      <p className="text-xs text-white/60 font-body">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

