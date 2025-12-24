/**
 * Physics-based pose analysis utilities
 * Provides velocity tracking, jump detection, squat detection, and cheating prevention
 * Enhanced with EMA smoothing, angle calculations, and relative height scaling
 */

import type { PoseLandmarks } from '@/hooks/usePoseDetection';

/**
 * EMA (Exponential Moving Average) filter for smoothing noisy keypoints
 */
export class EMAFilter {
  private alpha: number; // Smoothing factor (0-1), higher = more responsive
  private smoothed: { [key: string]: number } = {};

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  /**
   * Apply EMA filter to a value
   */
  public filter(key: string, value: number): number {
    if (this.smoothed[key] === undefined) {
      this.smoothed[key] = value;
      return value;
    }
    
    // EMA formula: new = alpha * current + (1 - alpha) * previous
    this.smoothed[key] = this.alpha * value + (1 - this.alpha) * this.smoothed[key];
    return this.smoothed[key];
  }

  /**
   * Reset filter state
   */
  public reset(): void {
    this.smoothed = {};
  }
}

/**
 * Pose state types
 */
export type PoseState = 'neutral' | 'jump_start' | 'apex' | 'landing' | 'squat';

/**
 * Velocity tracker state
 */
interface VelocityTracker {
  previousY: number | null;
  previousTime: number | null;
  currentVelocity: number;
}

/**
 * Pose physics analysis result
 */
export interface PosePhysicsResult {
  state: PoseState;
  hipVelocity: number; // Vertical velocity of hips (pixels/frame or normalized/frame)
  hipAnkleDistance: number; // Current distance between hips and ankles
  standingHipAnkleDistance: number | null; // Baseline distance when standing
  ankleVerticalMovement: number; // How much ankles have moved up (for cheating detection)
  confidence: number; // Confidence score (0-1)
}

/**
 * Physics analyzer class
 * Tracks pose state using velocity and distance calculations
 */
export class PosePhysicsAnalyzer {
  private hipVelocityTracker: VelocityTracker = {
    previousY: null,
    previousTime: null,
    currentVelocity: 0,
  };
  
  private ankleVelocityTracker: VelocityTracker = {
    previousY: null,
    previousTime: null,
    currentVelocity: 0,
  };
  
  private standingHipAnkleDistance: number | null = null;
  private ankleBaselineY: number | null = null;
  private anklePeakY: number | null = null; // Highest ankle position during jump
  
  // Thresholds (tuned for better sensitivity)
  // Velocity is calculated in normalized units per millisecond, but threshold is in normalized/second
  // Original: -0.01 normalized/ms = -10 normalized/second. New: -5.0 normalized/second (more sensitive)
  // We convert velocity to normalized/second by multiplying by 1000 for comparison
  private readonly JUMP_START_VELOCITY_THRESHOLD = -5.0; // Negative = moving up (normalized/second) - tuned for better jump detection
  private readonly APEX_VELOCITY_THRESHOLD = 0.001; // Near zero
  private readonly LANDING_VELOCITY_THRESHOLD = 0.01; // Positive = moving down
  private readonly SQUAT_DISTANCE_THRESHOLD = 0.2; // 20% decrease from standing
  private readonly ANKLE_MOVEMENT_THRESHOLD = 0.05; // Ankles must move up at least 5% for valid jump

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    p1: { x: number; y: number; z?: number },
    p2: { x: number; y: number; z?: number }
  ): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = (p2.z ?? 0) - (p1.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate average Y position of hips
   */
  private getAverageHipY(landmarks: PoseLandmarks): number | null {
    if (!landmarks.leftHip || !landmarks.rightHip) {
      return null;
    }
    return (landmarks.leftHip.y + landmarks.rightHip.y) / 2;
  }

  /**
   * Calculate average Y position of ankles
   */
  private getAverageAnkleY(landmarks: PoseLandmarks): number | null {
    if (!landmarks.leftAnkle || !landmarks.rightAnkle) {
      return null;
    }
    return (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2;
  }

  /**
   * Calculate distance between hips and ankles
   */
  private getHipAnkleDistance(landmarks: PoseLandmarks): number | null {
    if (!landmarks.leftHip || !landmarks.rightHip || 
        !landmarks.leftAnkle || !landmarks.rightAnkle) {
      return null;
    }

    // Use average positions
    const avgHip = {
      x: (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
      y: (landmarks.leftHip.y + landmarks.rightHip.y) / 2,
      z: ((landmarks.leftHip.z ?? 0) + (landmarks.rightHip.z ?? 0)) / 2,
    };

    const avgAnkle = {
      x: (landmarks.leftAnkle.x + landmarks.rightAnkle.x) / 2,
      y: (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2,
      z: ((landmarks.leftAnkle.z ?? 0) + (landmarks.rightAnkle.z ?? 0)) / 2,
    };

    return this.calculateDistance(avgHip, avgAnkle);
  }

  /**
   * Update velocity tracker
   */
  private updateVelocity(
    tracker: VelocityTracker,
    currentY: number,
    currentTime: number
  ): number {
    if (tracker.previousY === null || tracker.previousTime === null) {
      tracker.previousY = currentY;
      tracker.previousTime = currentTime;
      return 0;
    }

    const deltaY = currentY - tracker.previousY;
    const deltaTime = currentTime - tracker.previousTime;
    
    // Prevent division by zero
    const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
    
    tracker.previousY = currentY;
    tracker.previousTime = currentTime;
    tracker.currentVelocity = velocity;
    
    return velocity;
  }

  /**
   * Establish baseline (standing position)
   * Call this when user is in neutral/standing pose
   */
  public establishBaseline(landmarks: PoseLandmarks): void {
    const distance = this.getHipAnkleDistance(landmarks);
    const ankleY = this.getAverageAnkleY(landmarks);
    
    if (distance !== null) {
      this.standingHipAnkleDistance = distance;
    }
    
    if (ankleY !== null) {
      this.ankleBaselineY = ankleY;
      this.anklePeakY = ankleY; // Reset peak
    }
  }

  /**
   * Analyze pose and return physics-based state
   */
  public analyze(landmarks: PoseLandmarks): PosePhysicsResult | null {
    const hipY = this.getAverageHipY(landmarks);
    const ankleY = this.getAverageAnkleY(landmarks);
    const hipAnkleDistance = this.getHipAnkleDistance(landmarks);

    if (hipY === null || ankleY === null || hipAnkleDistance === null) {
      return null;
    }

    const currentTime = Date.now();
    
    // Update hip velocity
    const hipVelocity = this.updateVelocity(
      this.hipVelocityTracker,
      hipY,
      currentTime
    );

    // Update ankle velocity and track peak (velocity is stored in tracker, not used directly here)
    this.updateVelocity(
      this.ankleVelocityTracker,
      ankleY,
      currentTime
    );

    // Track ankle peak (lowest Y = highest position)
    if (ankleY < (this.anklePeakY ?? ankleY)) {
      this.anklePeakY = ankleY;
    }

    // Calculate ankle vertical movement (how much they've moved up)
    const ankleVerticalMovement = this.ankleBaselineY !== null && this.anklePeakY !== null
      ? this.ankleBaselineY - this.anklePeakY // Positive = moved up
      : 0;

    // Determine pose state
    let state: PoseState = 'neutral';
    let confidence = 0.5;

    // 1. Check for squat (compare hip-ankle distance to standing baseline)
    if (this.standingHipAnkleDistance !== null) {
      const distanceRatio = hipAnkleDistance / this.standingHipAnkleDistance;
      const distanceDecrease = 1 - distanceRatio;
      
      if (distanceDecrease >= this.SQUAT_DISTANCE_THRESHOLD) {
        state = 'squat';
        confidence = Math.min(1.0, distanceDecrease / this.SQUAT_DISTANCE_THRESHOLD);
      }
    }

    // 2. Check for jump states (only if not squatting)
    if (state !== 'squat') {
      // Cheating prevention: ankles must move up for jump to count
      const anklesMovedUp = ankleVerticalMovement >= this.ANKLE_MOVEMENT_THRESHOLD;
      
      if (anklesMovedUp) {
        // Convert velocity from normalized/ms to normalized/second for comparison
        // Velocity is calculated as deltaY / deltaTime (in ms), so multiply by 1000 to get per-second
        const hipVelocityPerSecond = hipVelocity * 1000;
        
        // Note: JUMP_START_VELOCITY_THRESHOLD is now -5.0 normalized/second (more sensitive)
        if (hipVelocityPerSecond < this.JUMP_START_VELOCITY_THRESHOLD) {
          // Moving up fast = jump start
          state = 'jump_start';
          // Normalize confidence based on velocity magnitude (scaled for new threshold)
          confidence = Math.min(1.0, Math.abs(hipVelocityPerSecond) / Math.abs(this.JUMP_START_VELOCITY_THRESHOLD));
        } else if (Math.abs(hipVelocity) < this.APEX_VELOCITY_THRESHOLD) {
          // Near zero velocity after going up = apex
          state = 'apex';
          confidence = 0.9;
        } else if (hipVelocity > this.LANDING_VELOCITY_THRESHOLD) {
          // Moving down fast = landing
          state = 'landing';
          confidence = Math.min(1.0, hipVelocity / 0.02); // Normalize to 0-1
        }
      } else {
        // Ankles didn't move up - ignore jump detection (cheating prevention)
        // Keep as neutral or current state
        if (state === 'neutral') {
          confidence = 0.3; // Low confidence for invalid jump
        }
      }
    }

    return {
      state,
      hipVelocity,
      hipAnkleDistance,
      standingHipAnkleDistance: this.standingHipAnkleDistance,
      ankleVerticalMovement,
      confidence,
    };
  }

  /**
   * Reset all trackers (useful when starting a new game or pose sequence)
   */
  public reset(): void {
    this.hipVelocityTracker = {
      previousY: null,
      previousTime: null,
      currentVelocity: 0,
    };
    
    this.ankleVelocityTracker = {
      previousY: null,
      previousTime: null,
      currentVelocity: 0,
    };
    
    this.standingHipAnkleDistance = null;
    this.ankleBaselineY = null;
    this.anklePeakY = null;
  }

  /**
   * Get current velocity values (for debugging)
   */
  public getVelocities(): { hipVelocity: number; ankleVelocity: number } {
    return {
      hipVelocity: this.hipVelocityTracker.currentVelocity,
      ankleVelocity: this.ankleVelocityTracker.currentVelocity,
    };
  }
}

/**
 * Calculate angle between three points (in degrees)
 * @param p1 - First point (e.g., hip)
 * @param p2 - Middle point (vertex, e.g., knee)
 * @param p3 - Third point (e.g., ankle)
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  // Vector from p2 to p1
  const v1x = p1.x - p2.x;
  const v1y = p1.y - p2.y;
  
  // Vector from p2 to p3
  const v2x = p3.x - p2.x;
  const v2y = p3.y - p2.y;
  
  // Dot product
  const dot = v1x * v2x + v1y * v2y;
  
  // Magnitudes
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
  
  // Avoid division by zero
  if (mag1 === 0 || mag2 === 0) {
    return 180;
  }
  
  // Calculate angle using arccos
  const cosAngle = dot / (mag1 * mag2);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle)); // Clamp to [-1, 1]
  const angleRad = Math.acos(clampedCos);
  
  // Convert to degrees
  return (angleRad * 180) / Math.PI;
}

/**
 * Check if user is squatting based on knee angle
 * @param landmarks - Pose landmarks
 * @returns true if squatting (knee angle < 150 degrees - easier mode)
 */
export function isSquatting(landmarks: PoseLandmarks): boolean {
  if (!landmarks.leftHip || !landmarks.leftKnee || !landmarks.leftAnkle) {
    return false;
  }
  
  const SQUAT_ANGLE_THRESHOLD = 150; // Easier mode - increased from 140 to 150 degrees
  
  const leftAngle = calculateAngle(
    { x: landmarks.leftHip.x, y: landmarks.leftHip.y },
    { x: landmarks.leftKnee.x, y: landmarks.leftKnee.y },
    { x: landmarks.leftAnkle.x, y: landmarks.leftAnkle.y }
  );
  
  // Also check right leg if available
  if (landmarks.rightHip && landmarks.rightKnee && landmarks.rightAnkle) {
    const rightAngle = calculateAngle(
      { x: landmarks.rightHip.x, y: landmarks.rightHip.y },
      { x: landmarks.rightKnee.x, y: landmarks.rightKnee.y },
      { x: landmarks.rightAnkle.x, y: landmarks.rightAnkle.y }
    );
    
    // Both legs must be bent (easier threshold)
    return leftAngle < SQUAT_ANGLE_THRESHOLD && rightAngle < SQUAT_ANGLE_THRESHOLD;
  }
  
  return leftAngle < SQUAT_ANGLE_THRESHOLD;
}

/**
 * Rolling average height tracker
 * Prevents sudden height spikes when user steps forward/backward
 */
class HeightTracker {
  private heightHistory: number[] = [];
  private readonly maxHistorySize = 30;

  /**
   * Add a new height measurement and return the rolling average
   */
  public addHeight(height: number): number {
    this.heightHistory.push(height);
    
    // Keep only the last 30 measurements
    if (this.heightHistory.length > this.maxHistorySize) {
      this.heightHistory.shift();
    }
    
    // Return the average
    const sum = this.heightHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.heightHistory.length;
  }

  /**
   * Reset the height history
   */
  public reset(): void {
    this.heightHistory = [];
  }

  /**
   * Get current average height
   */
  public getAverage(): number | null {
    if (this.heightHistory.length === 0) {
      return null;
    }
    const sum = this.heightHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.heightHistory.length;
  }
}

// Global height tracker instance
const heightTracker = new HeightTracker();

/**
 * Calculate user height (nose to ankle) for relative scaling
 * Uses rolling average to prevent sudden spikes when user moves closer/farther from camera
 * @param landmarks - Pose landmarks
 * @param resetHistory - If true, reset the height history (useful when starting a new game)
 * @returns Height in normalized coordinates (0-1 scale) - averaged over last 30 frames
 */
export function getUserHeight(landmarks: PoseLandmarks, resetHistory: boolean = false): number | null {
  if (!landmarks.nose || !landmarks.leftAnkle || !landmarks.rightAnkle) {
    return null;
  }

  // Reset history if requested (e.g., when starting a new game)
  if (resetHistory) {
    heightTracker.reset();
  }
  
  const ankleMidpoint = {
    x: (landmarks.leftAnkle.x + landmarks.rightAnkle.x) / 2,
    y: (landmarks.leftAnkle.y + landmarks.rightAnkle.y) / 2,
    z: ((landmarks.leftAnkle.z ?? 0) + (landmarks.rightAnkle.z ?? 0)) / 2,
  };
  
  const dx = ankleMidpoint.x - landmarks.nose.x;
  const dy = ankleMidpoint.y - landmarks.nose.y;
  const dz = ankleMidpoint.z - (landmarks.nose.z ?? 0);
  
  const rawHeight = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Return rolling average instead of raw value
  return heightTracker.addHeight(rawHeight);
}

/**
 * Reset height tracking history
 * Call this when starting a new game or calibration
 */
export function resetHeightTracking(): void {
  heightTracker.reset();
}

/**
 * Calculate velocity between two positions
 * @param prevY - Previous Y position
 * @param currY - Current Y position
 * @param deltaTime - Time difference in milliseconds
 * @returns Velocity (normalized/frame or pixels/frame)
 */
export function getVelocity(prevY: number, currY: number, deltaTime: number): number {
  if (deltaTime <= 0) return 0;
  return (currY - prevY) / deltaTime;
}

/**
 * Check landing stability (X-position shift)
 * @param prevX - Previous X position
 * @param currX - Current X position
 * @param threshold - Threshold in normalized coordinates (default 0.03 = 3%, equivalent to ~30px on 1000px screen)
 * @returns true if landing is stable (shift < threshold)
 */
export function isStableLanding(prevX: number, currX: number, threshold: number = 0.03): boolean {
  // Increased threshold from 0.02 (2%) to 0.03 (3%) for easier landing detection
  // This is approximately 30px on a 1000px screen, making "Perfect Landing" more achievable
  return Math.abs(currX - prevX) < threshold;
}

/**
 * Create a new pose physics analyzer instance
 */
export function createPosePhysicsAnalyzer(): PosePhysicsAnalyzer {
  return new PosePhysicsAnalyzer();
}

