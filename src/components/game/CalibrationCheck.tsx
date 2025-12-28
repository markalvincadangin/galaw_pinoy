'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { usePoseDetection } from '@/hooks/usePoseDetection';

interface CalibrationCheckProps {
  onCalibrated: () => void;
}

// Pixel distance thresholds for calibration
const MIN_ANKLE_DISTANCE_PX = 30; // Minimum distance in pixels (user too far) - relaxed from 50
const MAX_ANKLE_DISTANCE_PX = 400; // Maximum distance in pixels (user too close) - relaxed from 300
const MIN_VISIBILITY_SCORE = 0.5; // Minimum visibility score for key landmarks - relaxed from 0.6
const CALIBRATION_DURATION = 1500; // 1.5 seconds in milliseconds - reduced from 3 seconds
const MOVEMENT_THRESHOLD_PX = 20; // Movement tolerance in pixels before resetting calibration
const CALIBRATION_TIMEOUT = 10000; // 10 seconds before showing skip button

export default function CalibrationCheck({ onCalibrated }: CalibrationCheckProps) {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error } = usePoseDetection(webcamRef);
  const [calibrationMessage, setCalibrationMessage] = useState<string>('');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(2);
  const [showProgress, setShowProgress] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const calibrationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const previousLandmarksRef = useRef<{ nose?: { x: number; y: number }; leftAnkle?: { x: number; y: number }; rightAnkle?: { x: number; y: number } } | null>(null);
  const calibrationStartTimeRef = useRef<number | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get video dimensions for pixel conversion
  useEffect(() => {
    const updateVideoDimensions = () => {
      const video = webcamRef.current?.video;
      if (video) {
        videoDimensionsRef.current = {
          width: video.videoWidth || video.clientWidth,
          height: video.videoHeight || video.clientHeight,
        };
      }
    };

    const video = webcamRef.current?.video;
    if (video) {
      if (video.readyState >= 2) {
        updateVideoDimensions();
      } else {
        video.addEventListener('loadedmetadata', updateVideoDimensions);
        return () => {
          video.removeEventListener('loadedmetadata', updateVideoDimensions);
        };
      }
    }
  }, [landmarks]);

  // Calculate pixel distance between two points
  const calculatePixelDistance = (
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ): number => {
    if (!videoDimensionsRef.current) {
      // Fallback to normalized distance if dimensions not available
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      return Math.sqrt(dx * dx + dy * dy) * 1000; // Rough estimate
    }

    const { width, height } = videoDimensionsRef.current;
    const x1 = point1.x * width;
    const y1 = point1.y * height;
    const x2 = point2.x * width;
    const y2 = point2.y * height;

    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Track calibration start time for timeout
  useEffect(() => {
    if (!isLoading && !error && !isCalibrated && landmarks) {
      if (calibrationStartTimeRef.current === null) {
        calibrationStartTimeRef.current = Date.now();
      }
      
      // Show skip button after timeout
      if (!skipTimeoutRef.current) {
        skipTimeoutRef.current = setTimeout(() => {
          setShowSkipButton(true);
        }, CALIBRATION_TIMEOUT);
      }
    }
    
    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
        skipTimeoutRef.current = null;
      }
    };
  }, [isLoading, error, isCalibrated, landmarks]);

  // Check calibration status
  useEffect(() => {
    if (isLoading || error || isCalibrated) {
      return;
    }

    // Reset timer and progress if user moves out of position (only if movement is significant)
    const resetCalibration = (reason?: string) => {
      // Check if movement is significant before resetting
      if (previousLandmarksRef.current && landmarks) {
        const currentNose = landmarks.nose;
        const prevNose = previousLandmarksRef.current.nose;
        
        if (currentNose && prevNose) {
          const movement = calculatePixelDistance(
            { x: currentNose.x, y: currentNose.y },
            { x: prevNose.x, y: prevNose.y }
          );
          
          // Only reset if movement is significant (more than threshold)
          if (movement <= MOVEMENT_THRESHOLD_PX && reason !== 'position') {
            // Small movement, don't reset - just update previous landmarks
            previousLandmarksRef.current = {
              nose: landmarks.nose ? { x: landmarks.nose.x, y: landmarks.nose.y } : undefined,
              leftAnkle: landmarks.leftAnkle ? { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y } : undefined,
              rightAnkle: landmarks.rightAnkle ? { x: landmarks.rightAnkle.x, y: landmarks.rightAnkle.y } : undefined,
            };
            return; // Don't reset calibration for small movements
          }
        }
      }
      
      // Significant movement or position issue - reset calibration
      startTimeRef.current = null;
      setProgress(0);
      setShowProgress(false);
      setRemainingSeconds(2);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Update previous landmarks
      if (landmarks) {
        previousLandmarksRef.current = {
          nose: landmarks.nose ? { x: landmarks.nose.x, y: landmarks.nose.y } : undefined,
          leftAnkle: landmarks.leftAnkle ? { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y } : undefined,
          rightAnkle: landmarks.rightAnkle ? { x: landmarks.rightAnkle.x, y: landmarks.rightAnkle.y } : undefined,
        };
      }
    };

    // Check if required landmarks exist
    if (!landmarks?.nose || !landmarks?.leftShoulder || !landmarks?.rightShoulder) {
      setTimeout(() => {
        setCalibrationMessage('Position yourself in frame');
      }, 0);
      resetCalibration('position');
      return;
    }

    // Visibility check: nose, left_shoulder, right_shoulder must have visibility > MIN_VISIBILITY_SCORE
    // If visibility is not available (undefined), assume it's detected (MediaPipe already filtered by minDetectionConfidence)
    const noseVisibility = landmarks.nose.visibility ?? 1.0;
    const leftShoulderVisibility = landmarks.leftShoulder.visibility ?? 1.0;
    const rightShoulderVisibility = landmarks.rightShoulder.visibility ?? 1.0;

    // Check for low confidence/lighting issues
    if (
      noseVisibility < MIN_VISIBILITY_SCORE ||
      leftShoulderVisibility < MIN_VISIBILITY_SCORE ||
      rightShoulderVisibility < MIN_VISIBILITY_SCORE
    ) {
      const minVisibility = Math.min(noseVisibility, leftShoulderVisibility, rightShoulderVisibility);
      if (minVisibility < 0.5) {
        setTimeout(() => {
          setCalibrationMessage('Fix Lighting / Body not found');
        }, 0);
      } else {
        setTimeout(() => {
          setCalibrationMessage('Face the camera directly');
        }, 0);
      }
      resetCalibration('position');
      return;
    }

    // Check if ankles are detected
    if (!landmarks?.leftAnkle || !landmarks?.rightAnkle) {
      setTimeout(() => {
        setCalibrationMessage('Step back to show full body');
      }, 0);
      resetCalibration('position');
      return;
    }

    // Calculate pixel distance between ankles
    const ankleDistancePx = calculatePixelDistance(
      { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y },
      { x: landmarks.rightAnkle.x, y: landmarks.rightAnkle.y }
    );

    // Check if user is too far (ankles too close together in pixels)
    if (ankleDistancePx < MIN_ANKLE_DISTANCE_PX) {
      setTimeout(() => {
        setCalibrationMessage('Step Closer');
      }, 0);
      resetCalibration('position');
      return;
    }

    // Check if user is too close (ankles too far apart in pixels)
    if (ankleDistancePx > MAX_ANKLE_DISTANCE_PX) {
      setTimeout(() => {
        setCalibrationMessage('Step Back');
      }, 0);
      resetCalibration('position');
      return;
    }
    
    // Check for significant movement that would reset calibration
    // Only check if calibration has already started
    if (startTimeRef.current !== null && previousLandmarksRef.current?.nose && landmarks.nose) {
      const movement = calculatePixelDistance(
        { x: landmarks.nose.x, y: landmarks.nose.y },
        { x: previousLandmarksRef.current.nose.x, y: previousLandmarksRef.current.nose.y }
      );
      
      // If there's significant movement during calibration, reset it
      if (movement > MOVEMENT_THRESHOLD_PX) {
        resetCalibration('movement');
        return;
      }
      
      // Small movement - just update landmarks and continue calibration
      previousLandmarksRef.current = {
        nose: { x: landmarks.nose.x, y: landmarks.nose.y },
        leftAnkle: { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y },
        rightAnkle: { x: landmarks.rightAnkle.x, y: landmarks.rightAnkle.y },
      };
      return; // Don't restart timer if already running
    }
    
    // Update previous landmarks for movement tracking
    previousLandmarksRef.current = {
      nose: { x: landmarks.nose.x, y: landmarks.nose.y },
      leftAnkle: { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y },
      rightAnkle: { x: landmarks.rightAnkle.x, y: landmarks.rightAnkle.y },
    };

    // User is in good position - start calibration timer (only if not already started)
    if (startTimeRef.current === null && progressIntervalRef.current === null) {
      startTimeRef.current = Date.now();
      // Instead of setting state here, we rely on the interval to update progress
      // Use setTimeout to avoid synchronous state updates during effect execution
      setTimeout(() => {
        setCalibrationMessage('Hold still...');
        setShowProgress(true);
      }, 0);

      // Start progress update interval
      progressIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const progressPercent = Math.min((elapsed / CALIBRATION_DURATION) * 100, 100);
          const remaining = Math.max(
            Math.ceil((CALIBRATION_DURATION - elapsed) / 1000),
            0
          );
          setProgress(progressPercent);
          setRemainingSeconds(remaining);

          if (elapsed >= CALIBRATION_DURATION) {
            setIsCalibrated(true);
            setCalibrationMessage('Calibrated!');
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            // Small delay before calling onCalibrated to show success message
            calibrationTimerRef.current = setTimeout(() => {
              onCalibrated();
            }, 300);
          }
        }
      }, 30); // Update every 30ms for smoother progress
    }
  }, [landmarks, isLoading, error, isCalibrated, onCalibrated]);

  // Handle skip calibration
  const handleSkip = () => {
    setIsCalibrated(true);
    setCalibrationMessage('Skipping calibration...');
    setTimeout(() => {
      onCalibrated();
    }, 300);
  };

  // Cleanup on unmount - stop webcam stream to release camera resource
  useEffect(() => {
    return () => {
      if (calibrationTimerRef.current) {
        clearTimeout(calibrationTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      
      // Explicitly stop webcam stream to release camera resource
      // This prevents camera lock conflicts when transitioning to game component
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        webcamRef.current.video.srcObject = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-neutral-900 text-white">
        <div className="text-center">
          <p className="text-lg mb-4">Error loading camera</p>
          <p className="text-sm text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900 touch-none">
      {/* Webcam Video */}
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
      />

      {/* Semi-transparent Silhouette Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          width="70%"
          height="85%"
          className="opacity-30 md:opacity-40"
          viewBox="0 0 200 400"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Head */}
          <ellipse
            cx="100"
            cy="50"
            rx="25"
            ry="30"
            fill="white"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />
          {/* Torso */}
          <rect
            x="70"
            y="80"
            width="60"
            height="120"
            rx="10"
            fill="white"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />
          {/* Left Arm */}
          <rect
            x="40"
            y="90"
            width="20"
            height="80"
            rx="10"
            fill="white"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />
          {/* Right Arm */}
          <rect
            x="140"
            y="90"
            width="20"
            height="80"
            rx="10"
            fill="white"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />
          {/* Left Leg */}
          <rect
            x="75"
            y="200"
            width="25"
            height="150"
            rx="10"
            fill="white"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />
          {/* Right Leg */}
          <rect
            x="100"
            y="200"
            width="25"
            height="150"
            rx="10"
            fill="white"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Calibration Status Overlay - Mobile Optimized */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
        <div className="glass-modern rounded-2xl md:rounded-3xl px-6 py-5 md:px-8 md:py-6 text-center max-w-[90vw] md:max-w-md">
          {isLoading ? (
            <div className="text-white">
              <p className="text-base sm:text-lg md:text-xl font-display font-semibold mb-3 md:mb-2 drop-shadow-md">
                Loading camera...
              </p>
              <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-3 md:mb-2 drop-shadow-lg leading-tight">
                {calibrationMessage || 'Position yourself in frame'}
              </p>
              {showProgress && calibrationMessage === 'Hold still...' && (
                <div className="mt-4 md:mt-4">
                  <div className="w-full max-w-xs md:w-64 h-3 md:h-2 bg-white/10 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-blue/80 transition-all duration-100 rounded-full"
                      style={{
                        width: `${Math.min(Math.max(progress, 0), 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm md:text-base text-white/90 mt-3 md:mt-2 font-display font-semibold drop-shadow-md">
                    {remainingSeconds} {remainingSeconds === 1 ? 'second' : 'seconds'}
                  </p>
                </div>
              )}
              {calibrationMessage === 'Calibrated!' && (
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-brand-yellow text-base md:text-lg mt-3 md:mt-2 font-display font-bold drop-shadow-md"
                >
                  ✓ Ready to play!
                </motion.p>
              )}
              {showSkipButton && !isCalibrated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 md:mt-4"
                >
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 md:px-8 md:py-3 bg-white/20 hover:bg-white/30 text-white font-display font-semibold rounded-lg md:rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/30 hover:border-white/50"
                  >
                    Skip Calibration
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Keypoint Indicators (for debugging/visual feedback) */}
      {landmarks && !isLoading && (
        <>
          {landmarks.nose && (
            <div
              className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white z-20 pointer-events-none"
              style={{
                left: `${landmarks.nose.x * 100}%`,
                top: `${landmarks.nose.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          {landmarks.leftAnkle && (
            <div
              className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white z-20 pointer-events-none"
              style={{
                left: `${landmarks.leftAnkle.x * 100}%`,
                top: `${landmarks.leftAnkle.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          {landmarks.rightAnkle && (
            <div
              className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white z-20 pointer-events-none"
              style={{
                left: `${landmarks.rightAnkle.x * 100}%`,
                top: `${landmarks.rightAnkle.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
