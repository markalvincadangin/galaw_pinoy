'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import useSound from 'use-sound';

interface UseGameSoundReturn {
  playJump: () => void;
  playScore: () => void;
  playGameOver: () => void;
  toggleMusic: () => void;
  isMuted: boolean;
  isMusicPlaying: boolean;
  setMuted: (muted: boolean) => void;
}

/**
 * Reusable hook for game sound effects and background music
 * 
 * Sound files should be placed in `/public/sounds/`:
 * - jump.mp3 (or .ogg)
 * - score.mp3 (or .ogg)
 * - gameover.mp3 (or .ogg)
 * - background-music.mp3 (or .ogg)
 */
export function useGameSound(): UseGameSoundReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const isMutedRef = useRef(isMuted);

  // Update ref when mute state changes for use in callbacks
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Sound effect options
  const soundOptions = {
    volume: 1,
    interrupt: true, // Stop previous instance if playing
  };

  // Background music options
  const musicOptions = {
    volume: 0.5, // Lower volume for background music
    loop: true,
    interrupt: false,
  };

  // Load sound effects (volume checked before playing, not in options)
  // Preload jump.mp3 for instant playback on velocity triggers
  // use-sound returns [playFunction, { sound, stop, pause }]
  const [playJumpSound, { sound: jumpSound }] = useSound('/sounds/jump.mp3', { ...soundOptions, preload: true });
  const [playScoreSound, { sound: scoreSound }] = useSound('/sounds/score.mp3', soundOptions);
  const [playGameOverSound, { sound: gameOverSound }] = useSound('/sounds/gameover.mp3', soundOptions);

  // Load background music with play/pause controls
  const [playMusic, { stop: stopMusic, sound: musicSound }] = useSound(
    '/sounds/background-music.mp3',
    musicOptions
  );

  // Log sound loading status (Howl instances have state property: 'unloaded', 'loading', 'loaded')
  useEffect(() => {
    // Type-safe sound state checking
    type HowlSound = { state?: () => string };
    if (jumpSound) {
      const state = (jumpSound as unknown as HowlSound).state?.() || 'unknown';
      console.log('[Sound] Jump sound status:', state);
    }
    if (scoreSound) {
      const state = (scoreSound as unknown as HowlSound).state?.() || 'unknown';
      console.log('[Sound] Score sound status:', state);
    }
    if (gameOverSound) {
      const state = (gameOverSound as unknown as HowlSound).state?.() || 'unknown';
      console.log('[Sound] Game over sound status:', state);
    }
    if (musicSound) {
      const state = (musicSound as unknown as HowlSound).state?.() || 'unknown';
      console.log('[Sound] Background music status:', state);
    }
  }, [jumpSound, scoreSound, gameOverSound, musicSound]);

  // Stop music when muted
  useEffect(() => {
    if (isMuted && isMusicPlaying) {
      stopMusic();
      setTimeout(() => {
        setIsMusicPlaying(false);
      }, 0);
    }
  }, [isMuted, isMusicPlaying, stopMusic]);

  // Wrapper functions that respect mute state
  const playJump = useCallback(() => {
    if (!isMutedRef.current) {
      try {
        playJumpSound();
        console.log('Playing jump sound');
      } catch (error) {
        console.error('Error playing jump sound:', error);
      }
    }
  }, [playJumpSound]);

  const playScore = useCallback(() => {
    if (!isMutedRef.current) {
      try {
        playScoreSound();
        console.log('Playing score sound');
      } catch (error) {
        console.error('Error playing score sound:', error);
      }
    }
  }, [playScoreSound]);

  const playGameOver = useCallback(() => {
    if (!isMutedRef.current) {
      try {
        playGameOverSound();
        console.log('Playing game over sound');
      } catch (error) {
        console.error('Error playing game over sound:', error);
      }
    }
  }, [playGameOverSound]);

  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      stopMusic();
      setIsMusicPlaying(false);
    } else {
      if (!isMutedRef.current) {
        playMusic();
        setIsMusicPlaying(true);
      }
    }
  }, [isMusicPlaying, playMusic, stopMusic]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  return {
    playJump,
    playScore,
    playGameOver,
    toggleMusic,
    isMuted,
    isMusicPlaying,
    setMuted,
  };
}

