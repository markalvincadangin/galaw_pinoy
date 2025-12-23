'use client';

import { useState } from 'react';
import { useGameSound } from '@/hooks/useGameSound';
import KineticButton from '@/components/ui/KineticButton';

/**
 * Debug component to test sound effects
 * This can be temporarily added to a page to verify sounds are working
 */
export default function SoundTest() {
  const { playJump, playScore, playGameOver, toggleMusic, isMuted, isMusicPlaying, setMuted } = useGameSound();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const testSound = async (soundName: string, playFn: () => void) => {
    try {
      playFn();
      setTestResults(prev => ({ ...prev, [soundName]: true }));
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [soundName]: false }));
      }, 1000);
    } catch (error) {
      console.error(`Error playing ${soundName}:`, error);
      setTestResults(prev => ({ ...prev, [soundName]: false }));
    }
  };

  return (
    <div className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-display font-bold text-white mb-6 drop-shadow-lg">
        Sound Effects Test
      </h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <KineticButton
            variant="primary"
            size="md"
            onClick={() => testSound('jump', playJump)}
          >
            Test Jump Sound
          </KineticButton>
          {testResults.jump && (
            <span className="text-green-400 font-body">✓ Played</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <KineticButton
            variant="primary"
            size="md"
            onClick={() => testSound('score', playScore)}
          >
            Test Score Sound
          </KineticButton>
          {testResults.score && (
            <span className="text-green-400 font-body">✓ Played</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <KineticButton
            variant="danger"
            size="md"
            onClick={() => testSound('gameover', playGameOver)}
          >
            Test Game Over Sound
          </KineticButton>
          {testResults.gameover && (
            <span className="text-green-400 font-body">✓ Played</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <KineticButton
            variant="ghost"
            size="md"
            onClick={toggleMusic}
          >
            {isMusicPlaying ? 'Stop' : 'Play'} Background Music
          </KineticButton>
          {isMusicPlaying && (
            <span className="text-green-400 font-body">✓ Playing</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <KineticButton
            variant="ghost"
            size="md"
            onClick={() => setMuted(!isMuted)}
          >
            {isMuted ? 'Unmute' : 'Mute'} All Sounds
          </KineticButton>
          {isMuted && (
            <span className="text-yellow-400 font-body">🔇 Muted</span>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-sm text-white/80 font-body">
          <strong className="text-white">Note:</strong> Browsers may block audio until user interaction. 
          Click any button above to enable sound playback.
        </p>
        <p className="text-sm text-white/80 font-body mt-2">
          <strong className="text-white">Sound Files:</strong> Check browser console for any loading errors.
        </p>
      </div>
    </div>
  );
}

