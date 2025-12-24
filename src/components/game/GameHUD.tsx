'use client';

import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useDebug } from '@/context/DebugContext';

interface GameHUDProps {
  score?: number;
  timer?: number;
  hipVelocity?: number;
  kneeAngle?: number;
  stamina?: number;
  children?: React.ReactNode;
}

/**
 * Game HUD component with optional debug panel
 * Shows real-time physics stats when debug mode is enabled
 * Mobile-responsive: Score/Timer at bottom on mobile, debug panel expandable
 */
export default function GameHUD({
  score,
  timer,
  hipVelocity,
  kneeAngle,
  stamina,
  children,
}: GameHUDProps): React.ReactElement {
  const { isDebugMode } = useDebug();
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  const hasDebugData = hipVelocity !== undefined || kneeAngle !== undefined || stamina !== undefined;

  return (
    <>
      {children}
      
      {/* Score and Timer Display */}
      {(score !== undefined || timer !== undefined) && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 md:block hidden">
          <div className="backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-full px-6 py-3 shadow-xl mt-4">
            <div className="flex items-center gap-4 text-white">
              {score !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/80">Score:</span>
                  <span className="font-display text-2xl font-black">{score}</span>
                </div>
              )}
              {timer !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/80">Time:</span>
                  <span className="font-display text-xl font-bold">{timer}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Score and Timer at Bottom */}
      {(score !== undefined || timer !== undefined) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
          <div className="backdrop-blur-xl bg-black/70 border-2 border-white/20 rounded-full px-6 py-3 shadow-xl">
            <div className="flex items-center gap-4 text-white">
              {score !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/80">Score:</span>
                  <span className="font-display text-xl font-black">{score}</span>
                </div>
              )}
              {timer !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/80">Time:</span>
                  <span className="font-display text-lg font-bold">{timer}s</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Debug Panel (top-right, always visible when debug mode is on) */}
      {isDebugMode && hasDebugData && (
        <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-white/20 min-w-[200px] hidden md:block">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
            Debug Stats
          </h3>
          <div className="space-y-1 text-sm font-mono">
            {hipVelocity !== undefined && (
              <div className="flex justify-between text-white/90">
                <span className="text-white/60">Hip Vel:</span>
                <span className="font-bold">{hipVelocity.toFixed(2)}</span>
              </div>
            )}
            {kneeAngle !== undefined && (
              <div className="flex justify-between text-white/90">
                <span className="text-white/60">Knee Ang:</span>
                <span className="font-bold">{kneeAngle.toFixed(0)}°</span>
              </div>
            )}
            {stamina !== undefined && (
              <div className="flex justify-between text-white/90">
                <span className="text-white/60">Stamina:</span>
                <span className={`font-bold ${
                  stamina < 30 ? 'text-red-400' : stamina < 50 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {stamina}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Debug Panel (top-left, expandable icon) */}
      {isDebugMode && hasDebugData && (
        <div className="absolute top-4 left-4 z-50 md:hidden">
          {/* Info Icon Button */}
          <button
            onClick={() => setIsDebugExpanded(!isDebugExpanded)}
            className="p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-colors"
            aria-label="Toggle Debug Stats"
          >
            {isDebugExpanded ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Info className="w-5 h-5 text-white" />
            )}
          </button>

          {/* Expanded Debug Panel */}
          {isDebugExpanded && (
            <div className="absolute top-12 left-0 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-white/20 min-w-[180px] shadow-xl">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                Debug Stats
              </h3>
              <div className="space-y-1 text-xs font-mono">
                {hipVelocity !== undefined && (
                  <div className="flex justify-between text-white/90">
                    <span className="text-white/60">Hip Vel:</span>
                    <span className="font-bold">{hipVelocity.toFixed(2)}</span>
                  </div>
                )}
                {kneeAngle !== undefined && (
                  <div className="flex justify-between text-white/90">
                    <span className="text-white/60">Knee Ang:</span>
                    <span className="font-bold">{kneeAngle.toFixed(0)}°</span>
                  </div>
                )}
                {stamina !== undefined && (
                  <div className="flex justify-between text-white/90">
                    <span className="text-white/60">Stamina:</span>
                    <span className={`font-bold ${
                      stamina < 30 ? 'text-red-400' : stamina < 50 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {stamina}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

