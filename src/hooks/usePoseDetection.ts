'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type Webcam from 'react-webcam';

// MediaPipe Pose type - dynamically imported to avoid SSR issues
type Pose = {
  setOptions: (options: {
    modelComplexity: number;
    smoothLandmarks: boolean;
    enableSegmentation: boolean;
    smoothSegmentation: boolean;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: {
    poseLandmarks?: Array<{ x: number; y: number; z?: number; visibility?: number }>;
  }) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
};

type PoseConstructor = new (config: {
  locateFile: (file: string) => string;
}) => Pose;

/**
 * Pose landmarks interface matching MediaPipe Pose output
 * Normalized coordinates (0-1) for x, y, z
 * Visibility score (0-1) indicates landmark detection confidence
 */
export interface PoseLandmarks {
  nose?: { x: number; y: number; z?: number; visibility?: number };
  leftShoulder?: { x: number; y: number; z?: number; visibility?: number };
  rightShoulder?: { x: number; y: number; z?: number; visibility?: number };
  leftHip?: { x: number; y: number; z?: number; visibility?: number };
  rightHip?: { x: number; y: number; z?: number; visibility?: number };
  leftKnee?: { x: number; y: number; z?: number; visibility?: number };
  rightKnee?: { x: number; y: number; z?: number; visibility?: number };
  leftAnkle?: { x: number; y: number; z?: number; visibility?: number };
  rightAnkle?: { x: number; y: number; z?: number; visibility?: number };
}

/**
 * Hook return type
 */
export interface UsePoseDetectionReturn {
  landmarks: PoseLandmarks | null;
  isLoading: boolean;
  error: string | null;
  isDetecting: boolean;
  userHeight: number | null; // Normalized distance from nose to ankle (0-1 scale)
  // Additional data for physics-based analysis
  averageHipY: number | null; // Average Y position of hips (for velocity tracking)
  averageAnkleY: number | null; // Average Y position of ankles (for cheating detection)
  hipAnkleDistance: number | null; // Distance between hips and ankles (for squat detection)
}

/**
 * MediaPipe Pose detection hook
 * Replaces the old TensorFlow MoveNet logic from js/game.js
 * 
 * @param webcamRef - RefObject from react-webcam component
 * @returns Pose landmarks (nose, shoulders, hips, knees) in real-time
 */
/**
 * Linear interpolation (Lerp) function for smoothing
 * @param previous - Previous value
 * @param current - Current value
 * @param factor - Interpolation factor (0-1), where 0.5 means equal weight
 * @returns Smoothed value
 */
function lerp(previous: number, current: number, factor: number = 0.5): number {
  return previous * (1 - factor) + current * factor;
}

/**
 * Calculate distance between two 3D points
 */
function calculateDistance(
  p1: { x: number; y: number; z?: number },
  p2: { x: number; y: number; z?: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = (p2.z ?? 0) - (p1.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function usePoseDetection(
  webcamRef: RefObject<Webcam | null>
): UsePoseDetectionReturn {
  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [averageHipY, setAverageHipY] = useState<number | null>(null);
  const [averageAnkleY, setAverageAnkleY] = useState<number | null>(null);
  const [hipAnkleDistance, setHipAnkleDistance] = useState<number | null>(null);

  const poseRef = useRef<Pose | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousLandmarksRef = useRef<PoseLandmarks | null>(null);
  const detectionRunningRef = useRef(false);

  // Initialize MediaPipe Pose model
  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;

    const initializePose = async () => {
      // Prevent multiple initializations
      if (hasInitialized) return;
      hasInitialized = true;

      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues with MediaPipe
        // Wrap in try-catch to handle Turbopack/WebAssembly loading errors
        let PoseClass;
        try {
          const poseModule = await import('@mediapipe/pose');
          PoseClass = poseModule.Pose;
        } catch (importError) {
          console.error('Failed to import MediaPipe Pose:', importError);
          if (isMounted) {
            setError('Failed to load pose detection. Please refresh the page.');
            setIsLoading(false);
          }
          return;
        }
        
        const Pose = PoseClass as unknown as PoseConstructor;

        // Wrap Pose constructor in try-catch to handle WebAssembly/Turbopack errors
        let pose;
        try {
          pose = new Pose({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
          });
        } catch (constructorError) {
          console.error('Failed to create Pose instance:', constructorError);
          if (isMounted) {
            setError('Failed to initialize pose detection model. Please refresh the page.');
            setIsLoading(false);
          }
          return;
        }

        try {
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (optionsError) {
          console.error('Failed to set Pose options:', optionsError);
          if (isMounted) {
            setError('Failed to configure pose detection. Please refresh the page.');
            setIsLoading(false);
          }
          return;
        }

        // Handle pose detection results
        pose.onResults((results) => {
          if (!isMounted) return;

          if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            const landmarks = results.poseLandmarks;
            const previous = previousLandmarksRef.current;
            
            // Extract key landmarks (MediaPipe Pose landmark indices)
            // 0: nose, 11: left_shoulder, 12: right_shoulder
            // 23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee
            // 27: left_ankle, 28: right_ankle
            const rawPoseData: PoseLandmarks = {
              nose: landmarks[0]
                ? {
                    x: landmarks[0].x,
                    y: landmarks[0].y,
                    z: landmarks[0].z,
                    visibility: (landmarks[0] as { visibility?: number }).visibility,
                  }
                : undefined,
              leftShoulder: landmarks[11]
                ? {
                    x: landmarks[11].x,
                    y: landmarks[11].y,
                    z: landmarks[11].z,
                    visibility: (landmarks[11] as { visibility?: number }).visibility,
                  }
                : undefined,
              rightShoulder: landmarks[12]
                ? {
                    x: landmarks[12].x,
                    y: landmarks[12].y,
                    z: landmarks[12].z,
                    visibility: (landmarks[12] as { visibility?: number }).visibility,
                  }
                : undefined,
              leftHip: landmarks[23]
                ? {
                    x: landmarks[23].x,
                    y: landmarks[23].y,
                    z: landmarks[23].z,
                    visibility: (landmarks[23] as { visibility?: number }).visibility,
                  }
                : undefined,
              rightHip: landmarks[24]
                ? {
                    x: landmarks[24].x,
                    y: landmarks[24].y,
                    z: landmarks[24].z,
                    visibility: (landmarks[24] as { visibility?: number }).visibility,
                  }
                : undefined,
              leftKnee: landmarks[25]
                ? {
                    x: landmarks[25].x,
                    y: landmarks[25].y,
                    z: landmarks[25].z,
                    visibility: (landmarks[25] as { visibility?: number }).visibility,
                  }
                : undefined,
              rightKnee: landmarks[26]
                ? {
                    x: landmarks[26].x,
                    y: landmarks[26].y,
                    z: landmarks[26].z,
                    visibility: (landmarks[26] as { visibility?: number }).visibility,
                  }
                : undefined,
              leftAnkle: landmarks[27]
                ? {
                    x: landmarks[27].x,
                    y: landmarks[27].y,
                    z: landmarks[27].z,
                    visibility: (landmarks[27] as { visibility?: number }).visibility,
                  }
                : undefined,
              rightAnkle: landmarks[28]
                ? {
                    x: landmarks[28].x,
                    y: landmarks[28].y,
                    z: landmarks[28].z,
                    visibility: (landmarks[28] as { visibility?: number }).visibility,
                  }
                : undefined,
            };

            // Apply smoothing (Lerp) to Nose, Hips, and Ankles
            const smoothedPoseData: PoseLandmarks = { ...rawPoseData };

            // Smooth nose
            if (rawPoseData.nose) {
              if (previous?.nose) {
                smoothedPoseData.nose = {
                  x: lerp(previous.nose.x, rawPoseData.nose.x),
                  y: lerp(previous.nose.y, rawPoseData.nose.y),
                  z: rawPoseData.nose.z !== undefined && previous.nose.z !== undefined
                    ? lerp(previous.nose.z, rawPoseData.nose.z)
                    : rawPoseData.nose.z,
                  visibility: rawPoseData.nose.visibility,
                };
              }
            }

            // Smooth left hip
            if (rawPoseData.leftHip) {
              if (previous?.leftHip) {
                smoothedPoseData.leftHip = {
                  x: lerp(previous.leftHip.x, rawPoseData.leftHip.x),
                  y: lerp(previous.leftHip.y, rawPoseData.leftHip.y),
                  z: rawPoseData.leftHip.z !== undefined && previous.leftHip.z !== undefined
                    ? lerp(previous.leftHip.z, rawPoseData.leftHip.z)
                    : rawPoseData.leftHip.z,
                  visibility: rawPoseData.leftHip.visibility,
                };
              }
            }

            // Smooth right hip
            if (rawPoseData.rightHip) {
              if (previous?.rightHip) {
                smoothedPoseData.rightHip = {
                  x: lerp(previous.rightHip.x, rawPoseData.rightHip.x),
                  y: lerp(previous.rightHip.y, rawPoseData.rightHip.y),
                  z: rawPoseData.rightHip.z !== undefined && previous.rightHip.z !== undefined
                    ? lerp(previous.rightHip.z, rawPoseData.rightHip.z)
                    : rawPoseData.rightHip.z,
                  visibility: rawPoseData.rightHip.visibility,
                };
              }
            }

            // Smooth left ankle
            if (rawPoseData.leftAnkle) {
              if (previous?.leftAnkle) {
                smoothedPoseData.leftAnkle = {
                  x: lerp(previous.leftAnkle.x, rawPoseData.leftAnkle.x),
                  y: lerp(previous.leftAnkle.y, rawPoseData.leftAnkle.y),
                  z: rawPoseData.leftAnkle.z !== undefined && previous.leftAnkle.z !== undefined
                    ? lerp(previous.leftAnkle.z, rawPoseData.leftAnkle.z)
                    : rawPoseData.leftAnkle.z,
                  visibility: rawPoseData.leftAnkle.visibility,
                };
              }
            }

            // Smooth right ankle
            if (rawPoseData.rightAnkle) {
              if (previous?.rightAnkle) {
                smoothedPoseData.rightAnkle = {
                  x: lerp(previous.rightAnkle.x, rawPoseData.rightAnkle.x),
                  y: lerp(previous.rightAnkle.y, rawPoseData.rightAnkle.y),
                  z: rawPoseData.rightAnkle.z !== undefined && previous.rightAnkle.z !== undefined
                    ? lerp(previous.rightAnkle.z, rawPoseData.rightAnkle.z)
                    : rawPoseData.rightAnkle.z,
                  visibility: rawPoseData.rightAnkle.visibility,
                };
              }
            }

            // Calculate userHeight: distance from nose to ankle (average of left and right ankle)
            if (smoothedPoseData.nose && smoothedPoseData.leftAnkle && smoothedPoseData.rightAnkle) {
              // Calculate midpoint between left and right ankle
              const ankleMidpoint = {
                x: (smoothedPoseData.leftAnkle.x + smoothedPoseData.rightAnkle.x) / 2,
                y: (smoothedPoseData.leftAnkle.y + smoothedPoseData.rightAnkle.y) / 2,
                z: (smoothedPoseData.leftAnkle.z ?? 0) + (smoothedPoseData.rightAnkle.z ?? 0) / 2,
              };

              // Calculate distance from nose to ankle midpoint (normalized, 0-1 scale)
              const height = calculateDistance(
                { x: smoothedPoseData.nose.x, y: smoothedPoseData.nose.y, z: smoothedPoseData.nose.z ?? 0 },
                ankleMidpoint
              );

              setUserHeight(height);
            } else {
              setUserHeight(null);
            }

            // Calculate average hip Y position (for velocity tracking)
            if (smoothedPoseData.leftHip && smoothedPoseData.rightHip) {
              const avgHipY = (smoothedPoseData.leftHip.y + smoothedPoseData.rightHip.y) / 2;
              setAverageHipY(avgHipY);
            } else {
              setAverageHipY(null);
            }

            // Calculate average ankle Y position (for cheating detection)
            if (smoothedPoseData.leftAnkle && smoothedPoseData.rightAnkle) {
              const avgAnkleY = (smoothedPoseData.leftAnkle.y + smoothedPoseData.rightAnkle.y) / 2;
              setAverageAnkleY(avgAnkleY);
            } else {
              setAverageAnkleY(null);
            }

            // Calculate hip-ankle distance (for squat detection)
            if (smoothedPoseData.leftHip && smoothedPoseData.rightHip && 
                smoothedPoseData.leftAnkle && smoothedPoseData.rightAnkle) {
              const avgHip = {
                x: (smoothedPoseData.leftHip.x + smoothedPoseData.rightHip.x) / 2,
                y: (smoothedPoseData.leftHip.y + smoothedPoseData.rightHip.y) / 2,
                z: ((smoothedPoseData.leftHip.z ?? 0) + (smoothedPoseData.rightHip.z ?? 0)) / 2,
              };
              const avgAnkle = {
                x: (smoothedPoseData.leftAnkle.x + smoothedPoseData.rightAnkle.x) / 2,
                y: (smoothedPoseData.leftAnkle.y + smoothedPoseData.rightAnkle.y) / 2,
                z: ((smoothedPoseData.leftAnkle.z ?? 0) + (smoothedPoseData.rightAnkle.z ?? 0)) / 2,
              };
              const distance = calculateDistance(avgHip, avgAnkle);
              setHipAnkleDistance(distance);
            } else {
              setHipAnkleDistance(null);
            }

            // Update previous landmarks for next frame
            previousLandmarksRef.current = smoothedPoseData;

            setLandmarks(smoothedPoseData);
            setIsDetecting(true);
          } else {
            setLandmarks(null);
            setIsDetecting(false);
            setUserHeight(null);
            setAverageHipY(null);
            setAverageAnkleY(null);
            setHipAnkleDistance(null);
            previousLandmarksRef.current = null;
          }
        });

        poseRef.current = pose;
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize MediaPipe Pose:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize pose detection');
          setIsLoading(false);
        }
      }
    };

    initializePose();

    return () => {
      isMounted = false;
      hasInitialized = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (err) {
          // Ignore errors during cleanup
        }
        poseRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Start/stop detection based on webcam availability
  useEffect(() => {
    if (!poseRef.current || isLoading || detectionRunningRef.current) {
      return;
    }

    const video = webcamRef.current?.video;
    if (!video) {
      return;
    }

    let isRunning = true;
    detectionRunningRef.current = true;

    // Wait for video to be ready
    const handleLoadedMetadata = () => {
      if (!isRunning || !poseRef.current || !video) return;

      // Start pose detection loop
      const detectPose = async () => {
        if (!isRunning || !poseRef.current || !video) {
          detectionRunningRef.current = false;
          return;
        }

        try {
          if (video.readyState >= 2) {
            await poseRef.current.send({ image: video });
          }
        } catch (err) {
          // Silently handle errors - may happen during cleanup or if video is not ready
          if (isRunning) {
            console.error('Pose detection error:', err);
          }
        }

        if (isRunning && poseRef.current && video) {
          animationFrameRef.current = requestAnimationFrame(detectPose);
        } else {
          detectionRunningRef.current = false;
        }
      };

      if (isRunning) {
        detectPose();
      }
    };

    if (video.readyState >= 2) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    }

    return () => {
      isRunning = false;
      detectionRunningRef.current = false;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isLoading]); // Only depend on isLoading, webcamRef is stable

  return {
    landmarks,
    isLoading,
    error,
    isDetecting,
    userHeight,
    averageHipY,
    averageAnkleY,
    hipAnkleDistance,
  };
}
