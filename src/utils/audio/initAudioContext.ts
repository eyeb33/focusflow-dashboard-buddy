
/**
 * Initialize and preload necessary audio assets for the timer.
 */

let zenBellAudio: HTMLAudioElement | null = null;

export const initAudioContext = (): void => {
  if (!zenBellAudio) {
    zenBellAudio = new Audio('/sounds/zen-bell.mp3');
    zenBellAudio.preload = 'auto';
  }
};

