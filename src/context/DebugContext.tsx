'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DebugContextType {
  isDebugMode: boolean;
  toggleDebug: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

/**
 * Debug Provider component
 * Wraps the application to provide debug mode state
 */
export function DebugProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [isDebugMode, setIsDebugMode] = useState(false);

  const toggleDebug = useCallback(() => {
    setIsDebugMode((prev) => !prev);
  }, []);

  return (
    <DebugContext.Provider value={{ isDebugMode, toggleDebug }}>
      {children}
    </DebugContext.Provider>
  );
}

/**
 * Custom hook to access debug context
 * @throws Error if used outside DebugProvider
 */
export function useDebug(): DebugContextType {
  const context = useContext(DebugContext);
  
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  
  return context;
}

