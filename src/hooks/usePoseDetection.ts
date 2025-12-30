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
  // Log hook initialization immediately - use multiple console methods to ensure visibility
  console.log('[PoseDetection] ========== Hook initialized ==========');
  console.warn('[PoseDetection] Hook initialized (warn)', {
    hasWebcamRef: !!webcamRef,
    webcamRefCurrent: !!webcamRef?.current,
  });
  console.log('[PoseDetection] Hook initialized (log)', {
    hasWebcamRef: !!webcamRef,
    webcamRefCurrent: !!webcamRef?.current,
  });

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
  // CRITICAL: Use useRef to persist initialization state across React Strict Mode remounts
  // This prevents MediaPipe WASM from initializing twice and causing abort() crashes
  const isLoadedRef = useRef(false);
  const isInitializingRef = useRef(false);
  // CRITICAL: Use useRef for isMounted so that onResults callbacks always check the current mount state
  // This prevents "component unmounted" issues when React Strict Mode remounts
  const isMountedRef = useRef(true);

  console.log('[PoseDetection] About to define initialization useEffect...');

  // Initialize MediaPipe Pose model
  useEffect(() => {
    // CRITICAL: Set mounted flag to true at the start of every effect run
    // This ensures that onResults callbacks work even when we skip initialization (e.g., in Strict Mode remount)
    isMountedRef.current = true;
    
    console.log('[PoseDetection] ========== Initialization effect triggered ==========');
    console.log('[PoseDetection] Initialization effect triggered', {
      isLoaded: isLoadedRef.current,
      isInitializing: isInitializingRef.current,
      hasPoseRef: !!poseRef.current,
      isMounted: isMountedRef.current,
    });

    // CHECK THE LOCK: If already loaded/loading, STOP immediately.
    // This prevents double-initialization in React Strict Mode.
    // BUT: If isLoaded is true but poseRef is null, we need to re-initialize
    if (isInitializingRef.current) {
      console.log('[PoseDetection] ⚠ Initialization skipped - already initializing');
      return;
    }

    if (isLoadedRef.current && poseRef.current) {
      console.log('[PoseDetection] ✓ Already initialized and poseRef exists - skipping initialization');
      // If already loaded and poseRef exists, make sure loading state is false
      setIsLoading(false);
      return;
    }

    // If isLoaded is true but poseRef is null, we need to reset and re-initialize
    if (isLoadedRef.current && !poseRef.current) {
      console.warn('[PoseDetection] ⚠⚠⚠ isLoaded is true but poseRef is null - resetting and re-initializing');
      isLoadedRef.current = false;
    }

    console.log('[PoseDetection] Proceeding with initialization...');

    // Lock it immediately to prevent concurrent initializations
    isInitializingRef.current = true;
    console.log('[PoseDetection] Starting MediaPipe initialization...');

    const initializePose = async () => {
      console.log('[PoseDetection] initializePose async function called');
      try {
        console.log('[PoseDetection] Setting loading state to true');
        setIsLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues with MediaPipe
        // Wrap in try-catch to handle Turbopack/WebAssembly loading errors
        let PoseClass;
        try {
          console.log('[PoseDetection] Importing @mediapipe/pose module...');
          const poseModule = await import('@mediapipe/pose');
          PoseClass = poseModule.Pose;
          console.log('[PoseDetection] ✓ MediaPipe module imported successfully');
        } catch (importError) {
          console.error('[PoseDetection] ✗ Failed to import MediaPipe Pose:', importError);
          isInitializingRef.current = false; // Reset lock on error so retry is possible
          if (isMountedRef.current) {
            setError('Failed to load pose detection. Please refresh the page.');
            setIsLoading(false);
          }
          return;
        }
        
        const Pose = PoseClass as unknown as PoseConstructor;

        // Wrap Pose constructor in try-catch to handle WebAssembly/Turbopack errors
        let pose;
        try {
          console.log('[PoseDetection] Creating Pose instance...');
          pose = new Pose({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
          });
          console.log('[PoseDetection] ✓ Pose instance created successfully');
        } catch (constructorError) {
          console.error('[PoseDetection] ✗ Failed to create Pose instance:', constructorError);
          isInitializingRef.current = false; // Reset lock on error so retry is possible
          if (isMountedRef.current) {
            setError('Failed to initialize pose detection model. Please refresh the page.');
            setIsLoading(false);
          }
          return;
        }

        try {
          console.log('[PoseDetection] Setting Pose options...');
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          console.log('[PoseDetection] ✓ Pose options configured');
        } catch (optionsError) {
          console.error('[PoseDetection] ✗ Failed to set Pose options:', optionsError);
          isInitializingRef.current = false; // Reset lock on error so retry is possible
          if (isMountedRef.current) {
            setError('Failed to configure pose detection. Please refresh the page.');
            setIsLoading(false);
          }
          return;
        }

        // Handle pose detection results
        console.log('[PoseDetection] Setting up onResults callback...');
        pose.onResults((results) => {
          if (!isMountedRef.current) {
            console.log('[PoseDetection] onResults called but component unmounted');
            return;
          }

          const hasLandmarks = results.poseLandmarks && results.poseLandmarks.length > 0;
          if (hasLandmarks) {
            const landmarkCount = results.poseLandmarks?.length || 0;
            console.log(`[PoseDetection] ✓ Pose detected! ${landmarkCount} landmarks`);
          } else {
            // Only log no pose every 30 frames to avoid spam (roughly once per second at 30fps)
            const now = Date.now();
            if (!previousLandmarksRef.current || (now % 1000 < 33)) {
              console.log('[PoseDetection] ⚠ No pose landmarks detected in frame');
            }
          }

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
        isLoadedRef.current = true; // Mark as successfully loaded
        isInitializingRef.current = false;
        setIsLoading(false);
        console.log('[PoseDetection] ✓ Initialization complete! Pose detection ready.');
      } catch (err) {
        console.error('[PoseDetection] ✗ Failed to initialize MediaPipe Pose:', err);
        isInitializingRef.current = false; // Reset lock on error so retry is possible
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to initialize pose detection');
          setIsLoading(false);
        }
      }
    };

    console.log('[PoseDetection] Calling initializePose()...');
    initializePose().catch((err) => {
      console.error('[PoseDetection] Unhandled error in initializePose:', err);
    });

    return () => {
      console.log('[PoseDetection] Cleanup: Initialization effect cleanup running');
      isMountedRef.current = false;
      // IMPORTANT: Only cleanup if the component is TRULY unmounting (not just React Strict Mode remount).
      // In React Strict Mode, this cleanup runs between Mount 1 and Mount 2.
      // We DON'T reset isLoadedRef here because that would allow double-initialization.
      // Only reset if we're certain this is a real unmount (which is hard to detect).
      // For MediaPipe, it's safer to keep the lock and let the browser handle resource cleanup.
      
      // Cleanup animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // CAREFUL: Disposing MediaPipe too quickly in cleanup causes crashes.
      // Only dispose if we're certain this is a final unmount, not a Strict Mode remount.
      // For now, we let MediaPipe handle its own cleanup to avoid WASM crashes.
      // If you need to dispose, uncomment the code below, but test thoroughly:
      /*
      if (poseRef.current) {
        try {
          poseRef.current.close();
        } catch (err) {
          // Ignore errors during cleanup - MediaPipe may already be disposed
        }
        poseRef.current = null;
      }
      */
    };
  }, []); // Empty dependency array - only run once on mount

  console.log('[PoseDetection] About to define detection loop useEffect...');

  // Start/stop detection based on webcam availability
  useEffect(() => {
    console.log('[PoseDetection] ========== Detection loop effect triggered ==========');
    const hasPoseRef = !!poseRef.current;
    
    // Check if we should even try to start
    if (!poseRef.current || isLoading || detectionRunningRef.current) {
      console.log('[PoseDetection] Detection loop skipped', {
        reason: !poseRef.current ? 'no poseRef' : isLoading ? 'still loading' : 'already running',
      });
      return;
    }

    let isRunning = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const startDetectionLoop = () => {
      if (!isRunning) return;

      const video = webcamRef.current?.video;
      
      // FIX: If video not found, retry in 500ms instead of giving up
      if (!video) {
        console.log('[PoseDetection] Video element not found yet, retrying in 500ms...');
        retryTimeout = setTimeout(startDetectionLoop, 500);
        return;
      }

      console.log('[PoseDetection] Starting detection loop...', {
        videoReadyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });

      detectionRunningRef.current = true;

      // Wait for video to be ready
      const handleLoadedMetadata = () => {
        if (!isRunning || !poseRef.current || !video) {
          console.log('[PoseDetection] handleLoadedMetadata: conditions not met, returning');
          return;
        }

        console.log('[PoseDetection] Video metadata loaded');
        let frameCount = 0;

        // Start pose detection loop
        const detectPose = async () => {
          if (!isRunning || !poseRef.current || !video) {
            console.log('[PoseDetection] Detection loop stopped');
            detectionRunningRef.current = false;
            return;
          }

          frameCount++;
          // Log occasionally
          if (frameCount % 60 === 0) {
            console.log(`[PoseDetection] Detection loop running... frame ${frameCount}`, {
              videoReadyState: video.readyState,
              hasPoseRef: !!poseRef.current,
            });
          }

          try {
            if (video.readyState >= 2) {
              await poseRef.current.send({ image: video });
            } else {
              if (frameCount % 60 === 0) {
                console.log(`[PoseDetection] Video not ready (readyState: ${video.readyState}), skipping frame`);
              }
            }
          } catch (err) {
            // Log errors but don't spam
            if (isRunning && frameCount % 60 === 0) {
              console.error('[PoseDetection] Error sending frame to pose detector:', err);
            }
          }

          if (isRunning && poseRef.current && video) {
            animationFrameRef.current = requestAnimationFrame(detectPose);
          } else {
            console.log('[PoseDetection] Stopping detection loop');
            detectionRunningRef.current = false;
          }
        };

        if (isRunning) {
          console.log('[PoseDetection] Starting detectPose loop...');
          detectPose();
        }
      };

      if (video.readyState >= 2) {
        console.log('[PoseDetection] Video already ready, calling handleLoadedMetadata immediately');
        handleLoadedMetadata();
      } else {
        console.log('[PoseDetection] Waiting for video loadedmetadata event...');
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
    };

    // Start the process
    startDetectionLoop();

    return () => {
      console.log('[PoseDetection] Cleaning up detection loop');
      isRunning = false;
      detectionRunningRef.current = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      
      const video = webcamRef.current?.video;
      // Note: We can't easily remove the specific event listener instance here because it was defined inside the closure,
      // but since we check `isRunning` inside handleLoadedMetadata, it's safe.
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isLoading]); // Only depend on isLoading, webcamRef is stable

  // Log state changes for debugging
  useEffect(() => {
    console.log('[PoseDetection] State update', {
      isLoading,
      error,
      isDetecting,
      hasLandmarks: !!landmarks,
      landmarkCount: landmarks ? Object.keys(landmarks).length : 0,
    });
  }, [isLoading, error, isDetecting, landmarks]);

  // Monitor webcam availability periodically (using interval instead of dependency)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const webcam = webcamRef.current;
      const video = webcam?.video;
      if (video && video.readyState !== undefined) {
        console.log('[PoseDetection] Webcam status check', {
          hasVideo: !!video,
          videoReadyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          isLoading,
          hasPoseRef: !!poseRef.current,
        });
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [isLoading]);

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
