'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import KineticButton from '@/components/ui/KineticButton';

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
      <KineticButton
        variant="primary"
        size="md"
        disabled
        className="min-w-[200px]"
      >
        Loading...
      </KineticButton>
    );
  }

  if (isLoggedIn) {
    return (
      <KineticButton
        variant="danger"
        size="md"
        onClick={handleSignOut}
        className="min-w-[200px]"
      >
        Sign Out
      </KineticButton>
    );
  }

  return (
    <KineticButton
      variant="primary"
      size="md"
      onClick={handleSignIn}
      className="min-w-[200px]"
    >
      Login with Google
    </KineticButton>
  );
}

