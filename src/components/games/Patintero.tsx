'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import { useGameFeedback } from '@/hooks/useGameFeedback';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';
import TutorialModal from '@/components/game/TutorialModal';
import GameMechanicsModal from '@/components/game/GameMechanicsModal';
import GameHUD from '@/components/game/GameHUD';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'over';

type Lane = 'left' | 'center' | 'right';

interface Blocker {
  id: string;
  lane: Lane;
  progress: number; // 0 to 100 (percentage from top to bottom)
}

interface PowerUp {
  id: string;
  lane: Lane;
  progress: number;
  type: 'shield' | 'slowTime';
}

type PowerUpType = 'shield' | 'slowTime';

// Hysteresis thresholds to prevent jittering (reduced to 5% buffer for snappier movement)
// Different thresholds for entering vs leaving a lane
const LANE_HYSTERESIS = {
  // Move LEFT if nose.x < 0.35 (from center or right)
  enterLeft: 0.35,
  // Return to CENTER from Left if nose.x > 0.40 (5% buffer - snappier than before)
  exitLeftToCenter: 0.40,
  // Move RIGHT if nose.x > 0.65 (from center or left)
  enterRight: 0.65,
  // Return to CENTER from Right if nose.x < 0.60 (5% buffer - snappier than before)
  exitRightToCenter: 0.60,
};

const INITIAL_SPAWN_INTERVAL = 4000; // milliseconds
const MIN_SPAWN_INTERVAL = 400;
const SPEED_DECREMENT = 120;
const BLOCKER_SPEED = 2; // pixels per frame (or percentage per frame)
const FEVER_MODE_THRESHOLD = 10; // Consecutive dodges needed
const ADAPTIVE_SPEED_INTERVAL = 30000; // 30 seconds
const POWERUP_SPAWN_CHANCE = 0.15; // 15% chance per spawn
const POWERUP_DURATION = 5000; // 5 seconds
const PITY_TIMER_DURATION = 5000; // 5 seconds after hit to force-spawn Shield
const RUBBER_BAND_HITS_THRESHOLD = 2; // Hits needed to trigger rubber banding
const RUBBER_BAND_TIME_WINDOW = 10000; // 10 seconds window
const RUBBER_BAND_SLOWDOWN = 0.8; // 20% slowdown (multiply by 0.8)
const RUBBER_BAND_DURATION = 5000; // 5 seconds of slowdown
const MAX_SPEED_MULTIPLIER = 2.5; // Hard cap on enemy speed multiplier

export default function Patintero(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting } = usePoseDetection(webcamRef);
  const { playGameOver, toggleMusic, isMusicPlaying } = useGameSound();
  const { triggerFeedback } = useGameFeedback();

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [currentLane, setCurrentLane] = useState<Lane | null>(null);
  const spawnIntervalRef = useRef(INITIAL_SPAWN_INTERVAL);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCalories, setFinalCalories] = useState(0);
  const [comboCount, setComboCount] = useState(0); // Consecutive dodges
  const [feverMode, setFeverMode] = useState(false);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [blockerSpeedMultiplier, setBlockerSpeedMultiplier] = useState(1.0); // Adaptive difficulty
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hitsTaken, setHitsTaken] = useState<number[]>([]); // Array of hit timestamps for rubber banding (only set, never read directly)
  const [rubberBandingActive, setRubberBandingActive] = useState(false); // Rubber banding state
  const [rubberBandingEndTime, setRubberBandingEndTime] = useState<number | null>(null); // When rubber banding ends
  const [rubberBandingTimeRemaining, setRubberBandingTimeRemaining] = useState(0); // Time remaining for rubber banding
  const [showMechanics, setShowMechanics] = useState(true); // Mechanics modal visibility
  const [showTutorial, setShowTutorial] = useState(false); // Tutorial modal visibility
  const [isUnlocked, setIsUnlocked] = useState(false); // Challenge completion status

  // Refs
  const gameStartTimeRef = useRef<number>(0);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLaneRef = useRef<Lane | null>(null);
  const gameStateRef = useRef<GameState>('idle');
  const powerUpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAdaptiveSpeedCheckRef = useRef<number>(0);
  const pityTimerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Unlock logic: Check if user moves left or right (nose.x < 0.4 or > 0.6)
  useEffect(() => {
    if (isUnlocked || !showTutorial) return; // Already unlocked or tutorial closed
    
    if (!landmarks?.nose) return;
    
    const noseX = landmarks.nose.x;
    
    // Check if user moves left or right
    if (noseX < 0.4 || noseX > 0.6) {
      setTimeout(() => {
        setIsUnlocked(true);
      }, 0);
    }
  }, [landmarks, isUnlocked, showTutorial]);

  // Determine player lane from nose X coordinate with hysteresis
  useEffect(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
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
      const currentLaneValue = currentLane; // Get current lane state

      setTimeout(() => {
        let newLane: Lane;

        // Apply hysteresis based on current lane
        if (currentLaneValue === 'left') {
          // Currently in left lane
          // Only switch to center if nose moves past the exit threshold
          if (noseX > LANE_HYSTERESIS.exitLeftToCenter) {
            // Check if should go to right or center
            if (noseX > LANE_HYSTERESIS.enterRight) {
              newLane = 'right';
            } else {
              newLane = 'center';
            }
          } else {
            // Stay in left lane
            newLane = 'left';
          }
        } else if (currentLaneValue === 'right') {
          // Currently in right lane
          // Only switch to center if nose moves past the exit threshold
          if (noseX < LANE_HYSTERESIS.exitRightToCenter) {
            // Check if should go to left or center
            if (noseX < LANE_HYSTERESIS.enterLeft) {
              newLane = 'left';
            } else {
              newLane = 'center';
            }
          } else {
            // Stay in right lane
            newLane = 'right';
          }
        } else {
          // Currently in center (or null/initial state)
          // Use entry thresholds to switch lanes
          if (noseX < LANE_HYSTERESIS.enterLeft) {
            newLane = 'left';
          } else if (noseX > LANE_HYSTERESIS.enterRight) {
            newLane = 'right';
          } else {
            newLane = 'center';
          }
        }

        setCurrentLane(newLane);
      }, 0);
    } catch (err) {
      console.error('Error in lane detection:', err);
      setTimeout(() => {
        setCurrentLane(null);
      }, 0);
    }
  }, [landmarks, gameState, error, currentLane, showTutorial]);

  // Start game (go to lobby for calibration)
  const startGame = useCallback(() => {
    setGameState('lobby');
    setElapsedTime(0);
    setBlockers([]);
    setPowerUps([]);
    setCurrentLane(null);
    spawnIntervalRef.current = INITIAL_SPAWN_INTERVAL;
    setShowResultModal(false);
    setComboCount(0);
    setFeverMode(false);
    setActivePowerUp(null);
    setPowerUpTimer(0);
    setBlockerSpeedMultiplier(1.0);
    setHitsTaken([]);
    setRubberBandingActive(false);
    setRubberBandingEndTime(null);
    lastAdaptiveSpeedCheckRef.current = 0;
    // Clear power-up timeout
    if (powerUpTimeoutRef.current) {
      clearTimeout(powerUpTimeoutRef.current);
      powerUpTimeoutRef.current = null;
    }
    // Clear pity timer timeout
    if (pityTimerTimeoutRef.current) {
      clearTimeout(pityTimerTimeoutRef.current);
      pityTimerTimeoutRef.current = null;
    }
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

    // Calculate score (time survived in seconds, with fever mode bonus)
    const baseScore = Math.floor(elapsedTime);
    const comboBonus = feverMode ? comboCount * 2 : 0;
    const score = baseScore + comboBonus;
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
  }, [elapsedTime, playGameOver, isMusicPlaying, toggleMusic, comboCount, feverMode]);

  // Animate blockers and power-ups downward
  const animateBlockers = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    const animate = () => {
      if (gameStateRef.current !== 'playing') {
        animationFrameRef.current = null;
        return;
      }

      // Calculate speed with all modifiers
      let speedMultiplier = blockerSpeedMultiplier;
      
      // Apply rubber banding slowdown (20% reduction)
      if (rubberBandingActive) {
        speedMultiplier *= RUBBER_BAND_SLOWDOWN;
      }
      
      // Apply fever mode slowdown (50% reduction)
      if (feverMode) {
        speedMultiplier *= 0.5;
      }
      
      const speed = BLOCKER_SPEED * speedMultiplier;

      setBlockers((prev) => {
        const updated = prev.map((blocker) => ({
          ...blocker,
          progress: blocker.progress + speed,
        }));

        // Check for collisions (only if no shield active)
        updated.forEach((blocker) => {
          if (blocker.progress >= 95 && currentLaneRef.current === blocker.lane) {
            if (activePowerUp === 'shield') {
              // Shield protects - remove blocker and increase combo
              setComboCount((prev) => {
                const newCombo = prev + 1;
                if (newCombo >= FEVER_MODE_THRESHOLD && !feverMode) {
                  setFeverMode(true);
                  triggerFeedback('perfect');
                }
                return newCombo;
              });
              triggerFeedback('good');
            } else {
              // Collision detected! Record hit for rubber banding and pity timer
              const hitTime = Date.now();
              
              // Update hits taken array and check for rubber banding
              setHitsTaken((prev) => {
                const updatedHits = [...prev, hitTime];
                const recentHits = updatedHits.filter((time) => hitTime - time <= RUBBER_BAND_TIME_WINDOW);
                
                // Check for rubber banding (hitsTaken >= 2 in last 10 seconds)
                if (recentHits.length >= RUBBER_BAND_HITS_THRESHOLD) {
                  // Trigger rubber banding - slow enemies by 20%
                  setRubberBandingActive(true);
                  setRubberBandingEndTime(hitTime + RUBBER_BAND_DURATION);
                  
                  // Auto-disable rubber banding after duration
                  setTimeout(() => {
                    setRubberBandingActive(false);
                    setRubberBandingEndTime(null);
                  }, RUBBER_BAND_DURATION);
                }
                
                return updatedHits;
              });
              
              // Trigger pity timer - force-spawn Shield within 5 seconds
              if (pityTimerTimeoutRef.current) {
                clearTimeout(pityTimerTimeoutRef.current);
              }
              pityTimerTimeoutRef.current = setTimeout(() => {
                // Force-spawn a Shield power-up in a safe lane
                const lanes: Lane[] = ['left', 'center', 'right'];
                const safeLane = lanes[Math.floor(Math.random() * 3)];
                const shieldPowerUp: PowerUp = {
                  id: `pity-shield-${Date.now()}-${Math.random()}`,
                  lane: safeLane,
                  progress: 0,
                  type: 'shield',
                };
                setPowerUps((prev) => [...prev, shieldPowerUp]);
                pityTimerTimeoutRef.current = null;
              }, PITY_TIMER_DURATION);
              
              endGame();
            }
          } else if (blocker.progress >= 100) {
            // Blocker passed safely - increase combo
            setComboCount((prev) => {
              const newCombo = prev + 1;
              if (newCombo >= FEVER_MODE_THRESHOLD && !feverMode) {
                setFeverMode(true);
                triggerFeedback('perfect');
              }
              return newCombo;
            });
          }
        });

        // Remove blockers that have passed the bottom
        return updated.filter((blocker) => blocker.progress < 100);
      });

      // Animate power-ups
      setPowerUps((prev) => {
        const updated = prev.map((powerUp) => ({
          ...powerUp,
          progress: powerUp.progress + speed,
        }));

        // Check for power-up collection
        updated.forEach((powerUp) => {
          if (powerUp.progress >= 95 && currentLaneRef.current === powerUp.lane) {
            // Collect power-up
            setActivePowerUp(powerUp.type);
            setPowerUpTimer(POWERUP_DURATION);
            
            // Start power-up timer
            if (powerUpTimeoutRef.current) {
              clearTimeout(powerUpTimeoutRef.current);
            }
            powerUpTimeoutRef.current = setTimeout(() => {
              setActivePowerUp(null);
              setPowerUpTimer(0);
              powerUpTimeoutRef.current = null;
            }, POWERUP_DURATION);
            
            triggerFeedback('good');
          }
        });

        // Remove power-ups that have passed the bottom
        return updated.filter((powerUp) => powerUp.progress < 100);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [endGame, blockerSpeedMultiplier, feverMode, activePowerUp, triggerFeedback, showTutorial, rubberBandingActive]);

  // Spawn blockers and power-ups
  const spawnBlockersRef = useRef<(() => void) | null>(null);
  const spawnBlockers = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
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

    // Spawn power-up with chance (in safe lane)
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
      const powerUpType: PowerUpType = Math.random() < 0.5 ? 'shield' : 'slowTime';
      const powerUp: PowerUp = {
        id: `powerup-${Date.now()}-${Math.random()}`,
        lane: safeLane,
        progress: 0,
        type: powerUpType,
      };
      setPowerUps((prev) => [...prev, powerUp]);
    }

    // Increase difficulty (decrease spawn interval)
    const newInterval = Math.max(MIN_SPAWN_INTERVAL, spawnIntervalRef.current - SPEED_DECREMENT);
    spawnIntervalRef.current = newInterval;
    spawnTimeoutRef.current = setTimeout(() => {
      // Check if still playing before spawning
      if (gameStateRef.current === 'playing' && spawnBlockersRef.current) {
        spawnBlockersRef.current();
      }
    }, newInterval);
  }, [showTutorial]);
  
  // Set ref after declaration to enable recursive calls (in effect to avoid render-time ref update)
  useEffect(() => {
    spawnBlockersRef.current = spawnBlockers;
  }, [spawnBlockers]);

  // Begin playing
  const beginPlaying = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    setGameState('playing');
    gameStartTimeRef.current = Date.now();
    lastAdaptiveSpeedCheckRef.current = Date.now();
    startTimer();
    spawnBlockers();
    animateBlockers();
  }, [startTimer, spawnBlockers, animateBlockers, showTutorial]);


  // Adaptive difficulty - increase speed if surviving too long (with hard cap)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const checkAdaptiveSpeed = setInterval(() => {
      const now = Date.now();
      if (now - lastAdaptiveSpeedCheckRef.current >= ADAPTIVE_SPEED_INTERVAL) {
        setBlockerSpeedMultiplier((prev) => Math.min(MAX_SPEED_MULTIPLIER, prev + 0.1)); // Hard cap at 2.5x
        lastAdaptiveSpeedCheckRef.current = now;
      }
    }, 5000);

    return () => clearInterval(checkAdaptiveSpeed);
  }, [gameState]);

  // Clean up old hits from rubber banding calculation (older than 10 seconds)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const cleanupHits = setInterval(() => {
      const now = Date.now();
      setHitsTaken((prev) => prev.filter((time) => now - time <= RUBBER_BAND_TIME_WINDOW));
    }, 1000); // Check every second

    return () => clearInterval(cleanupHits);
  }, [gameState]);

  // Power-up timer countdown
  useEffect(() => {
    if (activePowerUp && powerUpTimer > 0) {
      const timer = setInterval(() => {
        setPowerUpTimer((prev) => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activePowerUp, powerUpTimer]);

  // Rubber banding timer countdown
  useEffect(() => {
    if (rubberBandingEndTime) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((rubberBandingEndTime - Date.now()) / 1000));
        setRubberBandingTimeRemaining(remaining);
        if (remaining === 0) {
          setRubberBandingEndTime(null);
        }
      }, 100);
      return () => clearInterval(timer);
    } else {
      setTimeout(() => {
        setRubberBandingTimeRemaining(0);
      }, 0);
    }
  }, [rubberBandingEndTime]);

  // Start countdown
  const startCountdown = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
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
  }, [beginPlaying, isMusicPlaying, toggleMusic, showTutorial]);

  // Removed auto-start logic - user should click START button instead

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
      if (powerUpTimeoutRef.current) clearTimeout(powerUpTimeoutRef.current);
      if (pityTimerTimeoutRef.current) clearTimeout(pityTimerTimeoutRef.current);
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
                  boxShadow: feverMode 
                    ? '0 0 30px rgba(251, 191, 36, 0.8)' 
                    : '0 0 20px rgba(239, 68, 68, 0.5)',
                  opacity: feverMode ? 0.7 : 1,
                }}
              />
            ))}

            {/* Power-ups (Agimat) */}
            {powerUps.map((powerUp) => (
              <motion.div
                key={powerUp.id}
                className="absolute w-full h-16 z-25 pointer-events-none"
                style={{
                  left:
                    powerUp.lane === 'left'
                      ? '0%'
                      : powerUp.lane === 'center'
                        ? '33.33%'
                        : '66.66%',
                  width: '33.33%',
                  top: `${powerUp.progress}%`,
                  transform: 'translateY(-50%)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div
                  className={`w-full h-full rounded-lg border-2 ${
                    powerUp.type === 'shield'
                      ? 'bg-blue-500/80 border-blue-300'
                      : 'bg-purple-500/80 border-purple-300'
                  }`}
                  style={{
                    boxShadow: `0 0 30px ${
                      powerUp.type === 'shield' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(168, 85, 247, 0.8)'
                    }`,
                  }}
                >
                  <div className="flex items-center justify-center h-full text-white font-bold text-lg">
                    {powerUp.type === 'shield' ? '🛡️' : '⏱️'}
                  </div>
                </div>
              </motion.div>
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

          {/* START Button in Ready State */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-auto">
              <button
                onClick={startCountdown}
                className="px-12 py-6 bg-brand-yellow hover:bg-yellow-500 text-black font-display font-bold text-2xl rounded-2xl shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                START
              </button>
            </div>
          )}

          {/* HUD Overlay */}
          <GameHUD
            status={feverMode ? '🔥 FEVER MODE 🔥' : getStatusText()}
            timer={elapsedTime}
            lane={currentLane || undefined}
            comboCount={feverMode ? comboCount : undefined}
            activePowerUp={activePowerUp || undefined}
            powerUpTimer={powerUpTimer}
            feverMode={feverMode}
            rubberBandingActive={rubberBandingActive}
            rubberBandingTimeRemaining={rubberBandingTimeRemaining}
            showPoseWarning={!isDetecting && gameState === 'playing'}
          />
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

      {/* Game Mechanics Modal */}
      <GameMechanicsModal
        gameType="patintero"
        isOpen={showMechanics}
        onClose={() => {
          setShowMechanics(false);
          setShowTutorial(false);
        }}
        onContinue={() => {
          setShowMechanics(false);
          setShowTutorial(true);
        }}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        gameType="patintero"
        isOpen={showTutorial}
        isChallengeComplete={isUnlocked}
        onComplete={() => {
          setShowTutorial(false);
          startGame();
        }}
      />
    </div>
  );
}

