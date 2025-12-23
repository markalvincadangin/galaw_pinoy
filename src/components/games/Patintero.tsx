'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'over';

type Lane = 'left' | 'center' | 'right';

interface Blocker {
  id: string;
  lane: Lane;
  progress: number; // 0 to 100 (percentage from top to bottom)
}

const LANE_THRESHOLDS = {
  left: { min: 0, max: 0.33 },
  center: { min: 0.33, max: 0.66 },
  right: { min: 0.66, max: 1.0 },
};

const INITIAL_SPAWN_INTERVAL = 4000; // milliseconds
const MIN_SPAWN_INTERVAL = 400;
const SPEED_DECREMENT = 120;
const BLOCKER_SPEED = 2; // pixels per frame (or percentage per frame)

export default function Patintero(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting } = usePoseDetection(webcamRef);
  const { playGameOver, toggleMusic, isMusicPlaying } = useGameSound();

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [currentLane, setCurrentLane] = useState<Lane | null>(null);
  const spawnIntervalRef = useRef(INITIAL_SPAWN_INTERVAL);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCalories, setFinalCalories] = useState(0);

  // Refs
  const gameStartTimeRef = useRef<number>(0);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLaneRef = useRef<Lane | null>(null);
  const gameStateRef = useRef<GameState>('idle');

  // Determine player lane from nose X coordinate
  useEffect(() => {
    if (gameState !== 'playing') {
      setTimeout(() => {
        setCurrentLane(null);
      }, 0);
      return;
    }

    // Safety check: if pose detection fails, don't crash
    if (error || !landmarks?.nose) {
      setTimeout(() => {
        setCurrentLane(null);
      }, 0);
      return;
    }

    try {
      const noseX = landmarks.nose.x; // Normalized 0-1

      setTimeout(() => {
        if (noseX < LANE_THRESHOLDS.left.max) {
          setCurrentLane('left');
        } else if (noseX < LANE_THRESHOLDS.center.max) {
          setCurrentLane('center');
        } else {
          setCurrentLane('right');
        }
      }, 0);
    } catch (err) {
      console.error('Error in lane detection:', err);
      setTimeout(() => {
        setCurrentLane(null);
      }, 0);
    }
  }, [landmarks, gameState, error]);

  // Start game (go to lobby for calibration)
  const startGame = useCallback(() => {
    setGameState('lobby');
    setElapsedTime(0);
    setBlockers([]);
    setCurrentLane(null);
    spawnIntervalRef.current = INITIAL_SPAWN_INTERVAL;
    setShowResultModal(false);
    // Stop background music when game resets
    if (isMusicPlaying) {
      toggleMusic();
    }
  }, [isMusicPlaying, toggleMusic]);

  // Handle calibration complete
  const handleCalibrated = useCallback(() => {
    setGameState('ready');
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((Date.now() - gameStartTimeRef.current) / 1000);
    }, 100); // Update every 100ms for smoother display
  }, []);

  // End game
  const endGame = useCallback(() => {
    setGameState('over');
    
    // Clear all intervals and timeouts
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop webcam
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Calculate score (time survived in seconds) and calories (rough estimate: ~5 calories per second)
    const score = Math.floor(elapsedTime);
    const calories = Math.floor(elapsedTime * 5);
    setFinalScore(score);
    setFinalCalories(calories);

    // Stop background music when game ends
    if (isMusicPlaying) {
      toggleMusic();
    }

    // Play game over sound
    playGameOver();

    // Show result modal
    setShowResultModal(true);
  }, [elapsedTime, playGameOver, isMusicPlaying, toggleMusic]);

  // Animate blockers downward
  const animateBlockers = useCallback(() => {
    const animate = () => {
      if (gameStateRef.current !== 'playing') {
        animationFrameRef.current = null;
        return;
      }

      setBlockers((prev) => {
        const updated = prev.map((blocker) => ({
          ...blocker,
          progress: blocker.progress + BLOCKER_SPEED,
        }));

        // Check for collisions
        updated.forEach((blocker) => {
          if (blocker.progress >= 95 && currentLaneRef.current === blocker.lane) {
            // Collision detected!
            endGame();
          }
        });

        // Remove blockers that have passed the bottom
        return updated.filter((blocker) => blocker.progress < 100);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [endGame]);

  // Spawn blockers
  const spawnBlockersRef = useRef<(() => void) | null>(null);
  const spawnBlockers = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const lanes: Lane[] = ['left', 'center', 'right'];
    const safeLaneIndex = Math.floor(Math.random() * 3);
    const safeLane = lanes[safeLaneIndex];

    // Spawn blockers in 2 out of 3 lanes (excluding safe lane)
    const blockersToSpawn: Blocker[] = lanes
      .filter((lane) => lane !== safeLane)
      .map((lane) => ({
        id: `${Date.now()}-${Math.random()}`,
        lane,
        progress: 0,
      }));

    setBlockers((prev) => [...prev, ...blockersToSpawn]);

    // Increase difficulty (decrease spawn interval)
    const newInterval = Math.max(MIN_SPAWN_INTERVAL, spawnIntervalRef.current - SPEED_DECREMENT);
    spawnIntervalRef.current = newInterval;
    spawnTimeoutRef.current = setTimeout(() => {
      // Check if still playing before spawning
      if (gameStateRef.current === 'playing' && spawnBlockersRef.current) {
        spawnBlockersRef.current();
      }
    }, newInterval);
  }, []);
  
  // Set ref after declaration to enable recursive calls (in effect to avoid render-time ref update)
  useEffect(() => {
    spawnBlockersRef.current = spawnBlockers;
  }, [spawnBlockers]);

  // Begin playing
  const beginPlaying = useCallback(() => {
    setGameState('playing');
    gameStartTimeRef.current = Date.now();
    startTimer();
    spawnBlockers();
    animateBlockers();
  }, [startTimer, spawnBlockers, animateBlockers]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(5);
    // Start background music during countdown for better anticipation
    if (!isMusicPlaying) {
      toggleMusic();
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          beginPlaying();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [beginPlaying, isMusicPlaying, toggleMusic]);

  // Wait for full body detection
  useEffect(() => {
    if (gameState !== 'ready' || !landmarks) return;

    // Safety check: if pose detection fails, don't crash
    if (error) {
      return;
    }

    try {
      const leftShoulder = landmarks.leftShoulder;
      const rightShoulder = landmarks.rightShoulder;
      const leftHip = landmarks.leftHip;
      const rightHip = landmarks.rightHip;

      // Check if full body is visible (shoulders and hips detected)
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        // Check if body is tall enough (distance between shoulders and hips)
        const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const hipY = (leftHip.y + rightHip.y) / 2;
        const bodyHeight = hipY - shoulderY;

        if (bodyHeight > 0.2) {
          // Full body detected, start countdown
          setTimeout(() => {
            startCountdown();
          }, 0);
        }
      }
    } catch (err) {
      console.error('Error in full body detection:', err);
      // Don't crash, just log the error
    }
  }, [gameState, landmarks, startCountdown, error]);

  // Keep refs in sync
  useEffect(() => {
    currentLaneRef.current = currentLane;
  }, [currentLane]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Restart animation when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      animateBlockers();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [gameState, animateBlockers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Loading pose detection...';
    if (error) return `Error: ${error}`;
    if (gameState === 'idle') return 'Step back until your full body is visible on camera.';
    if (gameState === 'ready') return 'Step back. Full body must be visible.';
    if (gameState === 'countdown') return `Starting in ${countdown}...`;
    if (gameState === 'playing') return 'SURVIVE!';
    if (gameState === 'over') return `CAUGHT! Time Survived: ${Math.floor(elapsedTime)}s`;
    return 'Initializing...';
  };

  // Get lane indicator class
  const getLaneIndicatorClass = (lane: Lane) => {
    if (currentLane === lane) {
      return 'bg-green-500 border-green-300';
    }
    return 'bg-transparent border-gray-600';
  };

  // Note: saveGameResult is now called in ResultModal on mount for optimistic UI
  // This ensures the score is saved immediately when the modal appears

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Selection Screen */}
      {gameState === 'idle' && (
        <section className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-4">Patintero</h1>
          <p className="text-lg mb-8">Step back until your full body is visible on camera.</p>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
          >
            START GAME
          </button>
        </section>
      )}

      {/* Lobby - Calibration Check */}
      {gameState === 'lobby' && <CalibrationCheck onCalibrated={handleCalibrated} />}

      {/* Game Screen */}
      {gameState !== 'idle' && gameState !== 'lobby' && (
        <section
          className="relative w-full h-screen overflow-hidden touch-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          {/* Camera Error UI */}
          {error && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-white">
              <div className="text-center p-8 glass-modern rounded-3xl max-w-md mx-4">
                <p className="text-xl md:text-2xl font-display font-bold mb-4 text-white drop-shadow-lg">
                  Camera Error
                </p>
                <p className="text-sm md:text-base text-white/80 mb-6 font-body drop-shadow-md">
                  {error}
                </p>
                <button
                  onClick={() => {
                    setGameState('idle');
                    window.location.reload();
                  }}
                  className="px-6 py-3 bg-brand-blue hover:bg-blue-600 rounded-full text-sm font-semibold font-display uppercase tracking-wide transition-colors shadow-lg hover:shadow-xl"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )}

          {/* Webcam Video */}
          <div className="relative w-full h-full touch-none">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored
              className="w-full h-full object-cover"
              videoConstraints={{
                facingMode: 'user',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                aspectRatio: { ideal: 16 / 9 },
              }}
              onUserMediaError={(err) => {
                console.error('Webcam error:', err);
              }}
            />

            {/* 3-Lane Grid System */}
            <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
              {/* Left Lane */}
              <div
                className={`border-r-2 border-dashed transition-colors ${getLaneIndicatorClass('left')}`}
              />

              {/* Center Lane */}
              <div
                className={`border-r-2 border-dashed transition-colors ${getLaneIndicatorClass('center')}`}
              />

              {/* Right Lane */}
              <div className={`transition-colors ${getLaneIndicatorClass('right')}`} />
            </div>

            {/* Blockers */}
            {blockers.map((blocker) => (
              <div
                key={blocker.id}
                className="absolute w-full h-16 bg-red-500/80 border-2 border-red-300 z-20 pointer-events-none"
                style={{
                  left:
                    blocker.lane === 'left'
                      ? '0%'
                      : blocker.lane === 'center'
                        ? '33.33%'
                        : '66.66%',
                  width: '33.33%',
                  top: `${blocker.progress}%`,
                  transform: 'translateY(-50%)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                }}
              />
            ))}

            {/* Player Indicator (Nose position) */}
            {gameState === 'playing' && landmarks?.nose && (
              <div
                className="absolute w-8 h-8 bg-green-500 rounded-full border-2 border-white z-30 pointer-events-none"
                style={{
                  left: `${landmarks.nose.x * 100}%`,
                  top: `${landmarks.nose.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                }}
              />
            )}
          </div>

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 right-4 z-30 bg-black/70 p-4 rounded-lg">
            <p className="text-lg font-semibold mb-2">{getStatusText()}</p>
            <p className="text-sm">
              Time: <span className="font-bold">{Math.floor(elapsedTime)}</span>s
              {currentLane && (
                <span className="ml-4">
                  Lane: <span className="font-bold capitalize">{currentLane}</span>
                </span>
              )}
            </p>
            {!isDetecting && gameState === 'playing' && (
              <p className="text-yellow-400 text-sm mt-2">No pose detected. Make sure you&apos;re visible!</p>
            )}
          </div>
        </section>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <ResultModal
          score={finalScore}
          calories={finalCalories}
          gameType="patintero"
          onClose={() => {
            setShowResultModal(false);
            setGameState('idle');
          }}
        />
      )}
    </div>
  );
}

