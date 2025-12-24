'use client';

import PageTransition from '@/components/layout/PageTransition';
import { DebugProvider } from '@/context/DebugContext';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <DebugProvider>
      <PageTransition>{children}</PageTransition>
    </DebugProvider>
  );
}

