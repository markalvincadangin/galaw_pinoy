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
}

/**
 * MediaPipe Pose detection hook
 * Replaces the old TensorFlow MoveNet logic from js/game.js
 * 
 * @param webcamRef - RefObject from react-webcam component
 * @returns Pose landmarks (nose, shoulders, hips, knees) in real-time
 */
export function usePoseDetection(
  webcamRef: RefObject<Webcam | null>
): UsePoseDetectionReturn {
  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const poseRef = useRef<Pose | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize MediaPipe Pose model
  useEffect(() => {
    let isMounted = true;

    const initializePose = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues with MediaPipe
        const { Pose: PoseClass } = await import('@mediapipe/pose');
        const Pose = PoseClass as unknown as PoseConstructor;

        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Handle pose detection results
        pose.onResults((results) => {
          if (!isMounted) return;

          if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            const landmarks = results.poseLandmarks;
            
            // Extract key landmarks (MediaPipe Pose landmark indices)
            // 0: nose, 11: left_shoulder, 12: right_shoulder
            // 23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee
            // 27: left_ankle, 28: right_ankle
            const poseData: PoseLandmarks = {
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

            setLandmarks(poseData);
            setIsDetecting(true);
          } else {
            setLandmarks(null);
            setIsDetecting(false);
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, []);

  // Start/stop detection based on webcam availability
  useEffect(() => {
    if (!poseRef.current || isLoading) {
      return;
    }

    const video = webcamRef.current?.video;
    if (!video) {
      return;
    }

    // Wait for video to be ready
    const handleLoadedMetadata = () => {
      if (!poseRef.current || !video) return;

      // Start pose detection loop
      const detectPose = async () => {
        if (!poseRef.current || !video) return;

        try {
          if (video.readyState >= 2) {
            await poseRef.current.send({ image: video });
          }
        } catch (err) {
          console.error('Pose detection error:', err);
        }

        animationFrameRef.current = requestAnimationFrame(detectPose);
      };

      detectPose();
    };

    if (video.readyState >= 2) {
      handleLoadedMetadata();
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [webcamRef, isLoading]);

  return {
    landmarks,
    isLoading,
    error,
    isDetecting,
  };
}

