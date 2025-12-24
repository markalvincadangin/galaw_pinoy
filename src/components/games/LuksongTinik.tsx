'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import { useGameFeedback, FeedbackPopup } from '@/hooks/useGameFeedback';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';
import TutorialModal from '@/components/game/TutorialModal';
import { saveGameResult } from '@/app/actions/game';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'paused' | 'over';

const MAX_LEVELS = 5;
const INITIAL_TIMER = 60;
const INITIAL_HURDLE_Y = 0.8; // 80% from top (normalized)
const MAX_STAMINA = 100;
const JUMP_STAMINA_COST = 20; // Lowered from 30 for better balance
const STAMINA_REGEN_STILL = 15; // Regeneration when standing still (per second)
const STAMINA_REGEN_MOVING = 0; // No regeneration when moving/jumping
const MIN_STAMINA_TO_JUMP = 30;
const PERFECT_ZONE_THRESHOLD = 0.1; // Hurdle within 10% of ground = perfect timing
const GOOD_ZONE_THRESHOLD = 0.2; // Hurdle within 20% of ground = good timing
const STABILITY_VARIANCE = 0.03; // 30px equivalent in normalized coordinates (3%)
const HIP_VELOCITY_THRESHOLD = 0.001; // Threshold for "standing still" (normalized/ms)

export default function LuksongTinik(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting, userHeight } = usePoseDetection(webcamRef);
  const { playJump, playScore, playGameOver, toggleMusic, isMusicPlaying } = useGameSound();
  const { feedback, screenShake, shakeIntensity, screenFlash, triggerFeedback } = useGameFeedback();

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [hurdleY, setHurdleY] = useState(INITIAL_HURDLE_Y);
  const [countdown, setCountdown] = useState(3);
  const [cooldown, setCooldown] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCalories, setFinalCalories] = useState(0);
  const [isJumping, setIsJumping] = useState(false); // Track jump state for debouncing
  const [poseDetectionError, setPoseDetectionError] = useState<string | null>(null);
  const [groundHipY, setGroundHipY] = useState<number | null>(null); // Baseline hip position
  const [jumpCooldown, setJumpCooldown] = useState(false); // Cooldown after jump registration
  const [stamina, setStamina] = useState(MAX_STAMINA); // Stamina (0-100)
  const [comboPopup, setComboPopup] = useState<{ type: 'perfect' | 'good' | null; key: number }>({ type: null, key: 0 });
  const [cameraZoom, setCameraZoom] = useState(1); // Dynamic camera zoom (1.0 = normal)
  const [jumpStartX, setJumpStartX] = useState<number | null>(null); // Track X position at jump start for stability calculation
  const [previousHipY, setPreviousHipY] = useState<number | null>(null); // Track previous hip Y for velocity calculation
  const [hipVelocity, setHipVelocity] = useState(0); // Current hip velocity for stamina regen logic
  const [showTutorial, setShowTutorial] = useState(true); // Tutorial modal visibility
  const [isUnlocked, setIsUnlocked] = useState(false); // Challenge completion status

  // Timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const jumpCooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const staminaRegenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track current values for endGame
  const scoreRef = useRef(0);
  const levelRef = useRef(0);
  
  // Keep refs in sync with state
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // Detect score increase and trigger visual/sound feedback
  const prevScoreRef = useRef(score);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (score > prevScoreRef.current) {
      // Score increased (successful jump) - trigger flash and sound
      // This happens when levelClear() is called during gameplay
      // Use setTimeout to defer setState and avoid synchronous setState in effect
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      // Defer setState to next tick to avoid synchronous setState warning
      setTimeout(() => {
        setIsFlashing(true);
      }, 0);
      playJump();
      playScore();
      
      // Reset flash after 500ms
      flashTimeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
        flashTimeoutRef.current = null;
      }, 500);
      
      prevScoreRef.current = score;
    } else {
      prevScoreRef.current = score;
    }
    
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = null;
      }
    };
  }, [score, playJump, playScore]);

  // Start game (go to lobby for calibration)
  const startGame = useCallback(() => {
    setGameState('lobby');
    setScore(0);
    setLevel(0);
    setTimer(INITIAL_TIMER);
    setHurdleY(INITIAL_HURDLE_Y);
    setCooldown(false);
    setIsFlashing(false);
    setShowResultModal(false);
    setIsJumping(false);
    setPoseDetectionError(null);
    setGroundHipY(null); // Reset ground position
    setJumpCooldown(false); // Reset jump cooldown
    setStamina(MAX_STAMINA); // Reset stamina
    setComboPopup({ type: null, key: 0 }); // Reset combo popup
    setJumpStartX(null); // Reset jump start position
    setPreviousHipY(null); // Reset hip Y tracking
    setHipVelocity(0); // Reset hip velocity
    prevScoreRef.current = 0; // Reset score tracking
    // Clear any existing cooldown timeout
    if (jumpCooldownTimeoutRef.current) {
      clearTimeout(jumpCooldownTimeoutRef.current);
      jumpCooldownTimeoutRef.current = null;
    }
    // Clear stamina regen interval
    if (staminaRegenIntervalRef.current) {
      clearInterval(staminaRegenIntervalRef.current);
      staminaRegenIntervalRef.current = null;
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

  // End game (defined first since it's used by other callbacks)
  const endGame = useCallback(() => {
    // Stop all intervals FIRST to prevent race conditions
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (staminaRegenIntervalRef.current) {
      clearInterval(staminaRegenIntervalRef.current);
      staminaRegenIntervalRef.current = null;
    }

    // Set game state to over
    setGameState('over');

    // Stop webcam
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Calculate calories (rough estimate: ~10 calories per point)
    const calories = scoreRef.current * 10;
    const finalScoreValue = scoreRef.current;
    setFinalScore(finalScoreValue);
    setFinalCalories(calories);

    // Stop background music when game ends
    if (isMusicPlaying) {
      toggleMusic();
    }

    // Play game over sound
    playGameOver();

    // Defer saveGameResult to avoid calling server action during render
    // This prevents the "Cannot update component while rendering" error
    setTimeout(async () => {
      try {
        await saveGameResult('luksong-tinik', finalScoreValue, calories);
      } catch (error) {
        console.error('Failed to save game result:', error);
        // Don't block UI if save fails
      }
    }, 0);

    // Show result modal
    setShowResultModal(true);
  }, [playGameOver, isMusicPlaying, toggleMusic]);

  // Start game timer
  const startGameTimer = useCallback(() => {
    setTimer(INITIAL_TIMER);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Clear interval before calling endGame to prevent race conditions
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [endGame]);

  // Start level
  const startLevel = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    setGameState('playing');
    setCooldown(false);
    startGameTimer();
    
    // Start strategic stamina regeneration (only when standing still)
    if (staminaRegenIntervalRef.current) {
      clearInterval(staminaRegenIntervalRef.current);
    }
    staminaRegenIntervalRef.current = setInterval(() => {
      setStamina((prev) => {
        // Only regenerate if standing still (hip velocity near 0)
        const isStandingStill = Math.abs(hipVelocity) < HIP_VELOCITY_THRESHOLD;
        const regenRate = isStandingStill ? STAMINA_REGEN_STILL : STAMINA_REGEN_MOVING;
        const newStamina = Math.min(MAX_STAMINA, prev + regenRate);
        return newStamina;
      });
    }, 1000); // Check every second
  }, [startGameTimer, hipVelocity, showTutorial]);

  // Start countdown
  const startCountdown = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    setGameState('countdown');
    setCountdown(3);
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
          startLevel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startLevel, isMusicPlaying, toggleMusic, showTutorial]);

  // Level clear with combo detection and stability multiplier
  const levelClear = useCallback((comboType: 'perfect' | 'good' | 'normal' = 'normal') => {
    setCooldown(true);
    
    // Calculate base score bonus based on combo type (timing)
    let baseScore = 1;
    if (comboType === 'perfect') {
      baseScore = 10;
    } else if (comboType === 'good') {
      baseScore = 5;
    }
    
    // Calculate stability multiplier (will be applied when landing is detected)
    // Store landing X for stability check in jump detection effect
    // The actual multiplier will be applied in the landing detection logic
    
    setScore((prev) => prev + baseScore);
    setLevel((prev) => {
      const newLevel = prev + 1;
      
      if (newLevel >= MAX_LEVELS) {
        endGame();
        return newLevel;
      }

      // Increase difficulty by raising hurdle (decreasing Y)
      setHurdleY((prevY) => {
        const newY = prevY - 0.1; // Move hurdle up by 10%
        return Math.max(0.25, newY); // Minimum 25% from top
      });

      setGameState('paused');
      
      // Stop stamina regeneration when paused
      if (staminaRegenIntervalRef.current) {
        clearInterval(staminaRegenIntervalRef.current);
        staminaRegenIntervalRef.current = null;
      }
      
      // Reset cooldown after 500ms
      setTimeout(() => {
        setCooldown(false);
      }, 500);

      return newLevel;
    });

    // Consume stamina
    setStamina((prev) => Math.max(0, prev - JUMP_STAMINA_COST));

    // Start jump cooldown: ignore inputs for 1 second
    setJumpCooldown(true);
    if (jumpCooldownTimeoutRef.current) {
      clearTimeout(jumpCooldownTimeoutRef.current);
    }
    jumpCooldownTimeoutRef.current = setTimeout(() => {
      setJumpCooldown(false);
      jumpCooldownTimeoutRef.current = null;
    }, 1000);
  }, [endGame]);

  // Unlock logic: Check if user jumps (hipVelocity < -5.0 normalized/second)
  useEffect(() => {
    if (isUnlocked || !showTutorial) return; // Already unlocked or tutorial closed
    
    // Convert hipVelocity from normalized/ms to normalized/second for comparison
    // hipVelocity is calculated as deltaY / deltaTime (in ms), so multiply by 1000
    const hipVelocityPerSecond = hipVelocity * 1000;
    
    // Check if jumping up (negative velocity = moving up)
    if (hipVelocityPerSecond < -5.0) {
      setIsUnlocked(true);
    }
  }, [hipVelocity, isUnlocked, showTutorial]);

  // Establish ground hip position when game starts
  useEffect(() => {
    if (gameState === 'playing' && landmarks && !groundHipY) {
      const leftHip = landmarks.leftHip;
      const rightHip = landmarks.rightHip;
      
      if (leftHip && rightHip) {
        // Use average of left and right hip as ground position
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        setGroundHipY(avgHipY);
      }
    }
    
    // Reset ground position when game state changes
    if (gameState !== 'playing') {
      setGroundHipY(null);
    }
  }, [gameState, landmarks, groundHipY]);

  // Check jump detection with hip-based logic and combo system
  useEffect(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    if (gameState !== 'playing' || cooldown || jumpCooldown) {
      // Reset jump state when not playing, in cooldown, or in jump cooldown
      if (isJumping) {
        setTimeout(() => {
          setIsJumping(false);
        }, 0);
      }
      return;
    }

    // Check stamina - can't jump if too tired
    if (stamina < MIN_STAMINA_TO_JUMP) {
      return;
    }

    // Safety check: if pose detection fails, show error UI
    if (error) {
      setTimeout(() => {
        setPoseDetectionError(error);
      }, 0);
      return;
    } else {
      setTimeout(() => {
        setPoseDetectionError(null);
      }, 0);
    }

    if (!landmarks || !groundHipY || !userHeight) {
      return;
    }

    try {
      const leftHip = landmarks.leftHip;
      const rightHip = landmarks.rightHip;

      if (!leftHip || !rightHip) {
        // Reset jump state if landmarks are missing
        if (isJumping) {
          setTimeout(() => {
            setIsJumping(false);
          }, 0);
        }
        return;
      }

      // Calculate current average hip Y position
      const currentHipY = (leftHip.y + rightHip.y) / 2;
      const currentHipX = (leftHip.x + rightHip.x) / 2;
      
      // Calculate hip velocity for stamina regen logic
      if (previousHipY !== null) {
        const deltaTime = 16; // Approximate frame time (60fps = ~16ms)
        const deltaY = currentHipY - previousHipY;
        const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
        setHipVelocity(velocity);
      }
      setPreviousHipY(currentHipY);
      
      // Jump threshold: hip must be 15% of userHeight above ground position
      // In normalized coordinates, smaller Y = higher position
      const jumpThreshold = groundHipY - (userHeight * 0.15);
      const isJumpingNow = currentHipY < jumpThreshold;
      
      // Dynamic camera zoom based on jump height (1.0 to 1.2 scale)
      if (isJumpingNow && groundHipY !== null) {
        const height = groundHipY - currentHipY;
        const zoom = 1.0 + Math.min(0.2, height * 2);
        setCameraZoom(zoom);
      } else if (!isJumpingNow && isJumping) {
        // Reset zoom when landing
        setCameraZoom(1.0);
      }

      // Debouncing logic: only trigger score when transitioning from not jumping to jumping
      if (isJumpingNow && !isJumping) {
        // User just jumped - store jump start position for stability calculation
        setJumpStartX(currentHipX);
        
        // Detect combo timing (hurdle position)
        let comboType: 'perfect' | 'good' | 'normal' = 'normal';
        
        // Calculate distance from hurdle to ground
        // Hurdle is at hurdleY, ground is at groundHipY
        // Smaller values = higher position, so hurdleY < groundHipY means hurdle is above ground
        const hurdleToGroundDistance = Math.abs(hurdleY - groundHipY);
        
        // Perfect: hurdle is very close to ground (danger zone)
        if (hurdleToGroundDistance <= PERFECT_ZONE_THRESHOLD) {
          comboType = 'perfect';
        }
        // Good: hurdle is moderately close to ground
        else if (hurdleToGroundDistance <= GOOD_ZONE_THRESHOLD) {
          comboType = 'good';
        }
        
        setTimeout(() => {
          setIsJumping(true);
        }, 0);
        setTimeout(() => {
          levelClear(comboType);
        }, 0);
        
        // Auto-dismiss combo popup after 2 seconds
        setTimeout(() => {
          setComboPopup({ type: null, key: Date.now() });
        }, 2000);
      } else if (!isJumpingNow && isJumping) {
        // User has returned to ground - check landing stability for scoring multiplier
        if (jumpStartX !== null) {
          const horizontalShift = Math.abs(currentHipX - jumpStartX);
          const isStable = horizontalShift < STABILITY_VARIANCE;
          
          // Apply stability multiplier to score
          const stabilityMultiplier = isStable ? 3 : 1;
          
          if (isStable) {
            triggerFeedback('stable');
            // Show "PERFECT FORM" label
            setComboPopup({ type: 'perfect', key: Date.now() });
            // Apply 3x multiplier to current score
            setScore((prev) => prev * stabilityMultiplier);
          } else {
            triggerFeedback('wobbly');
            // Show "WOBBLY" label (using 'good' type for visual, but it means wobbly)
            setComboPopup({ type: 'good', key: Date.now() });
            // No multiplier for wobbly landing (already 1x, score stays the same)
          }
          
          // Reset jump start position
          setJumpStartX(null);
        }
        
        // Reset jump state
        setTimeout(() => {
          setIsJumping(false);
        }, 0);
      }
    } catch (err) {
      console.error('Error in jump detection:', err);
      setTimeout(() => {
        setPoseDetectionError(err instanceof Error ? err.message : 'Pose detection error');
      }, 0);
      // Don't crash the game, show error UI instead
    }
  }, [landmarks, gameState, cooldown, jumpCooldown, groundHipY, userHeight, hurdleY, stamina, levelClear, error, isJumping, jumpStartX, previousHipY, showTutorial, triggerFeedback]);

  // Handle action button
  const handleAction = useCallback(() => {
    if (gameState === 'ready' || gameState === 'paused') {
      startCountdown();
    }
  }, [gameState, startCountdown]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (jumpCooldownTimeoutRef.current) {
        clearTimeout(jumpCooldownTimeoutRef.current);
      }
      if (staminaRegenIntervalRef.current) {
        clearInterval(staminaRegenIntervalRef.current);
      }
    };
  }, []);

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Loading pose detection...';
    if (error) return `Error: ${error}`;
    if (gameState === 'idle') return 'Step back until your full body is visible on camera.';
    if (gameState === 'ready') return 'Step back. Full body must be visible.';
    if (gameState === 'countdown') return `Starting in ${countdown}...`;
    if (gameState === 'playing') {
      if (stamina < MIN_STAMINA_TO_JUMP) {
        return 'Too Tired!';
      }
      return 'JUMP!';
    }
    if (gameState === 'paused') return 'Level Cleared! Press CONTINUE';
    if (gameState === 'over') return 'Game Over!';
    return 'Initializing...';
  };

  // Note: saveGameResult is now called in ResultModal on mount for optimistic UI
  // We still call it in endGame() as a backup, but ResultModal handles the primary save

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Selection Screen */}
      {gameState === 'idle' && (
        <section className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-4">Virtual Luksong Tinik</h1>
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
        <motion.section
          className={`relative w-full h-screen overflow-hidden border-4 transition-colors duration-500 touch-none ${
            isFlashing ? 'border-yellow-400' : 'border-transparent'
          }`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            transform: `scale(${cameraZoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease-out',
          }}
          animate={{
            x: screenShake ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, shakeIntensity, 0] : 0,
            y: screenShake ? [0, shakeIntensity, -shakeIntensity, shakeIntensity, -shakeIntensity, 0] : 0,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
        >
          {/* Screen Flash Overlay */}
          {screenFlash && (
            <div
              className="absolute inset-0 pointer-events-none z-40"
              style={{
                backgroundColor: screenFlash.color,
                opacity: screenFlash.opacity,
                transition: 'opacity 0.3s ease-out',
              }}
            />
          )}
          
          {/* Feedback Popup - using conditional rendering to avoid type issues */}
          {feedback.type && (
            <FeedbackPopup feedback={feedback} />
          )}
          {/* Camera Error UI */}
          {(error || poseDetectionError) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-white">
              <div className="text-center p-8 glass-modern rounded-3xl max-w-md mx-4">
                <p className="text-xl md:text-2xl font-display font-bold mb-4 text-white drop-shadow-lg">
                  Camera Error
                </p>
                <p className="text-sm md:text-base text-white/80 mb-6 font-body drop-shadow-md">
                  {error || poseDetectionError || 'Pose detection failed'}
                </p>
                <button
                  onClick={() => {
                    setGameState('idle');
                    setPoseDetectionError(null);
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

            {/* Hurdle Overlay (CSS border instead of canvas) */}
            {(gameState === 'playing' || gameState === 'paused') && (
              <div
                className="absolute left-0 right-0 border-b-4 border-green-500 z-10 pointer-events-none"
                style={{
                  top: `${hurdleY * 100}%`,
                  boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                }}
              />
            )}

            {/* Hip Indicators (visual feedback for jump detection) */}
            {gameState === 'playing' && landmarks && (
              <>
                {landmarks.leftHip && (
                  <div
                    className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white z-20 pointer-events-none"
                    style={{
                      left: `${landmarks.leftHip.x * 100}%`,
                      top: `${landmarks.leftHip.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
                {landmarks.rightHip && (
                  <div
                    className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white z-20 pointer-events-none"
                    style={{
                      left: `${landmarks.rightHip.x * 100}%`,
                      top: `${landmarks.rightHip.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
                {/* Jump threshold indicator */}
                {groundHipY !== null && userHeight !== null && (
                  <div
                    className="absolute left-0 right-0 border-b-2 border-dashed border-yellow-400 z-15 pointer-events-none opacity-50"
                    style={{
                      top: `${(groundHipY - (userHeight * 0.15)) * 100}%`,
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 right-4 z-30 bg-black/70 p-4 rounded-lg">
            <p className="text-lg font-semibold mb-2">{getStatusText()}</p>
            <p className="text-sm mb-2">
              Score: <span className="font-bold">{score}</span> | Level:{' '}
              <span className="font-bold">{level}</span> | Time:{' '}
              <span className="font-bold">{timer}</span>s
            </p>
            
            {/* Stamina Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/80">Stamina</span>
                <span className="text-xs font-bold" style={{ color: stamina < MIN_STAMINA_TO_JUMP ? '#ef4444' : '#22c55e' }}>
                  {Math.round(stamina)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${stamina}%`,
                    background: stamina < MIN_STAMINA_TO_JUMP
                      ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      : stamina < 50
                        ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                        : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                  }}
                />
              </div>
            </div>
            
            {!isDetecting && gameState === 'playing' && (
              <p className="text-yellow-400 text-sm mt-2">No pose detected. Make sure you&apos;re visible!</p>
            )}
          </div>

          {/* Combo Popup Animations */}
          <AnimatePresence>
            {comboPopup.type && (
              <motion.div
                key={comboPopup.key}
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, y: -100 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20,
                  duration: 0.5 
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
              >
                <div
                  className={`px-8 py-4 rounded-2xl font-display font-bold text-4xl md:text-5xl drop-shadow-2xl ${
                    comboPopup.type === 'perfect'
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
                      : 'bg-gradient-to-r from-green-400 to-green-600 text-green-900'
                  }`}
                  style={{
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {comboPopup.type === 'perfect' ? 'PERFECT FORM!' : 'WOBBLY!'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          {(gameState === 'ready' || gameState === 'paused') && (
            <button
              onClick={handleAction}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
            >
              {gameState === 'ready' ? 'START' : 'CONTINUE'}
            </button>
          )}
        </motion.section>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <ResultModal
          score={finalScore}
          calories={finalCalories}
          gameType="luksong-tinik"
          onClose={() => {
            setShowResultModal(false);
            setGameState('idle');
          }}
        />
      )}

      {/* Tutorial Modal */}
      <TutorialModal
        gameType="luksong-tinik"
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

