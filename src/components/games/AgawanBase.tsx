'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import { useGameFeedback, FeedbackPopup } from '@/hooks/useGameFeedback';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';
import TutorialModal from '@/components/game/TutorialModal';
import GameMechanicsModal from '@/components/game/GameMechanicsModal';
import GameHUD from '@/components/game/GameHUD';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'over';

const TRACK_LENGTH = 100; // Percentage (0-100)
const HIGH_KNEE_THRESHOLD = 0.10; // Knee must be 10% higher than hip (reduced from 0.15 for better sensitivity)
const KNEE_LIFT_COOLDOWN = 300; // Milliseconds between knee lift detections
const BASE_DISTANCE = 50; // Distance to enemy base (percentage)

export default function AgawanBase(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting } = usePoseDetection(webcamRef);
  const { playJump, playGameOver, toggleMusic, isMusicPlaying } = useGameSound();
  const { feedback, screenShake, shakeIntensity, screenFlash, triggerFeedback } = useGameFeedback();

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [playerPosition, setPlayerPosition] = useState(0); // 0-100 (percentage)
  const [enemyPosition, setEnemyPosition] = useState(BASE_DISTANCE); // Enemy starts at base
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCalories, setFinalCalories] = useState(0);
  const [showMechanics, setShowMechanics] = useState(true); // Mechanics modal visibility
  const [showTutorial, setShowTutorial] = useState(false); // Tutorial modal visibility
  const [isUnlocked, setIsUnlocked] = useState(false); // Challenge completion status

  // Refs
  const lastKneeLiftTimeRef = useRef<number>(0);
  const previousLeftKneeYRef = useRef<number | null>(null);
  const previousRightKneeYRef = useRef<number | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const enemyMoveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start game
  const startGame = useCallback(() => {
    setGameState('lobby');
    setPlayerPosition(0);
    setEnemyPosition(BASE_DISTANCE);
    setScore(0);
    setTimeElapsed(0);
    setShowResultModal(false);
    lastKneeLiftTimeRef.current = 0;
    previousLeftKneeYRef.current = null;
    previousRightKneeYRef.current = null;
    // Clear intervals
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (enemyMoveIntervalRef.current) clearInterval(enemyMoveIntervalRef.current);
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
    // Prevent multiple calls to endGame
    if (gameState === 'over') {
      return;
    }

    setGameState('over');
    
    // Clear intervals
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (enemyMoveIntervalRef.current) {
      clearInterval(enemyMoveIntervalRef.current);
      enemyMoveIntervalRef.current = null;
    }
    
    // Stop webcam
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Calculate score and calories
    const baseScore = score + Math.floor(timeElapsed * 2); // Time bonus
    const victoryBonus = playerPosition >= TRACK_LENGTH ? 100 : 0;
    const finalScoreValue = baseScore + victoryBonus;
    const calories = Math.floor(timeElapsed * 8); // ~8 calories per second (HIIT)
    
    setFinalScore(finalScoreValue);
    setFinalCalories(calories);

    // Stop background music
    if (isMusicPlaying) {
      toggleMusic();
    }

    // Play game over sound
    playGameOver();

    // Show result modal
    setShowResultModal(true);
  }, [score, timeElapsed, playerPosition, playGameOver, isMusicPlaying, toggleMusic, gameState]);

  // Begin playing
  const beginPlaying = useCallback(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    setGameState('playing');
    gameStartTimeRef.current = Date.now();
    
    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed((Date.now() - gameStartTimeRef.current) / 1000);
    }, 100);

    // Enemy moves automatically (slower than player)
    enemyMoveIntervalRef.current = setInterval(() => {
      setEnemyPosition((prev) => {
        const newPos = prev - 0.5; // Enemy moves backward (toward player start)
        if (newPos <= 0) {
          // Enemy caught player
          endGame();
          return 0;
        }
        return newPos;
      });
    }, 100);
    
    // Start background music
    if (!isMusicPlaying) {
      toggleMusic();
    }
  }, [isMusicPlaying, toggleMusic, showTutorial, endGame, gameState]);

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

  // Unlock logic: Check if user lifts knee high (leftKnee.y < leftHip.y OR rightKnee.y < rightHip.y)
  useEffect(() => {
    if (isUnlocked || !showTutorial) return; // Already unlocked or tutorial closed
    
    if (!landmarks?.leftKnee || !landmarks?.rightKnee || !landmarks?.leftHip || !landmarks?.rightHip) return;
    
    // Check if either knee is lifted above hip (high knee lift)
    const leftKneeLifted = landmarks.leftKnee.y < landmarks.leftHip.y;
    const rightKneeLifted = landmarks.rightKnee.y < landmarks.rightHip.y;
    
    if (leftKneeLifted || rightKneeLifted) {
      setIsUnlocked(true);
    }
  }, [landmarks, isUnlocked, showTutorial]);

  // Detect high knees (running in place)
  useEffect(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    if (gameState !== 'playing' || !landmarks) return;

    const leftKnee = landmarks.leftKnee;
    const rightKnee = landmarks.rightKnee;
    const leftHip = landmarks.leftHip;
    const rightHip = landmarks.rightHip;

    if (!leftKnee || !rightKnee || !leftHip || !rightHip) {
      return;
    }

    const now = Date.now();
    const timeSinceLastLift = now - lastKneeLiftTimeRef.current;

    // Check for high knee lift (knee significantly higher than hip)
    const leftKneeLift = leftKnee.y < leftHip.y - HIGH_KNEE_THRESHOLD;
    const rightKneeLift = rightKnee.y < rightHip.y - HIGH_KNEE_THRESHOLD;

    if ((leftKneeLift || rightKneeLift) && timeSinceLastLift > KNEE_LIFT_COOLDOWN) {
      // Calculate speed based on knee height and frequency
      const leftKneeHeight = leftHip.y - leftKnee.y;
      const rightKneeHeight = rightHip.y - rightKnee.y;
      const maxKneeHeight = Math.max(leftKneeHeight, rightKneeHeight);
      
      // Speed multiplier based on knee height (higher knee = faster)
      const speedMultiplier = Math.min(2.0, 1.0 + maxKneeHeight * 5);
      const speed = 0.5 * speedMultiplier; // Base speed * multiplier

      setPlayerPosition((prev) => {
        const newPos = prev + speed;
        if (newPos >= TRACK_LENGTH) {
          // Player reached enemy base - victory!
          setScore((prev) => prev + 100);
          triggerFeedback('perfect');
          endGame();
          return TRACK_LENGTH;
        }
        return newPos;
      });

      lastKneeLiftTimeRef.current = now;
      playJump();
    }

    previousLeftKneeYRef.current = leftKnee.y;
    previousRightKneeYRef.current = rightKnee.y;
  }, [gameState, landmarks, isLoading, triggerFeedback, playJump, showTutorial, endGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (enemyMoveIntervalRef.current) clearInterval(enemyMoveIntervalRef.current);
    };
  }, []);

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Loading pose detection...';
    if (error) return `Error: ${error}`;
    if (gameState === 'idle') return 'Step back until your full body is visible.';
    if (gameState === 'ready') return 'Ready! Press START';
    if (gameState === 'countdown') return 'Get ready to run!';
    if (gameState === 'playing') {
      if (playerPosition >= TRACK_LENGTH) return 'VICTORY!';
      if (enemyPosition <= 0) return 'CAUGHT!';
      return 'Run in place! Lift those knees!';
    }
    if (gameState === 'over') {
      return playerPosition >= TRACK_LENGTH ? 'You Won!' : 'Game Over!';
    }
    return 'Initializing...';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Selection Screen */}
      {gameState === 'idle' && (
        <section className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-4">Agawan Base</h1>
          <p className="text-lg mb-8">Run in place with high knees to reach the enemy base!</p>
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
          className="relative w-full h-screen overflow-hidden touch-none bg-gradient-to-b from-green-900 to-green-800"
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

          {/* Race Track */}
          {gameState === 'playing' && (
            <div className="absolute bottom-20 left-0 right-0 z-20 px-8">
              {/* Track Background */}
              <div className="h-32 bg-gray-700/50 rounded-lg border-2 border-gray-600 relative">
                {/* Start Line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                
                {/* Finish Line (Enemy Base) */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-red-500"
                  style={{ right: `${100 - BASE_DISTANCE}%` }}
                />

                {/* Player Avatar */}
                <motion.div
                  className="absolute top-1/2 transform -translate-y-1/2 w-12 h-12 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-2xl z-30"
                  style={{
                    left: `${playerPosition}%`,
                  }}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  🏃
                </motion.div>

                {/* Enemy Avatar */}
                <motion.div
                  className="absolute top-1/2 transform -translate-y-1/2 w-12 h-12 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-2xl z-30"
                  style={{
                    right: `${100 - enemyPosition}%`,
                  }}
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  👹
                </motion.div>

                {/* Progress Indicator */}
                <div className="absolute top-2 left-2 right-2 h-1 bg-white/20 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${playerPosition}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* HUD Overlay */}
          <GameHUD
            status={getStatusText()}
            score={score}
            timer={timeElapsed}
            distance={playerPosition}
            showPoseWarning={!isDetecting && gameState === 'playing' && !showResultModal}
            gameState={gameState}
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
          gameType="agawan-base"
          onClose={() => {
            setShowResultModal(false);
            setGameState('idle');
          }}
        />
      )}

      {/* Game Mechanics Modal */}
      <GameMechanicsModal
        gameType="agawan-base"
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
        gameType="agawan-base"
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

