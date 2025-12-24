'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useGameSound } from '@/hooks/useGameSound';
import { useGameFeedback, FeedbackPopup } from '@/hooks/useGameFeedback';
import { isSquatting, getUserHeight, calculateAngle } from '@/utils/posePhysics';
import CalibrationCheck from '@/components/game/CalibrationCheck';
import ResultModal from '@/components/game/ResultModal';
import TutorialModal from '@/components/game/TutorialModal';
import GameMechanicsModal from '@/components/game/GameMechanicsModal';
import GameHUD from '@/components/game/GameHUD';

type GameState = 'idle' | 'lobby' | 'ready' | 'countdown' | 'playing' | 'over';
type PoseCommand = 'LANGIT' | 'LUPA'; // Langit = Heaven (Stand/Jump), Lupa = Earth (Squat)

const INITIAL_REACTION_TIME = 2000; // 2 seconds
const MIN_REACTION_TIME = 800; // Minimum 0.8 seconds
const REACTION_TIME_DECREMENT = 100; // Decrease by 100ms per level
const LEVEL_UP_SCORE = 5; // Points needed to level up

export default function LangitLupa(): React.ReactElement {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error, isDetecting } = usePoseDetection(webcamRef);
  const { playScore, playGameOver, toggleMusic, isMusicPlaying } = useGameSound();
  const { feedback, screenShake, shakeIntensity, screenFlash, triggerFeedback } = useGameFeedback();

  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentCommand, setCurrentCommand] = useState<PoseCommand | null>(null);
  const [reactionTime, setReactionTime] = useState(INITIAL_REACTION_TIME);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCalories, setFinalCalories] = useState(0);
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [showMechanics, setShowMechanics] = useState(true); // Mechanics modal visibility
  const [showTutorial, setShowTutorial] = useState(false); // Tutorial modal visibility
  const [isUnlocked, setIsUnlocked] = useState(false); // Challenge completion status

  // Refs
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousNoseYRef = useRef<number | null>(null);

  // Start game
  const startGame = useCallback(() => {
    setGameState('lobby');
    setScore(0);
    setLevel(1);
    setCurrentCommand(null);
    setReactionTime(INITIAL_REACTION_TIME);
    setTimeRemaining(0);
    setShowResultModal(false);
    setUserHeight(null);
    // Clear timeouts
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
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
    
    // Clear all timeouts
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

    // Stop webcam
    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Calculate calories (rough estimate: ~8 calories per point)
    const calories = score * 8;
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

  // Handle miss/wrong pose
  const handleMiss = useCallback(() => {
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearInterval(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }

    triggerFeedback('miss');
    endGame();
  }, [triggerFeedback, endGame]);

  // Generate new command
  const generateNewCommand = useCallback(() => {
    // Randomly choose LANGIT or LUPA
    const newCommand: PoseCommand = Math.random() < 0.5 ? 'LANGIT' : 'LUPA';
    setCurrentCommand(newCommand);
    setTimeRemaining(reactionTime);

    // Start reaction timer
    reactionTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 100) {
          // Time's up - wrong pose
          handleMiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    // Auto-fail after reaction time
    commandTimeoutRef.current = setTimeout(() => {
      handleMiss();
    }, reactionTime);
  }, [reactionTime, handleMiss]);

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
    generateNewCommand();
  }, [isMusicPlaying, toggleMusic, showTutorial, generateNewCommand]);

  // Start countdown (used in dependency array, but auto-starts after calibration)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Handle correct pose
  const handleCorrect = useCallback(() => {
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }
    if (reactionTimerRef.current) {
      clearInterval(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }

    // Calculate points based on reaction speed
    const speedBonus = Math.floor((timeRemaining / reactionTime) * 5);
    const points = 1 + speedBonus;
    
    setScore((prev) => {
      const newScore = prev + points;
      
      // Level up every LEVEL_UP_SCORE points
      if (newScore >= level * LEVEL_UP_SCORE) {
        setLevel((prevLevel) => {
          const newLevel = prevLevel + 1;
          // Decrease reaction time (increase difficulty)
          setReactionTime((prevTime) => 
            Math.max(MIN_REACTION_TIME, prevTime - REACTION_TIME_DECREMENT)
          );
          return newLevel;
        });
      }
      
      return newScore;
    });

    triggerFeedback('perfect');
    playScore();

    // Generate next command after short delay
    setTimeout(() => {
      generateNewCommand();
    }, 500);
  }, [timeRemaining, reactionTime, level, triggerFeedback, playScore, generateNewCommand]);

  // Establish user height baseline
  useEffect(() => {
    if (gameState === 'playing' && landmarks && !userHeight) {
      const height = getUserHeight(landmarks);
      if (height) {
        setUserHeight(height);
      }
    }
  }, [gameState, landmarks, userHeight]);

  // Unlock logic: Check if user squats (kneeAngle < 140)
  useEffect(() => {
    if (isUnlocked || !showTutorial) return; // Already unlocked or tutorial closed
    
    if (!landmarks?.leftHip || !landmarks?.leftKnee || !landmarks?.leftAnkle) return;
    
    // Calculate knee angle (hip-knee-ankle)
    const kneeAngle = calculateAngle(
      { x: landmarks.leftHip.x, y: landmarks.leftHip.y },
      { x: landmarks.leftKnee.x, y: landmarks.leftKnee.y },
      { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y }
    );
    
    // Check if squatting (knee angle < 140 degrees)
    if (kneeAngle < 140) {
      setIsUnlocked(true);
    }
  }, [landmarks, isUnlocked, showTutorial]);

  // Track baseline nose Y for squat fallback detection
  const baselineNoseYRef = useRef<number | null>(null);

  // Establish baseline nose position when game starts
  useEffect(() => {
    if (gameState === 'playing' && landmarks?.nose && baselineNoseYRef.current === null) {
      baselineNoseYRef.current = landmarks.nose.y;
    }
    if (gameState !== 'playing') {
      baselineNoseYRef.current = null;
    }
  }, [gameState, landmarks]);

  // Check pose during gameplay
  useEffect(() => {
    // Block gameplay if tutorial is open
    if (showTutorial) {
      return;
    }
    
    if (gameState !== 'playing' || !currentCommand) {
      return;
    }

    // WAIT FOR POSE DETECTION TO INITIALIZE - This is critical!
    // If still loading, pose detection is not ready yet - don't run game logic
    if (isLoading || !landmarks) {
      return;
    }

    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    checkIntervalRef.current = setInterval(() => {
      // Re-check loading state inside interval
      if (isLoading || !landmarks || !currentCommand) return;

      const nose = landmarks.nose;
      const isSquat = isSquatting(landmarks);

      if (!nose) return;

      // Check if pose matches command
      let poseMatches = false;

      if (currentCommand === 'LANGIT') {
        // LANGIT: Head in top 30% OR jumping (hip velocity)
        const top30Percent = userHeight ? nose.y < (userHeight * 0.3) : nose.y < 0.3;
        
        // Also check if jumping (nose moving up)
        const isJumping = previousNoseYRef.current !== null && 
          nose.y < previousNoseYRef.current - 0.05;
        
        poseMatches = top30Percent || isJumping;
      } else if (currentCommand === 'LUPA') {
        // LUPA: Squatting detection with fallback
        // Primary: Check knee angle (normal squat detection)
        if (isSquat) {
          poseMatches = true;
        } else {
          // Fallback: If MediaPipe loses track of legs but nose drops significantly
          // Check leg visibility (if available)
          const leftKnee = landmarks.leftKnee;
          const rightKnee = landmarks.rightKnee;
          const leftAnkle = landmarks.leftAnkle;
          const rightAnkle = landmarks.rightAnkle;
          
          const legVisibilityLow = 
            (leftKnee && leftKnee.visibility !== undefined && leftKnee.visibility < 0.5) ||
            (rightKnee && rightKnee.visibility !== undefined && rightKnee.visibility < 0.5) ||
            (leftAnkle && leftAnkle.visibility !== undefined && leftAnkle.visibility < 0.5) ||
            (rightAnkle && rightAnkle.visibility !== undefined && rightAnkle.visibility < 0.5);
          
          // Check if nose dropped by > 30% of user height
          if (baselineNoseYRef.current !== null && userHeight) {
            const noseDrop = nose.y - baselineNoseYRef.current;
            const dropThreshold = userHeight * 0.3; // 30% of user height
            
            if (legVisibilityLow && noseDrop > dropThreshold) {
              // Valid squat detected via fallback method
              poseMatches = true;
            }
          }
        }
      }

      if (poseMatches) {
        handleCorrect();
      }

      previousNoseYRef.current = nose.y;
    }, 100); // Check every 100ms

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [gameState, currentCommand, landmarks, isLoading, userHeight, handleCorrect, showTutorial]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  // Get status text
  const getStatusText = () => {
    if (isLoading) return 'Loading pose detection...';
    if (error) return `Error: ${error}`;
    if (gameState === 'idle') return 'Step back until your full body is visible.';
    if (gameState === 'ready') return 'Ready! Press START';
    if (gameState === 'countdown') return 'Get ready...';
    if (gameState === 'playing') {
      if (!currentCommand) return 'Waiting...';
      return `Match the pose: ${currentCommand}`;
    }
    if (gameState === 'over') return 'Game Over!';
    return 'Initializing...';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Selection Screen */}
      {gameState === 'idle' && (
        <section className="flex flex-col items-center justify-center min-h-screen p-8">
          <h1 className="text-4xl font-bold mb-4">Langit-Lupa</h1>
          <p className="text-lg mb-8">Match the pose: LANGIT (Stand/Jump) or LUPA (Squat)</p>
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
          className={`relative w-full h-screen overflow-hidden touch-none ${
            currentCommand === 'LANGIT' 
              ? 'bg-gradient-to-b from-blue-600 to-blue-800' 
              : currentCommand === 'LUPA'
                ? 'bg-gradient-to-b from-amber-800 to-amber-900'
                : 'bg-gray-900'
          }`}
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
              className="w-full h-full object-cover opacity-80"
              videoConstraints={{
                facingMode: 'user',
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 },
                aspectRatio: { ideal: 16 / 9 },
              }}
            />
          </div>

          {/* Command Display */}
          {gameState === 'playing' && currentCommand && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center"
              >
                <h2 className="text-8xl md:text-9xl font-display font-black mb-8 drop-shadow-2xl">
                  {currentCommand}
                </h2>
                <div className="text-2xl md:text-3xl font-semibold mb-4">
                  {currentCommand === 'LANGIT' ? '☁️ Stand or Jump!' : '🌍 Squat!'}
                </div>
                {/* Reaction Timer Bar */}
                <div className="w-64 md:w-96 h-4 bg-white/20 rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-red-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeRemaining / reactionTime) * 100}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                  />
                </div>
                <p className="text-sm mt-2 text-white/80">
                  {Math.ceil(timeRemaining / 1000)}s remaining
                </p>
              </motion.div>
            </div>
          )}

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
            status={getStatusText()}
            score={score}
            level={level}
            reactionTime={reactionTime}
            showPoseWarning={!isDetecting && gameState === 'playing' && !showResultModal}
            gameState={gameState}
          />
        </motion.section>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <ResultModal
          score={finalScore}
          calories={finalCalories}
          gameType="langit-lupa"
          onClose={() => {
            setShowResultModal(false);
            setGameState('idle');
          }}
        />
      )}

      {/* Game Mechanics Modal */}
      <GameMechanicsModal
        gameType="langit-lupa"
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
        gameType="langit-lupa"
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

