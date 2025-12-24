'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Gamepad2, User, LogOut, Shield, Info, BookOpen, HeartPulse, Users, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// Cache auth state globally to persist across Navigation component remounts
const authStateCache = {
  isLoggedIn: null as boolean | null,
  isAdmin: false,
  isLoading: true,
  lastChecked: 0,
  userEmail: null as string | null,
  isCheckingAdmin: false, // Flag to prevent multiple simultaneous admin checks
};

const CACHE_DURATION = 60000; // Cache for 1 minute

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(authStateCache.isLoggedIn);
  const [isLoading, setIsLoading] = useState(authStateCache.isLoading);
  const [isAdmin, setIsAdmin] = useState(authStateCache.isAdmin);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const hasInitializedRef = useRef(false);

  // Check authentication status and admin status - use cache to avoid re-checking on remount
  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const checkAuth = async (forceRefresh = false) => {
      const now = Date.now();
      const cacheAge = authStateCache.lastChecked > 0 ? now - authStateCache.lastChecked : Infinity;
      const isCacheValid = !forceRefresh && 
        authStateCache.lastChecked > 0 && 
        cacheAge < CACHE_DURATION &&
        authStateCache.isLoggedIn !== null;

      // If cache is valid, use it and skip the API call
      if (isCacheValid) {
        if (isMounted) {
          setIsLoggedIn(authStateCache.isLoggedIn);
          setIsAdmin(authStateCache.isAdmin);
          setIsLoading(false);
          hasInitializedRef.current = true;
        }
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        
        const newIsLoggedIn = !!user;
        const userEmail = user?.email || null;
        
        // Update cache and state
        authStateCache.isLoggedIn = newIsLoggedIn;
        authStateCache.userEmail = userEmail;
        authStateCache.lastChecked = now;
        setIsLoggedIn(newIsLoggedIn);
        
        // Check if user is admin (only if not already checking)
        if (userEmail && !authStateCache.isCheckingAdmin) {
          // Check admin status (will use cache internally if email hasn't changed)
          const emailChanged = authStateCache.userEmail !== userEmail;
          if (emailChanged || forceRefresh || cacheAge >= CACHE_DURATION) {
            authStateCache.isCheckingAdmin = true;
            try {
              const response = await fetch('/api/check-admin');
              if (response.ok) {
                const data = await response.json();
                const newIsAdmin = data.isAdmin || false;
                authStateCache.isAdmin = newIsAdmin;
                if (isMounted) {
                  setIsAdmin(newIsAdmin);
                }
              }
            } catch (error) {
              console.error('Error checking admin status:', error);
              authStateCache.isAdmin = false;
              if (isMounted) {
                setIsAdmin(false);
              }
            } finally {
              authStateCache.isCheckingAdmin = false;
            }
          } else {
            // Use cached admin status
            if (isMounted) {
              setIsAdmin(authStateCache.isAdmin);
            }
          }
        } else {
          authStateCache.isAdmin = false;
          if (isMounted) {
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        authStateCache.isLoggedIn = false;
        authStateCache.isAdmin = false;
        if (isMounted) {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          hasInitializedRef.current = true;
        }
      }
    };

    // Initialize with cached state immediately if available (synchronous)
    if (authStateCache.isLoggedIn !== null && authStateCache.lastChecked > 0) {
      const cacheAge = Date.now() - authStateCache.lastChecked;
      if (cacheAge < CACHE_DURATION) {
        // Use cached values immediately (no API call)
        setIsLoggedIn(authStateCache.isLoggedIn);
        setIsAdmin(authStateCache.isAdmin);
        setIsLoading(false);
        hasInitializedRef.current = true;
        
        // Optionally refresh in background if cache is getting stale
        if (cacheAge > CACHE_DURATION / 2) {
          // Refresh in background without blocking
          checkAuth(true).catch(() => {
            // Silently fail background refresh
          });
        }
      } else {
        // Cache expired, check fresh
        checkAuth(true);
      }
    } else {
      // No cache, check fresh
      checkAuth(true);
    }

    // Listen for auth changes - this will handle login/logout events
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      const newIsLoggedIn = !!session;
      const userEmail = session?.user?.email || null;
      
      // Update cache and state
      authStateCache.isLoggedIn = newIsLoggedIn;
      authStateCache.userEmail = userEmail;
      authStateCache.lastChecked = Date.now();
      setIsLoggedIn(newIsLoggedIn);
      
      // Check admin status on auth change (force refresh) - only if not already checking
      if (newIsLoggedIn && userEmail && !authStateCache.isCheckingAdmin) {
        authStateCache.isCheckingAdmin = true;
        fetch('/api/check-admin')
          .then(res => res.json())
          .then(data => {
            const newIsAdmin = data.isAdmin || false;
            authStateCache.isAdmin = newIsAdmin;
            authStateCache.isCheckingAdmin = false;
            if (isMounted) {
              setIsAdmin(newIsAdmin);
            }
          })
          .catch(() => {
            authStateCache.isAdmin = false;
            authStateCache.isCheckingAdmin = false;
            if (isMounted) {
              setIsAdmin(false);
            }
          });
      } else {
        authStateCache.isAdmin = false;
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    });

    subscription = authSubscription;

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
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

  // Mobile bottom tab navigation items (primary - always visible)
  const mobilePrimaryNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/play', label: 'Play', icon: Gamepad2 },
  ];

  // Mobile secondary navigation items (in menu)
  const mobileSecondaryNavItems = [
    { href: '/about', label: 'About', icon: Info },
    { href: '/laro', label: 'Laro', icon: BookOpen },
    { href: '/health', label: 'Health', icon: HeartPulse },
    { href: '/join', label: 'Join', icon: Users },
  ];

  // Desktop navigation items
  const desktopNavItems = [
    { href: '/', label: 'Home' },
    { href: '/play', label: 'Games' },
    { href: '/about', label: 'About' },
    { href: '/laro', label: 'Laro' },
    { href: '/health', label: 'Health' },
    { href: '/join', label: 'Join' },
  ];

  return (
    <>
      {/* Desktop: Modern Floating Glass Navigation */}
      <nav className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[95vw] px-4">
        <motion.div
          className="glass-modern rounded-full px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-3.5 shadow-2xl mx-auto relative overflow-hidden"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ maxWidth: 'fit-content', width: 'auto' }}
          whileHover={{ 
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(251, 191, 36, 0.1)' 
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/5 via-transparent to-brand-red/5 rounded-full pointer-events-none" />
          
          <ul className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 list-none m-0 p-0 flex-nowrap relative z-10 overflow-x-auto scrollbar-hide">
            {desktopNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="m-0 p-0">
                  <motion.div
                    whileHover={{ y: -3, scale: 1.05 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Link
                      href={item.href}
                      className={clsx(
                        'relative text-xs sm:text-sm md:text-base font-display font-bold uppercase tracking-wide py-2.5 px-2 sm:px-3 md:px-4 transition-all duration-300 whitespace-nowrap flex-shrink-0 block',
                        isActive 
                          ? 'text-brand-yellow' 
                          : 'text-white/90 hover:text-white'
                      )}
                    >
                      {/* Active background glow */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-brand-yellow/20 blur-xl"
                          layoutId="activeNavBg"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      
                      {/* Hover background - more prominent */}
                      <motion.div
                        className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ opacity: 1, scale: 1.05 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                      
                      {/* Hover glow effect */}
                      {!isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-brand-blue/20 blur-lg"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                        />
                      )}
                      
                      {/* Text with glow effect */}
                      <span 
                        className="relative z-10"
                        style={isActive ? { 
                          textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)',
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                        } : {
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {item.label}
                      </span>
                      
                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-yellow"
                          layoutId="activeNavDot"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{
                            boxShadow: '0 0 10px rgba(251, 191, 36, 0.8), 0 0 20px rgba(251, 191, 36, 0.4)'
                          }}
                        />
                      )}
                    </Link>
                  </motion.div>
                </li>
              );
            })}
            
            {/* Divider */}
            {!isLoading && (
              <li className="m-0 p-0">
                <div className="w-px h-6 bg-white/20 mx-2" />
              </li>
            )}
            
            {/* Admin Link - Only render when admin to prevent layout shift */}
            {!isLoading && isLoggedIn && isAdmin && (
              <li className="m-0 p-0">
                <motion.div
                  whileHover={{ y: -3, scale: 1.08 }}
                  whileTap={{ y: 0, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href="/admin"
                    className={clsx(
                      'relative flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-full transition-all duration-300',
                      pathname === '/admin'
                        ? 'bg-brand-yellow/20 text-brand-yellow'
                        : 'text-white/90 hover:text-white'
                    )}
                  >
                    {/* Hover background for admin link */}
                    {pathname !== '/admin' && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ opacity: 1, scale: 1.05 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    )}
                    <Shield className={clsx(
                      'w-4 h-4 transition-all duration-300 relative z-10',
                      pathname === '/admin' && 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    )} />
                    <span className="text-sm font-display font-bold uppercase tracking-wide relative z-10">
                      Admin
                    </span>
                    {pathname === '/admin' && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-brand-yellow/20 blur-md"
                        layoutId="adminNavBg"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              </li>
            )}
            
            {/* Profile/Login Links */}
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    <li className="m-0 p-0">
                      <motion.div
                        whileHover={{ y: -3, scale: 1.08 }}
                        whileTap={{ y: 0, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <Link
                          href="/profile"
                          className={clsx(
                            'relative flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-full transition-all duration-300',
                            pathname === '/profile'
                              ? 'bg-brand-yellow/20 text-brand-yellow'
                              : 'text-white/90 hover:text-white'
                          )}
                        >
                          {/* Hover background for profile link */}
                          {pathname !== '/profile' && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm"
                              initial={{ opacity: 0, scale: 0.9 }}
                              whileHover={{ opacity: 1, scale: 1.05 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                          )}
                          <User className={clsx(
                            'w-4 h-4 transition-all duration-300 relative z-10',
                            pathname === '/profile' && 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                          )} />
                          <span className="text-sm font-display font-bold uppercase tracking-wide relative z-10">
                            Profile
                          </span>
                          {pathname === '/profile' && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-brand-yellow/20 blur-md"
                              layoutId="profileNavBg"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    </li>
                    <li className="m-0 p-0">
                      <motion.div
                        whileHover={{ y: -3, scale: 1.08 }}
                        whileTap={{ y: 0, scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <button
                          onClick={handleSignOut}
                          className="relative flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-full text-white/90 hover:text-white transition-all duration-300 text-sm font-display font-bold uppercase tracking-wide"
                        >
                          {/* Hover background for logout button */}
                          <motion.div
                            className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ opacity: 1, scale: 1.05 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          />
                          <LogOut className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Logout</span>
                        </button>
                      </motion.div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="m-0 p-0">
                    <motion.div
                      whileHover={{ y: -3, scale: 1.08 }}
                      whileTap={{ y: 0, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Link
                        href="/login"
                        className={clsx(
                          'relative text-sm md:text-base font-display font-bold uppercase tracking-wide py-2.5 px-4 md:px-5 rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 block',
                          pathname === '/login'
                            ? 'bg-brand-yellow/20 text-brand-yellow'
                            : 'bg-brand-blue/30 text-white'
                        )}
                      >
                        {/* Hover background for login button */}
                        {pathname !== '/login' && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-brand-blue/50 backdrop-blur-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ opacity: 1, scale: 1.05 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          />
                        )}
                        {pathname === '/login' && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-brand-yellow/20 blur-md"
                            layoutId="loginNavBg"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 drop-shadow-md">Login</span>
                      </Link>
                    </motion.div>
                  </li>
                  </>
                )}
              </>
            )}
          </ul>
        </motion.div>
      </nav>

              {/* Mobile: Bottom Tab Bar with Menu */}
              <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <motion.div
                  className="glass-modern border-t border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Primary Navigation Items */}
                  <ul className="flex items-center justify-around list-none m-0 p-2">
                    {mobilePrimaryNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.href} className="m-0 p-0 flex-1">
                          <Link
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={clsx(
                              'flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200',
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
                                  'w-5 h-5 transition-colors duration-200',
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
                                'text-[10px] font-semibold mt-0.5 transition-colors duration-200',
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
                    
                    {/* Menu Button */}
                    <li className="m-0 p-0 flex-1">
                      <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={clsx(
                          'flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200 w-full',
                          isMobileMenuOpen && 'bg-white/10'
                        )}
                        aria-label="Toggle menu"
                      >
                        <motion.div
                          animate={{
                            rotate: isMobileMenuOpen ? 90 : 0,
                            scale: isMobileMenuOpen ? 1.1 : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          {isMobileMenuOpen ? (
                            <X className="w-5 h-5 text-brand-yellow" />
                          ) : (
                            <Menu className="w-5 h-5 text-white/95" />
                          )}
                        </motion.div>
                        <span className="text-[10px] font-semibold mt-0.5 text-white/95">More</span>
                      </button>
                    </li>

                    {/* Profile/Login */}
                    {!isLoading && isLoggedIn ? (
                      <li className="m-0 p-0 flex-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={clsx(
                            'flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200',
                            pathname === '/profile' && 'bg-white/10'
                          )}
                        >
                          <motion.div
                            animate={{
                              y: pathname === '/profile' ? -4 : 0,
                              scale: pathname === '/profile' ? 1.1 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          >
                            <User
                              className={clsx(
                                'w-5 h-5 transition-colors duration-200',
                                pathname === '/profile' ? 'text-brand-yellow' : 'text-white/95'
                              )}
                              style={
                                pathname === '/profile'
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
                              'text-[10px] font-semibold mt-0.5 transition-colors duration-200',
                              pathname === '/profile' 
                                ? 'text-brand-yellow drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' 
                                : 'text-white/95'
                            )}
                            style={pathname === '/profile' ? { textShadow: '0 0 8px rgba(251, 191, 36, 0.6)' } : undefined}
                          >
                            Profile
                          </span>
                        </Link>
                      </li>
                    ) : !isLoading ? (
                      <li className="m-0 p-0 flex-1">
                        <Link
                          href="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={clsx(
                            'flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200',
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
                                'w-5 h-5 transition-colors duration-200',
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
                              'text-[10px] font-semibold mt-0.5 transition-colors duration-200',
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
                    ) : null}
                  </ul>

                  {/* Expandable Menu Panel */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isMobileMenuOpen ? 'auto' : 0,
                      opacity: isMobileMenuOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {mobileSecondaryNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={clsx(
                              'flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200',
                              isActive ? 'bg-white/10 text-brand-yellow' : 'bg-white/5 text-white/95 hover:bg-white/10'
                            )}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-semibold">{item.label}</span>
                          </Link>
                        );
                      })}
                      {/* Admin Link - Accessible on Mobile */}
                      {isLoggedIn && isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={clsx(
                            'flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200',
                            pathname === '/admin' ? 'bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30' : 'bg-white/5 text-white/95 hover:bg-white/10 border border-white/10'
                          )}
                        >
                          <Shield className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-semibold">Admin Dashboard</span>
                        </Link>
                      )}
                      {isLoggedIn && (
                        <button
                          onClick={() => {
                            handleSignOut();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 bg-white/5 text-white/95 hover:bg-white/10 col-span-2"
                        >
                          <LogOut className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-semibold">Sign Out</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </nav>
    </>
  );
}
