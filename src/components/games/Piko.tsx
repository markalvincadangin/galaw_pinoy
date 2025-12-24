'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import { useGameFeedback, FeedbackPopup } from '@/hooks/useGameFeedback';
import { createPosePhysicsAnalyzer } from '@/utils/posePhysics';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';
import TutorialModal from '@/components/game/TutorialModal';
import GameMechanicsModal from '@/components/game/GameMechanicsModal';
import GameHUD from '@/components/game/GameHUD';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'over';

interface GridCell {
  id: number;
  x: number; // 0-2 (3 columns)
  y: number; // 0-4 (5 rows)
  isTarget: boolean;
  isCompleted: boolean;
}

const GRID_COLS = 3;
const GRID_ROWS = 5;
const ONE_LEG_THRESHOLD = 0.03; // Ankle Y difference threshold (normalized) - reduced from 0.05 for better sensitivity
const BALANCE_GRACE_PERIOD = 500; // 0.5 seconds grace period for balance (milliseconds)

export default function Piko(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting } = usePoseDetection(webcamRef);
  const { playScore, playGameOver, toggleMusic, isMusicPlaying } = useGameSound();
  const { feedback, screenShake, shakeIntensity, screenFlash, triggerFeedback } = useGameFeedback();

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [currentTarget, setCurrentTarget] = useState<GridCell | null>(null);
  const [isOneLegMode, setIsOneLegMode] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCalories, setFinalCalories] = useState(0);
  const [showMechanics, setShowMechanics] = useState(true); // Mechanics modal visibility
  const [showTutorial, setShowTutorial] = useState(false); // Tutorial modal visibility
  const [isUnlocked, setIsUnlocked] = useState(false); // Challenge completion status

  // Refs
  const physicsAnalyzerRef = useRef(createPosePhysicsAnalyzer());
  const previousHipYRef = useRef<number | null>(null);
  const hopDetectedRef = useRef(false);
  const balanceGracePeriodStartRef = useRef<number | null>(null); // When foot touched ground
  const wasOneLegModeRef = useRef(false); // Track previous one-leg state

  // Initialize grid
  useEffect(() => {
    if (gameState === 'playing' && grid.length === 0) {
      const cells: GridCell[] = [];
      for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
          cells.push({
            id: y * GRID_COLS + x,
            x,
            y,
            isTarget: false,
            isCompleted: false,
          });
        }
      }
      setGrid(cells);
      // Set first target (center bottom)
      const firstTarget = cells.find((c) => c.x === 1 && c.y === GRID_ROWS - 1);
      if (firstTarget) {
        setCurrentTarget(firstTarget);
        setGrid((prev) =>
          prev.map((c) => (c.id === firstTarget.id ? { ...c, isTarget: true } : c))
        );
      }
    }
  }, [gameState, grid.length]);

  // Unlock logic: Check if user lifts one foot (ankleDiff > 0.1)
  useEffect(() => {
    if (isUnlocked || !showTutorial) return; // Already unlocked or tutorial closed
    
    if (!landmarks?.leftAnkle || !landmarks?.rightAnkle) return;
    
    // Calculate ankle Y difference
    const ankleDiff = Math.abs(landmarks.leftAnkle.y - landmarks.rightAnkle.y);
    
    // Check if one foot is lifted (ankleDiff > 0.1)
    if (ankleDiff > 0.1) {
      setIsUnlocked(true);
    }
  }, [landmarks, isUnlocked, showTutorial]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('lobby');
    setScore(0);
    setGrid([]);
    setCurrentTarget(null);
    setIsOneLegMode(false);
    setShowResultModal(false);
    hopDetectedRef.current = false;
    previousHipYRef.current = null;
    balanceGracePeriodStartRef.current = null;
    wasOneLegModeRef.current = false;
    physicsAnalyzerRef.current.reset();
    // Stop background music when game resets
    if (isMusicPlaying) {
      toggleMusic();
    }
  }, [isMusicPlaying, toggleMusic]);

  // Handle calibration complete
  const handleCalibrated = useCallback(() => {
    setGameState('ready');
  }, []);

  // End game (declared first since it's used by other callbacks)
  const endGame = useCallback(() => {
    setGameState('over');
    
    // Stop webcam
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Calculate calories (rough estimate: ~6 calories per point)
    const calories = score * 6;
    setFinalScore(score);
    setFinalCalories(calories);

    // Stop background music
    if (isMusicPlaying) {
      toggleMusic();
    }

    // Play game over sound
    playGameOver();

    // Show result modal
    setShowResultModal(true);
  }, [score, playGameOver, isMusicPlaying, toggleMusic, gameState]);

  // Begin playing
  const beginPlaying = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    setGameState('playing');
    // Start background music
    if (!isMusicPlaying) {
      toggleMusic();
    }
    // Establish baseline
    if (landmarks) {
      physicsAnalyzerRef.current.establishBaseline(landmarks);
    }
  }, [isMusicPlaying, toggleMusic, landmarks, showTutorial]);

  // Start countdown
  const startCountdown = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    setGameState('countdown');
    // Start background music during countdown
    if (!isMusicPlaying) {
      toggleMusic();
    }
    
    // Countdown from 3
    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count <= 1) {
        clearInterval(countdownInterval);
        beginPlaying();
      } else {
        count--;
      }
    }, 1000);
  }, [isMusicPlaying, toggleMusic, showTutorial, beginPlaying]);

  // Check one-leg balance with grace period
  useEffect(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    if (gameState !== 'playing') {
      setIsOneLegMode(false);
      wasOneLegModeRef.current = false;
      balanceGracePeriodStartRef.current = null;
      return;
    }

    // WAIT FOR POSE DETECTION TO INITIALIZE - This is critical!
    // If still loading, pose detection is not ready yet - don't run game logic
    if (isLoading || !landmarks) {
      setIsOneLegMode(false);
      wasOneLegModeRef.current = false;
      balanceGracePeriodStartRef.current = null;
      return;
    }

    const leftAnkle = landmarks.leftAnkle;
    const rightAnkle = landmarks.rightAnkle;

    if (!leftAnkle || !rightAnkle) {
      setIsOneLegMode(false);
      wasOneLegModeRef.current = false;
      balanceGracePeriodStartRef.current = null;
      return;
    }

    // Check if one ankle is significantly higher than the other
    const ankleYDiff = Math.abs(leftAnkle.y - rightAnkle.y);
    const isOneLegNow = ankleYDiff >= ONE_LEG_THRESHOLD;

    // Handle grace period for balance
    if (wasOneLegModeRef.current && !isOneLegNow) {
      // User was balancing but foot touched ground
      // Start grace period if not already started
      if (balanceGracePeriodStartRef.current === null) {
        balanceGracePeriodStartRef.current = Date.now();
      }
      
      // Check if grace period has expired
      const gracePeriodElapsed = Date.now() - balanceGracePeriodStartRef.current;
      if (gracePeriodElapsed < BALANCE_GRACE_PERIOD) {
        // Still in grace period - maintain one-leg mode
        setIsOneLegMode(true);
      } else {
        // Grace period expired - foot is down
        setIsOneLegMode(false);
        balanceGracePeriodStartRef.current = null;
      }
    } else if (isOneLegNow) {
      // User is balancing - clear grace period and set one-leg mode
      setIsOneLegMode(true);
      balanceGracePeriodStartRef.current = null;
    } else {
      // User is not balancing
      setIsOneLegMode(false);
      balanceGracePeriodStartRef.current = null;
    }

    // Update previous state
    wasOneLegModeRef.current = isOneLegNow;
  }, [gameState, landmarks, isLoading, showTutorial]);

  // Detect hop while in one-leg mode
  useEffect(() => {
    if (gameState !== 'playing' || !isOneLegMode || !landmarks || !currentTarget) return;

    const leftHip = landmarks.leftHip;
    const rightHip = landmarks.rightHip;

    if (!leftHip || !rightHip) return;

    const avgHipY = (leftHip.y + rightHip.y) / 2;

    // Detect hop: vertical spike in hip velocity while in one-leg mode
    if (previousHipYRef.current !== null) {
      const hipVelocity = (avgHipY - previousHipYRef.current) * 1000; // Normalize
      
      // Hop detected: negative velocity (moving up) while in one-leg mode
      if (hipVelocity < -0.01 && !hopDetectedRef.current) {
        hopDetectedRef.current = true;
        
        // Complete current target
        setGrid((prev) =>
          prev.map((c) =>
            c.id === currentTarget.id ? { ...c, isTarget: false, isCompleted: true } : c
          )
        );

        setScore((prev) => prev + 1);
        triggerFeedback('perfect');
        playScore();

        // Set next target (random uncompleted cell)
        setTimeout(() => {
          setGrid((prev) => {
            const uncompleted = prev.filter((c) => !c.isCompleted);
            if (uncompleted.length === 0) {
              // All cells completed - level up or end game
              endGame();
              return prev;
            }
            const nextTarget = uncompleted[Math.floor(Math.random() * uncompleted.length)];
            setCurrentTarget(nextTarget);
            return prev.map((c) =>
              c.id === nextTarget.id ? { ...c, isTarget: true } : c
            );
          });
          hopDetectedRef.current = false;
        }, 500);
      } else if (hipVelocity >= 0) {
        // Reset hop detection when returning to ground
        hopDetectedRef.current = false;
      }
    }

    previousHipYRef.current = avgHipY;
  }, [gameState, isOneLegMode, landmarks, isLoading, currentTarget, triggerFeedback, playScore, endGame]);

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Loading pose detection...';
    if (error) return `Error: ${error}`;
    if (gameState === 'idle') return 'Step back until your full body is visible.';
    if (gameState === 'ready') return 'Ready! Press START';
    if (gameState === 'countdown') return 'Get ready...';
    if (gameState === 'playing') {
      if (!isOneLegMode) return 'Lift one foot to start!';
      if (!currentTarget) return 'Waiting for target...';
      return `Hop to cell (${currentTarget.x + 1}, ${currentTarget.y + 1})`;
    }
    if (gameState === 'over') return 'Game Over!';
    return 'Initializing...';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Selection Screen */}
      {gameState === 'idle' && (
        <section className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-4">Piko (Hopscotch)</h1>
          <p className="text-lg mb-8">Balance on one leg and hop to the target cells!</p>
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
          className="relative w-full h-screen overflow-hidden touch-none bg-gradient-to-b from-gray-800 to-gray-900"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
          animate={{
            x: screenShake ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, shakeIntensity, 0] : 0,
            y: screenShake ? [0, shakeIntensity, -shakeIntensity, shakeIntensity, -shakeIntensity, 0] : 0,
          }}
          transition={{
            duration: 0.3,
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
          
          {/* Feedback Popup */}
          <FeedbackPopup feedback={feedback} />

          {/* Webcam Video */}
          <div className="relative w-full h-full touch-none">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored
              className="w-full h-full object-cover opacity-70"
              videoConstraints={{
                facingMode: 'user',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                aspectRatio: { ideal: 16 / 9 },
              }}
            />
          </div>

          {/* Grid Overlay */}
          {gameState === 'playing' && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div
                className="grid gap-2 p-4"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                  width: '80%',
                  height: '80%',
                }}
              >
                {grid.map((cell) => (
                  <motion.div
                    key={cell.id}
                    className={`rounded-lg border-2 flex items-center justify-center ${
                      cell.isTarget
                        ? 'bg-yellow-500/80 border-yellow-300 animate-pulse'
                        : cell.isCompleted
                          ? 'bg-green-500/50 border-green-300'
                          : 'bg-white/10 border-white/20'
                    }`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: cell.id * 0.05 }}
                  >
                    {cell.isTarget && (
                      <span className="text-2xl font-bold">🎯</span>
                    )}
                    {cell.isCompleted && (
                      <span className="text-xl">✓</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* One-Leg Indicator */}
          {gameState === 'playing' && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30">
              <div
                className={`px-6 py-3 rounded-lg font-semibold ${
                  isOneLegMode
                    ? 'bg-green-500/80 text-white'
                    : 'bg-red-500/80 text-white'
                }`}
              >
                {isOneLegMode ? '✓ One Leg Balanced' : '⚠ Lift One Foot'}
              </div>
            </div>
          )}

          {/* HUD Overlay */}
          <GameHUD
            status={getStatusText()}
            score={score}
            cellsCompleted={{
              current: grid.filter((c) => c.isCompleted).length,
              total: grid.length,
            }}
            showPoseWarning={!isDetecting && gameState === 'playing' && !showResultModal}
          />

          {/* Action Button */}
          {gameState === 'ready' && (
            <button
              onClick={startCountdown}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
            >
              START
            </button>
          )}
        </motion.section>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <ResultModal
          score={finalScore}
          calories={finalCalories}
          gameType="piko"
          onClose={() => {
            setShowResultModal(false);
            setGameState('idle');
          }}
        />
      )}

      {/* Game Mechanics Modal */}
      <GameMechanicsModal
        gameType="piko"
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
        gameType="piko"
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

