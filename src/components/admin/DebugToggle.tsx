'use client';

import { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDebug } from '@/context/DebugContext';

/**
 * Debug Toggle Component
 * Only visible to admins - toggles physics debug mode
 */
export default function DebugToggle(): React.ReactElement | null {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);
  
  // Safely get debug context with error handling
  let isDebugMode = false;
  let toggleDebug = () => {};
  
  try {
    const debugContext = useDebug();
    isDebugMode = debugContext.isDebugMode;
    toggleDebug = debugContext.toggleDebug;
  } catch (error) {
    console.error('[DebugToggle] Error accessing debug context:', error);
    setDebugError('Debug context not available');
  }

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.log('[DebugToggle] No user found');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Use the same admin check as middleware and API routes
        // Check via API endpoint to ensure consistency
        const response = await fetch('/api/check-admin');
        if (!response.ok) {
          throw new Error(`Admin check failed: ${response.statusText}`);
        }
        const data = await response.json();
        const adminStatus = data.isAdmin || false;
        
        // Debug logging to help troubleshoot
        console.log('[DebugToggle] Admin check result:', {
          hasUser: !!user,
          userEmail: user?.email,
          isAdmin: adminStatus,
          responseData: data,
        });
        
        setIsAdmin(adminStatus);
        setIsLoading(false);
      } catch (error) {
        console.error('[DebugToggle] Error checking admin status:', error);
        setIsAdmin(false);
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Debug logging for render decisions
  useEffect(() => {
    if (!isLoading) {
      console.log('[DebugToggle] Render check:', {
        isLoading,
        isAdmin,
        willRender: !isLoading && isAdmin,
        debugError,
      });
    }
  }, [isLoading, isAdmin, debugError]);

  // Don't render anything if not admin or still loading
  if (isLoading) {
    console.log('[DebugToggle] Still loading, not rendering');
    return null;
  }
  
  if (!isAdmin) {
    console.log('[DebugToggle] Not admin, not rendering');
    return null;
  }
  
  console.log('[DebugToggle] Rendering debug toggle button');

  return (
    <div className="relative group" data-testid="debug-toggle">
      <button
        onClick={toggleDebug}
        className="px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-brand-dark bg-white/10 border border-white/20 flex items-center gap-2"
        aria-label="Toggle Physics Debugger"
      >
        <Bug
          className={`w-5 h-5 transition-colors duration-200 ${
            isDebugMode ? 'text-red-500' : 'text-white'
          }`}
        />
        <span className="text-sm font-medium text-white">
          {isDebugMode ? 'Debug ON' : 'Debug OFF'}
        </span>
      </button>
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black/80 backdrop-blur-sm rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
        Toggle Physics Debugger
      </span>
      {debugError && (
        <span className="absolute top-full left-0 mt-1 px-2 py-1 text-xs text-red-500 bg-black/80 rounded">
          {debugError}
        </span>
      )}
    </div>
  );
}

