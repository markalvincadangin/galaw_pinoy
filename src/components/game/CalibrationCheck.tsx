'use client';

import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { usePoseDetection } from '@/hooks/usePoseDetection';

interface CalibrationCheckProps {
  onCalibrated: () => void;
}

// Pixel distance thresholds for calibration
const MIN_ANKLE_DISTANCE_PX = 50; // Minimum distance in pixels (user too far)
const MAX_ANKLE_DISTANCE_PX = 300; // Maximum distance in pixels (user too close)
const MIN_VISIBILITY_SCORE = 0.8; // Minimum visibility score for key landmarks
const CALIBRATION_DURATION = 3000; // 3 seconds in milliseconds

export default function CalibrationCheck({ onCalibrated }: CalibrationCheckProps) {
  const webcamRef = useRef<Webcam>(null);
  const { landmarks, isLoading, error } = usePoseDetection(webcamRef);
  const [calibrationMessage, setCalibrationMessage] = useState<string>('');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(3);
  const [showProgress, setShowProgress] = useState(false);
  const calibrationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoDimensionsRef = useRef<{ width: number; height: number } | null>(null);

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

  // Check calibration status
  useEffect(() => {
    if (isLoading || error || isCalibrated) {
      return;
    }

    // Clear any existing timer
    if (calibrationTimerRef.current) {
      clearTimeout(calibrationTimerRef.current);
      calibrationTimerRef.current = null;
    }

    // Reset timer and progress if user moves out of position
    const resetCalibration = () => {
      startTimeRef.current = null;
      setProgress(0);
      setShowProgress(false);
      setRemainingSeconds(3);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    // Check if required landmarks exist
    if (!landmarks?.nose || !landmarks?.leftShoulder || !landmarks?.rightShoulder) {
      setTimeout(() => {
        setCalibrationMessage('Position yourself in frame');
      }, 0);
      resetCalibration();
      return;
    }

    // Visibility check: nose, left_shoulder, right_shoulder must have visibility > 0.8
    // If visibility is not available (undefined), assume it's detected (MediaPipe already filtered by minDetectionConfidence)
    const noseVisibility = landmarks.nose.visibility ?? 1.0;
    const leftShoulderVisibility = landmarks.leftShoulder.visibility ?? 1.0;
    const rightShoulderVisibility = landmarks.rightShoulder.visibility ?? 1.0;

    if (
      noseVisibility < MIN_VISIBILITY_SCORE ||
      leftShoulderVisibility < MIN_VISIBILITY_SCORE ||
      rightShoulderVisibility < MIN_VISIBILITY_SCORE
    ) {
      setTimeout(() => {
        setCalibrationMessage('Face the camera directly');
      }, 0);
      resetCalibration();
      return;
    }

    // Check if ankles are detected
    if (!landmarks?.leftAnkle || !landmarks?.rightAnkle) {
      setTimeout(() => {
        setCalibrationMessage('Step back to show full body');
      }, 0);
      resetCalibration();
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
      resetCalibration();
      return;
    }

    // Check if user is too close (ankles too far apart in pixels)
    if (ankleDistancePx > MAX_ANKLE_DISTANCE_PX) {
      setTimeout(() => {
        setCalibrationMessage('Step Back');
      }, 0);
      resetCalibration();
      return;
    }

    // User is in good position - start calibration timer
    setTimeout(() => {
      setCalibrationMessage('Hold still...');
      setShowProgress(true);
    }, 0);

    // If we haven't started a timer yet, start one
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      setTimeout(() => {
        setProgress(0);
      }, 0);

      // Start progress update interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
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
            }, 500);
          }
        }
      }, 50); // Update every 50ms for smooth progress
    }
  }, [landmarks, isLoading, error, isCalibrated, onCalibrated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (calibrationTimerRef.current) {
        clearTimeout(calibrationTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
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
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900">
      {/* Webcam Video */}
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        className="w-full h-full object-cover"
        videoConstraints={{
          facingMode: 'user',
        }}
      />

      {/* Semi-transparent Silhouette Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          width="60%"
          height="90%"
          viewBox="0 0 200 400"
          className="opacity-30"
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

      {/* Calibration Status Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-8 py-6 text-center">
          {isLoading ? (
            <div className="text-white">
              <p className="text-lg font-medium mb-2">Loading camera...</p>
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-white mb-2">
                {calibrationMessage || 'Position yourself in frame'}
              </p>
              {showProgress && calibrationMessage === 'Hold still...' && (
                <div className="mt-4">
                  <div className="w-64 h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-100"
                      style={{
                        width: `${Math.min(Math.max(progress, 0), 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-neutral-300 mt-2">
                    {remainingSeconds} seconds
                  </p>
                </div>
              )}
              {calibrationMessage === 'Calibrated!' && (
                <p className="text-green-400 text-sm mt-2">✓ Ready to play!</p>
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
