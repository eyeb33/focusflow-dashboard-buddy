
import { useEffect } from 'react';
import { initAudioContext } from '@/utils/audioUtils';

export function useTimerAudio() {
  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudioOnInteraction = () => {
      initAudioContext();
      // Remove event listeners after initialization
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };

    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);

    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  }, []);
}
