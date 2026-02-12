
let audioContext: AudioContext | null = null;
let initialized = false;

/**
 * Initialize the AudioContext on user interaction
 * This is needed because browsers require user interaction to create an AudioContext
 */
export const initAudioContext = () => {
  // Only initialize once
  if (initialized) return;
  
  try {
    // Create new context with more browser-compatible approach
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
      initialized = true;
      
      // Resume the context if it's in suspended state
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => {
          console.error("[AudioContext] Failed to resume:", err);
        });
      }
    } else {
      console.warn("[AudioContext] Web Audio API not supported in this browser");
    }
  } catch (error) {
    console.error("[AudioContext] Failed to initialize:", error);
  }
};

/**
 * Get the audio context (initializing if necessary)
 */
export const getAudioContext = (): AudioContext | null => {
  if (!initialized) {
    initAudioContext();
  }
  return audioContext;
};

/**
 * Play a sound with the given frequency and duration
 * Fallback for when MP3 files aren't available
 */
export const playSound = (frequency = 440, duration = 0.3, type = 'sine'): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    // Create oscillator for sound generation
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type as OscillatorType;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Create fade in/out
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start();
    oscillator.stop(now + duration);
  } catch (error) {
    console.error("[AudioContext] Failed to play sound:", error);
  }
};
