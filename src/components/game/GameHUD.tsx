'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { useDebug } from '@/context/DebugContext';

interface GameHUDProps {
  // Status
  status?: React.ReactNode;
  
  // Core Stats
  score?: number;
  timer?: number; // in seconds
  level?: number;
  
  // Game-specific stats
  distance?: number; // percentage (0-100)
  cellsCompleted?: { current: number; total: number };
  lane?: string;
  comboCount?: number;
  reactionTime?: number; // in milliseconds
  stamina?: number; // percentage (0-100)
  
  // Power-ups and special states
  activePowerUp?: 'shield' | 'slowTime' | string;
  powerUpTimer?: number; // in milliseconds
  feverMode?: boolean;
  rubberBandingActive?: boolean;
  rubberBandingTimeRemaining?: number;
  
  // Warnings
  showPoseWarning?: boolean;
  warningMessage?: string;
  
  // Debug (optional)
  hipVelocity?: number;
  kneeAngle?: number;
  
  // Game state (to check if game is over and hide warnings)
  gameState?: string;
  
  // Custom content
  children?: React.ReactNode;
  
  // Styling
  className?: string;
}

/**
 * Modern Game HUD component with glass-morphism design
 * Shows game stats, status, and optional debug panel
 * Responsive: Optimized for both mobile and desktop
 */
export default function GameHUD({
  status,
  score,
  timer,
  level,
  distance,
  cellsCompleted,
  lane,
  comboCount,
  reactionTime,
  stamina,
  activePowerUp,
  powerUpTimer,
  feverMode,
  rubberBandingActive,
  rubberBandingTimeRemaining,
  showPoseWarning,
  warningMessage,
  hipVelocity,
  kneeAngle,
  gameState,
  children,
  className,
}: GameHUDProps): React.ReactElement {
  const { isDebugMode } = useDebug();
  const [isDebugExpanded, setIsDebugExpanded] = React.useState(false);

  const hasDebugData = hipVelocity !== undefined || kneeAngle !== undefined || stamina !== undefined;

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <>
      {children}
      
      {/* Main HUD - Desktop (Top Center) */}
      <div className={`absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 hidden md:block ${className || ''}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`glass-modern rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 shadow-2xl border-2 border-white/20 cultural-texture relative overflow-hidden ${
            feverMode ? 'border-brand-yellow/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]' : ''
          }`}
        >
          {/* Fever mode glow effect */}
          {feverMode && (
            <motion.div
              className="absolute inset-0 bg-brand-yellow/10"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          <div className="relative z-10">
            {/* Status Text */}
            {status && (
              <div className="mb-3 text-center">
                {typeof status === 'string' ? (
                  <p className={`text-base font-display font-bold uppercase tracking-wide ${
                    feverMode ? 'text-brand-yellow' : 'text-white'
                  }`}>
                    {feverMode && '🔥 '}
                    {status}
                    {feverMode && ' 🔥'}
                  </p>
                ) : (
                  <div className={feverMode ? 'text-brand-yellow' : 'text-white'}>
                    {status}
                  </div>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 xl:gap-4">
              {/* Score */}
              {score !== undefined && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] lg:text-xs font-display font-bold text-white/70 uppercase tracking-wider">Score</span>
                  <span className="font-display text-2xl lg:text-3xl font-black text-brand-yellow drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                    {score}
                  </span>
                </div>
              )}

              {/* Timer */}
              {timer !== undefined && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] lg:text-xs font-display font-bold text-white/70 uppercase tracking-wider">Time</span>
                  <span className="font-display text-2xl lg:text-3xl font-bold text-brand-blue drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                    {formatTimer(timer)}
                  </span>
                </div>
              )}

              {/* Level */}
              {level !== undefined && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] lg:text-xs font-display font-bold text-white/70 uppercase tracking-wider">Level</span>
                  <span className="font-display text-2xl lg:text-3xl font-bold text-brand-red drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                    {level}
                  </span>
                </div>
              )}

              {/* Distance */}
              {distance !== undefined && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-display font-bold text-white/70 uppercase tracking-wider">Distance</span>
                  <span className="font-display text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {Math.floor(distance)}%
                  </span>
                </div>
              )}

              {/* Cells Completed */}
              {cellsCompleted && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-display font-bold text-white/70 uppercase tracking-wider">Cells</span>
                  <span className="font-display text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {cellsCompleted.current}/{cellsCompleted.total}
                  </span>
                </div>
              )}

              {/* Lane */}
              {lane && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-display font-bold text-white/70 uppercase tracking-wider">Lane</span>
                  <span className="font-display text-xl font-bold text-white capitalize">
                    {lane}
                  </span>
                </div>
              )}

              {/* Reaction Time */}
              {reactionTime !== undefined && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-display font-bold text-white/70 uppercase tracking-wider">Reaction</span>
                  <span className="font-display text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {reactionTime}ms
                  </span>
                </div>
              )}
            </div>

            {/* Secondary Stats Row */}
            {(comboCount !== undefined || activePowerUp || rubberBandingActive) && (
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
                {/* Combo Count */}
                {comboCount !== undefined && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-yellow/20 border border-brand-yellow/30">
                    <span className="text-xs font-display font-bold text-white/70 uppercase">Combo</span>
                    <span className="text-sm font-display font-black text-brand-yellow">{comboCount}</span>
                    <span className="text-xs text-white/70">(2x Score!)</span>
                  </div>
                )}

                {/* Active Power-up */}
                {activePowerUp && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    activePowerUp === 'shield'
                      ? 'bg-brand-blue/20 border-brand-blue/30'
                      : 'bg-purple-500/20 border-purple-500/30'
                  }`}>
                    <span className="text-sm">
                      {activePowerUp === 'shield' ? '🛡️' : '⏱️'}
                    </span>
                    <span className="text-xs font-display font-bold text-white uppercase">
                      {activePowerUp === 'shield' ? 'Shield' : 'Slow Time'}
                    </span>
                    {powerUpTimer !== undefined && (
                      <span className="text-xs text-white/70">
                        ({Math.ceil(powerUpTimer / 1000)}s)
                      </span>
                    )}
                  </div>
                )}

                {/* Rubber Banding */}
                {rubberBandingActive && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-blue/20 border border-brand-blue/30">
                    <span className="text-xs text-brand-blue animate-pulse">🛡️ Rubber Banding</span>
                    {rubberBandingTimeRemaining !== undefined && rubberBandingTimeRemaining > 0 && (
                      <span className="text-xs text-white/70">({rubberBandingTimeRemaining}s)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stamina Bar */}
            {stamina !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-display font-bold text-white/70 uppercase tracking-wider">Stamina</span>
                  <span className={`text-xs font-display font-bold ${
                    stamina < 30 ? 'text-red-400' : stamina < 50 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Math.round(stamina)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stamina}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      background: stamina < 30
                        ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                        : stamina < 50
                          ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                          : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                      boxShadow: stamina < 30
                        ? '0 0 10px rgba(239, 68, 68, 0.5)'
                        : stamina < 50
                          ? '0 0 10px rgba(245, 158, 11, 0.5)'
                          : '0 0 10px rgba(34, 197, 94, 0.5)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Warning Message */}
            {/* Only show warning if game is not over - don't block result modal */}
            {(showPoseWarning || warningMessage) && gameState !== 'over' && gameState !== 'idle' && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-sm text-brand-yellow text-center animate-pulse">
                  {warningMessage || "No pose detected. Make sure you're visible!"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Main HUD - Mobile (Top, Full Width) */}
      <div className={`absolute top-4 left-4 right-4 z-50 md:hidden ${className || ''}`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`glass-modern rounded-xl px-4 py-3 shadow-2xl border-2 border-white/20 cultural-texture relative overflow-hidden ${
            feverMode ? 'border-brand-yellow/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : ''
          }`}
        >
          {/* Fever mode glow effect */}
          {feverMode && (
            <motion.div
              className="absolute inset-0 bg-brand-yellow/10"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          <div className="relative z-10">
            {/* Status Text */}
            {status && (
              <div className="mb-2 text-center">
                {typeof status === 'string' ? (
                  <p className={`text-sm font-display font-bold uppercase tracking-wide ${
                    feverMode ? 'text-brand-yellow' : 'text-white'
                  }`}>
                    {feverMode && '🔥 '}
                    {status}
                    {feverMode && ' 🔥'}
                  </p>
                ) : (
                  <div className={`text-sm ${feverMode ? 'text-brand-yellow' : 'text-white'}`}>
                    {status}
                  </div>
                )}
              </div>
            )}

            {/* Stats - Compact Grid */}
            <div className="grid grid-cols-3 gap-2">
              {score !== undefined && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase tracking-wider">Score</span>
                  <span className="font-display text-xl font-black text-brand-yellow drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                    {score}
                  </span>
                </div>
              )}

              {timer !== undefined && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase tracking-wider">Time</span>
                  <span className="font-display text-lg font-bold text-brand-blue drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]">
                    {formatTimer(timer)}
                  </span>
                </div>
              )}

              {level !== undefined && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase tracking-wider">Level</span>
                  <span className="font-display text-lg font-bold text-brand-red drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">
                    {level}
                  </span>
                </div>
              )}

              {distance !== undefined && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase tracking-wider">Dist</span>
                  <span className="font-display text-lg font-bold text-white">{Math.floor(distance)}%</span>
                </div>
              )}

              {cellsCompleted && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase tracking-wider">Cells</span>
                  <span className="font-display text-lg font-bold text-white">{cellsCompleted.current}/{cellsCompleted.total}</span>
                </div>
              )}

              {reactionTime !== undefined && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase tracking-wider">React</span>
                  <span className="font-display text-sm font-bold text-white">{reactionTime}ms</span>
                </div>
              )}
            </div>

            {/* Secondary Stats - Mobile */}
            {(comboCount !== undefined || activePowerUp) && (
              <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
                {comboCount !== undefined && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-brand-yellow/20 border border-brand-yellow/30">
                    <span className="text-[10px] font-display font-bold text-brand-yellow">Combo {comboCount}</span>
                  </div>
                )}
                {activePowerUp && (
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${
                    activePowerUp === 'shield'
                      ? 'bg-brand-blue/20 border-brand-blue/30 text-white'
                      : 'bg-purple-500/20 border-purple-500/30 text-white'
                  }`}>
                    <span>{activePowerUp === 'shield' ? '🛡️' : '⏱️'}</span>
                    {powerUpTimer !== undefined && (
                      <span className="text-[10px]">({Math.ceil(powerUpTimer / 1000)}s)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stamina Bar - Mobile */}
            {stamina !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-display font-bold text-white/70 uppercase">Stamina</span>
                  <span className={`text-[10px] font-display font-bold ${
                    stamina < 30 ? 'text-red-400' : stamina < 50 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {Math.round(stamina)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stamina}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: stamina < 30
                        ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                        : stamina < 50
                          ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                          : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Warning Message - Mobile */}
            {(showPoseWarning || warningMessage) && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-xs text-brand-yellow text-center animate-pulse">
                  {warningMessage || "No pose detected!"}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Desktop Debug Panel (top-right) */}
      {isDebugMode && hasDebugData && (
        <div className="absolute top-4 right-4 z-50 glass-modern rounded-2xl p-4 shadow-2xl border-2 border-white/20 min-w-[200px] hidden md:block">
          <h3 className="text-xs font-display font-bold text-white/70 uppercase tracking-wider mb-3">
            Debug Stats
          </h3>
          <div className="space-y-2 text-sm">
            {hipVelocity !== undefined && (
              <div className="flex justify-between items-center text-white/90">
                <span className="text-white/70 font-medium">Hip Velocity:</span>
                <span className="font-display font-bold text-brand-blue">{hipVelocity.toFixed(2)}</span>
              </div>
            )}
            {kneeAngle !== undefined && (
              <div className="flex justify-between items-center text-white/90">
                <span className="text-white/70 font-medium">Knee Angle:</span>
                <span className="font-display font-bold text-brand-red">{kneeAngle.toFixed(0)}°</span>
              </div>
            )}
            {stamina !== undefined && (
              <div className="flex justify-between items-center text-white/90">
                <span className="text-white/70 font-medium">Stamina:</span>
                <span className={`font-display font-bold ${
                  stamina < 30 ? 'text-red-400' : stamina < 50 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {stamina}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Debug Panel (top-left, expandable) */}
      {isDebugMode && hasDebugData && (
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <button
            onClick={() => setIsDebugExpanded(!isDebugExpanded)}
            className="p-2.5 glass-modern rounded-xl border-2 border-white/20 hover:bg-white/10 transition-all duration-200 shadow-lg"
            aria-label="Toggle Debug Stats"
          >
            {isDebugExpanded ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Info className="w-5 h-5 text-white" />
            )}
          </button>

          {isDebugExpanded && (
            <div className="absolute top-14 left-0 glass-modern rounded-2xl p-3 shadow-2xl border-2 border-white/20 min-w-[180px]">
              <h3 className="text-xs font-display font-bold text-white/70 uppercase tracking-wider mb-2">
                Debug Stats
              </h3>
              <div className="space-y-1.5 text-xs">
                {hipVelocity !== undefined && (
                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-white/70 font-medium">Hip Vel:</span>
                    <span className="font-display font-bold text-brand-blue">{hipVelocity.toFixed(2)}</span>
                  </div>
                )}
                {kneeAngle !== undefined && (
                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-white/70 font-medium">Knee Ang:</span>
                    <span className="font-display font-bold text-brand-red">{kneeAngle.toFixed(0)}°</span>
                  </div>
                )}
                {stamina !== undefined && (
                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-white/70 font-medium">Stamina:</span>
                    <span className={`font-display font-bold ${
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
