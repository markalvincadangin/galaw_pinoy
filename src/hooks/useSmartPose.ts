'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import type Webcam from 'react-webcam';
import { usePoseDetection, type PoseLandmarks } from './usePoseDetection';

// KNN Classifier types
type ExampleVector = number[];
type KNNClassifier = {
  addExample: (example: ExampleVector, label: number) => void;
  predictClass: (input: ExampleVector, k?: number) => Promise<{ label: number; confidences: { [label: number]: number } }>;
  clearClass: (label: number) => void;
  clearAllClasses: () => void;
  getClassExampleCount: () => { [label: number]: number };
};

type KNNClassifierConstructor = new () => KNNClassifier;

/**
 * Prediction result interface
 */
export interface PosePrediction {
  label: string | null;
  confidence: number;
}

/**
 * Hook return type
 */
export interface UseSmartPoseReturn {
  // Prediction
  predictedPose: PosePrediction;
  
  // Training functions
  trainPose: (label: string) => void;
  predictPose: () => Promise<PosePrediction>;
  
  // Classifier state
  isLoading: boolean;
  error: string | null;
  exampleCounts: { [label: string]: number };
  
  // Utility functions
  clearLabel: (label: string) => void;
  clearAllLabels: () => void;
}

/**
 * Convert MediaPipe pose landmarks to a feature vector (Tensor)
 * Flattens all landmark coordinates (x, y, z) into a single array
 */
function landmarksToFeatureVector(landmarks: PoseLandmarks): number[] {
  const features: number[] = [];
  
  // Define landmark order for consistent feature vector
  const landmarkKeys: (keyof PoseLandmarks)[] = [
    'nose',
    'leftShoulder',
    'rightShoulder',
    'leftHip',
    'rightHip',
    'leftKnee',
    'rightKnee',
    'leftAnkle',
    'rightAnkle',
  ];
  
  for (const key of landmarkKeys) {
    const landmark = landmarks[key];
    if (landmark) {
      features.push(landmark.x, landmark.y, landmark.z ?? 0);
    } else {
      // Fill with zeros if landmark is missing
      features.push(0, 0, 0);
    }
  }
  
  return features;
}

/**
 * Smart Pose Detection Hook with KNN Classifier
 * Wraps MediaPipe pose detection with machine learning classification
 * 
 * @param webcamRef - RefObject from react-webcam component
 * @returns Pose classification functions and predictions
 */
export function useSmartPose(
  webcamRef: RefObject<Webcam | null>
): UseSmartPoseReturn {
  const { landmarks, isLoading: poseLoading, error: poseError } = usePoseDetection(webcamRef);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictedPose, setPredictedPose] = useState<PosePrediction>({ label: null, confidence: 0 });
  const [exampleCounts, setExampleCounts] = useState<{ [label: string]: number }>({});
  
  const classifierRef = useRef<KNNClassifier | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tfRef = useRef<any>(null); // TensorFlow.js reference (dynamic import, type unknown)
  const labelMapRef = useRef<Map<number, string>>(new Map()); // Map numeric labels to string labels
  const labelToNumberRef = useRef<Map<string, number>>(new Map()); // Map string labels to numeric labels
  const nextLabelNumberRef = useRef<number>(0);
  const currentPredictionRef = useRef<PosePrediction>({ label: null, confidence: 0 });

  // Initialize KNN Classifier
  useEffect(() => {
    let isMounted = true;

    const initializeClassifier = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import to avoid SSR issues
        const knnClassifierModule = await import('@tensorflow-models/knn-classifier');
        const KNNClassifier = knnClassifierModule.KNNClassifier as unknown as KNNClassifierConstructor;
        
        // Import TensorFlow.js for tensor operations (cache it)
        const tf = await import('@tensorflow/tfjs-core');
        tfRef.current = tf;
        
        const classifier = new KNNClassifier();
        classifierRef.current = classifier;
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize KNN Classifier:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize KNN classifier');
          setIsLoading(false);
        }
      }
    };

    initializeClassifier();

    return () => {
      isMounted = false;
      classifierRef.current = null;
      tfRef.current = null;
      // Copy ref values to variables for cleanup
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const labelMap = labelMapRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const labelToNumber = labelToNumberRef.current;
      if (labelMap) labelMap.clear();
      if (labelToNumber) labelToNumber.clear();
      nextLabelNumberRef.current = 0;
    };
  }, []);

  // Get or create numeric label for string label
  const getLabelNumber = useCallback((label: string): number => {
    if (labelToNumberRef.current.has(label)) {
      return labelToNumberRef.current.get(label)!;
    }
    
    const number = nextLabelNumberRef.current++;
    labelToNumberRef.current.set(label, number);
    labelMapRef.current.set(number, label);
    return number;
  }, []);

  // Train pose with a label
  const trainPose = useCallback((label: string) => {
    if (!classifierRef.current || !landmarks || !tfRef.current) {
      console.warn('Cannot train: classifier not initialized or no landmarks');
      return;
    }

    try {
      // Convert landmarks to feature vector
      const features = landmarksToFeatureVector(landmarks);
      
      // Create tensor from feature vector
      const tensor = tfRef.current.tensor2d([features]);
      
      // Get numeric label
      const labelNumber = getLabelNumber(label);
      
      // Add example to classifier
      classifierRef.current.addExample(tensor, labelNumber);
      
      // Update example counts
      setExampleCounts((prev) => ({
        ...prev,
        [label]: (prev[label] || 0) + 1,
      }));
      
      // Dispose tensor to free memory
      tensor.dispose();
    } catch (err) {
      console.error('Error in trainPose:', err);
    }
  }, [landmarks, getLabelNumber]);

  // Predict pose with confidence threshold
  const predictPose = useCallback(async (): Promise<PosePrediction> => {
    if (!classifierRef.current || !landmarks || !tfRef.current) {
      return { label: null, confidence: 0 };
    }

    try {
      // Convert landmarks to feature vector
      const features = landmarksToFeatureVector(landmarks);
      
      // Create tensor from feature vector
      const tensor = tfRef.current.tensor2d([features]);
      
      // Predict class
      const prediction = await classifierRef.current.predictClass(tensor, 3); // k=3 for KNN
      
      // Dispose tensor to free memory
      tensor.dispose();
      
      // Get string label from numeric label
      const labelNumber = prediction.label;
      const label = labelMapRef.current.get(labelNumber) || null;
      const confidence = prediction.confidences[labelNumber] || 0;
      
      // Only update if confidence > 0.8 (smoothing to prevent flickering)
      if (confidence > 0.8) {
        const newPrediction: PosePrediction = { label, confidence };
        currentPredictionRef.current = newPrediction;
        return newPrediction;
      } else {
        // Return current prediction if confidence is too low (maintains stability)
        return currentPredictionRef.current;
      }
    } catch (err) {
      console.error('Error in predictPose:', err);
      return { label: null, confidence: 0 };
    }
  }, [landmarks]);

  // Auto-predict when landmarks change (if classifier is ready)
  useEffect(() => {
    if (!classifierRef.current || !landmarks || isLoading || poseLoading) {
      return;
    }

    // Only predict if we have trained examples
    const counts = classifierRef.current.getClassExampleCount();
    if (Object.keys(counts).length === 0) {
      return;
    }

    predictPose().then((prediction) => {
      setPredictedPose(prediction);
    });
  }, [landmarks, isLoading, poseLoading, predictPose]);

  // Clear examples for a specific label
  const clearLabel = useCallback((label: string) => {
    if (!classifierRef.current || !labelToNumberRef.current.has(label)) {
      return;
    }

    const labelNumber = labelToNumberRef.current.get(label)!;
    classifierRef.current.clearClass(labelNumber);
    
    // Update example counts
    setExampleCounts((prev) => {
      const updated = { ...prev };
      delete updated[label];
      return updated;
    });
  }, []);

  // Clear all examples
  const clearAllLabels = useCallback(() => {
    if (!classifierRef.current) {
      return;
    }

    classifierRef.current.clearAllClasses();
    labelMapRef.current.clear();
    labelToNumberRef.current.clear();
    nextLabelNumberRef.current = 0;
    setExampleCounts({});
    setPredictedPose({ label: null, confidence: 0 });
    currentPredictionRef.current = { label: null, confidence: 0 };
  }, []);

  // Update example counts when classifier changes
  useEffect(() => {
    if (!classifierRef.current) {
      return;
    }

    const counts = classifierRef.current.getClassExampleCount();
    const stringCounts: { [label: string]: number } = {};
    
    for (const [labelNumber, count] of Object.entries(counts)) {
      const label = labelMapRef.current.get(Number(labelNumber));
      if (label) {
        stringCounts[label] = count;
      }
    }
    
    setExampleCounts(stringCounts);
  }, [predictedPose]); // Update when prediction changes

  return {
    predictedPose,
    trainPose,
    predictPose,
    isLoading: isLoading || poseLoading,
    error: error || poseError,
    exampleCounts,
    clearLabel,
    clearAllLabels,
  };
}

