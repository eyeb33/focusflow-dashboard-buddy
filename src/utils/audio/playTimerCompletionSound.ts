
/**
 * Play a completion sound for a given mode using cached MP3s.
 */

const modeToMp3: Record<'work' | 'break' | 'longBreak', string> = {
  work: '/sounds/01_zen_chime.mp3',
  break: '/sounds/02_zen_chime.mp3',
  longBreak: '/sounds/03_gong.mp3',
};

// Optionally cache HTMLAudioElements for instant playback
const audioCache: Partial<Record<'work' | 'break' | 'longBreak', HTMLAudioElement>> = {};

export const playTimerCompletionSound = async (
  mode: 'work' | 'break' | 'longBreak'
): Promise<void> => {
  const src = modeToMp3[mode];
  if (!src) return;
  try {
    let audio = audioCache[mode];
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      audioCache[mode] = audio;
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    await audio.play();
  } catch (error) {
    console.error(`[audioUtils] Failed to play sound for mode "${mode}":`, error);
    // The oscillator fallback code is omitted for simplicity. Re-add if needed.
  }
};
