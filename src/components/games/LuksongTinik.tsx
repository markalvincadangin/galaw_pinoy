'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';
import { saveGameResult } from '@/app/actions/game';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'paused' | 'over';

const MAX_LEVELS = 5;
const INITIAL_TIMER = 60;
const INITIAL_HURDLE_Y = 0.8; // 80% from top (normalized)

export default function LuksongTinik(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting } = usePoseDetection(webcamRef);
  const { playJump, playScore, playGameOver } = useGameSound();

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

  // Timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
    prevScoreRef.current = 0; // Reset score tracking
  }, []);

  // Handle calibration complete
  const handleCalibrated = useCallback(() => {
    setGameState('ready');
  }, []);

  // End game (defined first since it's used by other callbacks)
  const endGame = useCallback(async () => {
    // Stop all intervals FIRST to prevent race conditions
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
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

    // Play game over sound
    playGameOver();

    // Save game result immediately when game ends
    try {
      await saveGameResult('luksong-tinik', finalScoreValue, calories);
    } catch (error) {
      console.error('Failed to save game result:', error);
      // Don't block UI if save fails
    }

    // Show result modal
    setShowResultModal(true);
  }, [playGameOver]);

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
    setGameState('playing');
    setCooldown(false);
    startGameTimer();
  }, [startGameTimer]);

  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);

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
  }, [startLevel]);

  // Level clear
  const levelClear = useCallback(() => {
    setCooldown(true);
    setScore((prev) => prev + 1);
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
      
      // Reset cooldown after 500ms
      setTimeout(() => {
        setCooldown(false);
      }, 500);

      return newLevel;
    });
  }, [endGame]);

  // Check jump detection with debouncing
  useEffect(() => {
    if (gameState !== 'playing' || cooldown) {
      // Reset jump state when not playing or in cooldown
      if (isJumping) {
        setTimeout(() => {
          setIsJumping(false);
        }, 0);
      }
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

    if (!landmarks) {
      return;
    }

    try {
      const leftKnee = landmarks.leftKnee;
      const rightKnee = landmarks.rightKnee;
      const nose = landmarks.nose;

      if (!leftKnee || !rightKnee || !nose) {
        // Reset jump state if landmarks are missing
        if (isJumping) {
          setTimeout(() => {
            setIsJumping(false);
          }, 0);
        }
        return;
      }

      // Convert normalized coordinates to check if above hurdle
      // MediaPipe returns normalized coordinates (0-1), where y=0 is top
      const kneesAbove = leftKnee.y < hurdleY && rightKnee.y < hurdleY;
      const torsoAbove = nose.y < hurdleY - 0.05; // Nose should be higher (smaller y value)
      const isAboveHurdle = kneesAbove && torsoAbove;
      const isBelowHurdle = nose.y > hurdleY + 0.1; // Too far below hurdle

      // Debouncing logic: only trigger score when transitioning from below to above
      if (isAboveHurdle && !isJumping) {
        // User just jumped above the hurdle - trigger score
        setTimeout(() => {
          setIsJumping(true);
        }, 0);
        setTimeout(() => {
          levelClear();
        }, 0);
      } else if (!isAboveHurdle && isJumping) {
        // User has returned below the hurdle - reset jump state
        setTimeout(() => {
          setIsJumping(false);
        }, 0);
      }

      // Game over if nose goes too far below hurdle
      if (isBelowHurdle) {
        setTimeout(() => {
          endGame();
        }, 0);
      }
    } catch (err) {
      console.error('Error in jump detection:', err);
      setTimeout(() => {
        setPoseDetectionError(err instanceof Error ? err.message : 'Pose detection error');
      }, 0);
      // Don't crash the game, show error UI instead
    }
  }, [landmarks, gameState, cooldown, hurdleY, levelClear, endGame, error, isJumping]);

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
    };
  }, []);

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Loading pose detection...';
    if (error) return `Error: ${error}`;
    if (gameState === 'idle') return 'Step back until your full body is visible on camera.';
    if (gameState === 'ready') return 'Step back. Full body must be visible.';
    if (gameState === 'countdown') return `Starting in ${countdown}...`;
    if (gameState === 'playing') return 'JUMP!';
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
        <section
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
          }}
        >
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

            {/* Knee Indicators (optional visual feedback) */}
            {gameState === 'playing' && landmarks && (
              <>
                {landmarks.leftKnee && (
                  <div
                    className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white z-20 pointer-events-none"
                    style={{
                      left: `${landmarks.leftKnee.x * 100}%`,
                      top: `${landmarks.leftKnee.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
                {landmarks.rightKnee && (
                  <div
                    className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white z-20 pointer-events-none"
                    style={{
                      left: `${landmarks.rightKnee.x * 100}%`,
                      top: `${landmarks.rightKnee.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* HUD Overlay */}
          <div className="absolute top-4 left-4 right-4 z-30 bg-black/70 p-4 rounded-lg">
            <p className="text-lg font-semibold mb-2">{getStatusText()}</p>
            <p className="text-sm">
              Score: <span className="font-bold">{score}</span> | Level:{' '}
              <span className="font-bold">{level}</span> | Time:{' '}
              <span className="font-bold">{timer}</span>s
            </p>
            {!isDetecting && gameState === 'playing' && (
              <p className="text-yellow-400 text-sm mt-2">No pose detected. Make sure you&apos;re visible!</p>
            )}
          </div>

          {/* Action Button */}
          {(gameState === 'ready' || gameState === 'paused') && (
            <button
              onClick={handleAction}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
            >
              {gameState === 'ready' ? 'START' : 'CONTINUE'}
            </button>
          )}
        </section>
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
    </div>
  );
}

