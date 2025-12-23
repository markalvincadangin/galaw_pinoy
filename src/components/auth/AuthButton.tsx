'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error('Error signing in:', error);
      }
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-xl cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleSignOut}
        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:translate-y-0"
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:translate-y-0"
    >
      Login with Google
    </button>
  );
}

