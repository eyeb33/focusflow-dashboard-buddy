
import { useEffect, useCallback } from 'react';
import { initAudioContext } from '@/utils/audioUtils';

export function useTimerAudio() {
  const playStartChime = useCallback(() => {
    try {
      const audio = new Audio('/sounds/01_zen_chime.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.warn('Could not play start chime:', err));
    } catch (error) {
      console.warn('Error playing start chime:', error);
    }
  }, []);
  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudioOnInteraction = () => {
      initAudioContext();
      // Remove event listeners after initialization
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
      
      // Try playing a silent sound to unblock audio
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.frequency.value = 1;
        const gainNode = context.createGain();
        gainNode.gain.value = 0.01; // Very quiet
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(0);
        oscillator.stop(0.1);
        console.log('Audio initialized successfully on user interaction');
      } catch (e) {
        console.warn('Could not initialize audio context:', e);
      }
    };

    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);

    // Pre-load sound files
    const preloadAudioFiles = () => {
      const sounds = [
        '/sounds/01_zen_chime.mp3', 
        '/sounds/02_zen_chime.mp3', 
        '/sounds/03_gong.mp3'
      ];
      
      sounds.forEach(src => {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        console.log(`Preloading audio file: ${src}`);
      });
    };
    
    // Try to preload audio files
    preloadAudioFiles();

    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  }, []);

  return { playStartChime };
}
