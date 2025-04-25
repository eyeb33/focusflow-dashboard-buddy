
import { getAudioContext, playSound } from './initAudioContext';

/**
 * Play a completion sound for a given mode using cached MP3s.
 * Falls back to oscillator if MP3 files can't be played.
 */

const modeToMp3: Record<'work' | 'break' | 'longBreak', string> = {
  work: '/sounds/01_zen_chime.mp3',
  break: '/sounds/02_zen_chime.mp3',
  longBreak: '/sounds/03_gong.mp3',
};

const modeToFrequency: Record<'work' | 'break' | 'longBreak', number> = {
  work: 440,  // A4 note
  break: 523, // C5 note
  longBreak: 329, // E4 note
};

// Cache HTMLAudioElements for instant playback
const audioCache: Partial<Record<'work' | 'break' | 'longBreak', HTMLAudioElement>> = {};

// Ensure audio context is initialized
document.addEventListener('click', () => {
  // Initialize audio context on user interaction
  getAudioContext();
}, { once: true });

export const playTimerCompletionSound = async (
  mode: 'work' | 'break' | 'longBreak'
): Promise<void> => {
  const src = modeToMp3[mode];
  if (!src) return;
  
  try {
    // First attempt: Use the HTMLAudioElement API
    let audio = audioCache[mode];
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      audioCache[mode] = audio;
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    
    console.log(`[AudioUtils] Attempting to play sound for ${mode} mode`);
    
    // Try to play using HTMLAudioElement first
    try {
      const playPromise = audio.play();
      
      // Handle promise rejection (browser policies may block autoplay)
      await playPromise;
      console.log(`[AudioUtils] Successfully played MP3 sound for ${mode} mode`);
    } catch (error) {
      console.warn(`[AudioUtils] Failed to play MP3 sound: ${error.message}. Falling back to oscillator.`);
      
      // Second attempt: Use AudioContext oscillator as fallback
      const frequency = modeToFrequency[mode];
      const duration = mode === 'longBreak' ? 1.0 : 0.7;
      playSound(frequency, duration);
      
      // Store a flag in localStorage to remember that we need to use oscillator next time
      localStorage.setItem('useOscillatorFallback', 'true');
    }
  } catch (error) {
    console.error(`[AudioUtils] Failed to play sound for mode "${mode}":`, error);
    
    // Final fallback - use oscillator with default parameters
    playSound(modeToFrequency[mode] || 440, 0.5);
  }
};
