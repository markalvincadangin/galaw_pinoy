'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Gamepad2, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Mobile bottom tab navigation items
  const mobileNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/play', label: 'Play', icon: Gamepad2 },
    ...(isLoggedIn
      ? [{ href: '/profile', label: 'Profile', icon: User }]
      : []),
  ];

  // Desktop navigation items
  const desktopNavItems = [
    { href: '/', label: 'Home' },
    { href: '/play', label: 'Play' },
    { href: '/about', label: 'About' },
    { href: '/laro', label: 'Laro' },
    { href: '/health', label: 'Health' },
    { href: '/join', label: 'Join' },
  ];

  return (
    <>
      {/* Desktop: Floating Glass Pill */}
      <nav className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[95vw] px-4">
        <motion.div
          className="glass-modern rounded-full px-3 md:px-4 lg:px-5 py-2.5 md:py-3 shadow-xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: 'fit-content', width: 'auto' }}
        >
          <ul className="flex items-center gap-1.5 md:gap-2.5 lg:gap-3.5 list-none m-0 p-0 flex-nowrap">
            {desktopNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="m-0 p-0">
                  <Link
                    href={item.href}
                    className={clsx(
                      'text-xs md:text-sm font-semibold relative py-2 px-1.5 md:px-2 lg:px-2.5 transition-colors duration-150 whitespace-nowrap flex-shrink-0',
                      isActive 
                        ? 'text-brand-yellow drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                        : 'text-white/95 hover:text-white'
                    )}
                    style={isActive ? { textShadow: '0 0 12px rgba(251, 191, 36, 0.6)' } : undefined}
                  >
                    {item.label}
                    {isActive && (
                      <motion.span
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow"
                        layoutId="desktop-nav-indicator"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    <li className="m-0 p-0">
                      <Link
                        href="/profile"
                        className={clsx(
                          'text-xs md:text-sm font-semibold relative py-2 px-2 md:px-3 transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap',
                          pathname === '/profile'
                            ? 'text-brand-yellow drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-white/95 hover:text-white'
                        )}
                        style={pathname === '/profile' ? { textShadow: '0 0 12px rgba(251, 191, 36, 0.6)' } : undefined}
                      >
                        <User className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Profile</span>
                      </Link>
                    </li>
                    <li className="m-0 p-0">
                      <button
                        onClick={handleSignOut}
                        className="text-xs md:text-sm font-semibold text-white/95 hover:text-white transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap px-2 md:px-3"
                      >
                        <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </li>
                  </>
                ) : (
                  <li className="m-0 p-0">
                    <Link
                      href="/login"
                      className={clsx(
                        'text-xs md:text-sm font-semibold relative py-2 px-1.5 md:px-2 lg:px-2.5 transition-colors duration-150 whitespace-nowrap flex-shrink-0',
                        pathname === '/login'
                          ? 'text-brand-yellow drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-white/95 hover:text-white'
                      )}
                      style={pathname === '/login' ? { textShadow: '0 0 12px rgba(251, 191, 36, 0.6)' } : undefined}
                    >
                      Login
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </motion.div>
      </nav>

              {/* Mobile: Bottom Tab Bar */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <motion.div
                  className="glass-modern border-t border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
          <ul className="flex items-center justify-around list-none m-0 p-2">
            {mobileNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href} className="m-0 p-0 flex-1">
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                      isActive && 'bg-white/10'
                    )}
                  >
                    <motion.div
                      animate={{
                        y: isActive ? -4 : 0,
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Icon
                        className={clsx(
                          'w-6 h-6 transition-colors duration-200',
                          isActive ? 'text-brand-yellow' : 'text-white/95'
                        )}
                        style={
                          isActive
                            ? {
                                filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))',
                              }
                            : {
                                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                              }
                        }
                      />
                    </motion.div>
                    <span
                      className={clsx(
                        'text-xs font-semibold mt-1 transition-colors duration-200',
                        isActive 
                          ? 'text-brand-yellow drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' 
                          : 'text-white/95'
                      )}
                      style={isActive ? { textShadow: '0 0 8px rgba(251, 191, 36, 0.6)' } : undefined}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            {!isLoading && !isLoggedIn && (
              <li className="m-0 p-0 flex-1">
                <Link
                  href="/login"
                  className={clsx(
                    'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                    pathname === '/login' && 'bg-white/10'
                  )}
                >
                  <motion.div
                    animate={{
                      y: pathname === '/login' ? -4 : 0,
                      scale: pathname === '/login' ? 1.1 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <User
                      className={clsx(
                        'w-6 h-6 transition-colors duration-200',
                        pathname === '/login' ? 'text-brand-yellow' : 'text-white/95'
                      )}
                      style={
                        pathname === '/login'
                          ? {
                              filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.8))',
                            }
                          : {
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                            }
                      }
                    />
                  </motion.div>
                  <span
                    className={clsx(
                      'text-xs font-semibold mt-1 transition-colors duration-200',
                      pathname === '/login' 
                        ? 'text-brand-yellow drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' 
                        : 'text-white/95'
                    )}
                    style={pathname === '/login' ? { textShadow: '0 0 8px rgba(251, 191, 36, 0.6)' } : undefined}
                  >
                    Login
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </motion.div>
      </nav>
    </>
  );
}
