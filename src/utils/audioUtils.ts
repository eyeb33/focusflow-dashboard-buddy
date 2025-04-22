
/**
 * Audio utilities for the timer application
 */

// File paths for custom MP3 chimes mapped to timer modes
const modeToMp3: Record<'work' | 'break' | 'longBreak', string> = {
  work: '/sounds/01_zen_chime.mp3',
  break: '/sounds/02_zen_chime.mp3',
  longBreak: '/sounds/03_gong.mp3',
};

// Optionally cache HTMLAudioElements for instant playback
const audioCache: Partial<Record<'work' | 'break' | 'longBreak', HTMLAudioElement>> = {};

// Cache for preloaded general bell audio
let zenBellAudio: HTMLAudioElement | null = null;

/**
 * Initialize audio elements and preload sounds
 */
export const initAudioContext = (): void => {
  if (!zenBellAudio) {
    zenBellAudio = new Audio('/sounds/zen-bell.mp3');
    zenBellAudio.preload = 'auto';
  }
};

/**
 * Play a completion sound based on the timer mode using an MP3 file.
 */
export const playTimerCompletionSound = async (mode: 'work' | 'break' | 'longBreak'): Promise<void> => {
  const src = modeToMp3[mode];
  if (!src) return;

  try {
    let audio = audioCache[mode];
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      audioCache[mode] = audio;
    } else {
      // If audio element has been used before, reset it
      audio.pause();
      audio.currentTime = 0;
    }
    await audio.play();
  } catch (error) {
    console.error(`[audioUtils] Failed to play sound for mode "${mode}":`, error);

    // If there's an error, fall back to synthesized chime as before
    // (Restore the oscillator-based code as a fallback if desired)
    /*
    const audioContext = new AudioContext();
    const frequencies = {
      work: 440,
      break: 554.37,
      longBreak: 659.25
    };
    const frequency = frequencies[mode];
    const bellOscillator = audioContext.createOscillator();
    bellOscillator.type = 'sine';
    bellOscillator.frequency.value = frequency;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    bellOscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    const now = audioContext.currentTime;
    bellOscillator.start(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.6, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 1.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3);
    bellOscillator.stop(now + 3.1);
    */
  }
};

// Create and download the bell sound
export const downloadBellSound = () => {
  const audioContext = new AudioContext();
  const mainGainNode = audioContext.createGain();
  mainGainNode.connect(audioContext.destination);
  mainGainNode.gain.value = 0.8;

  // Create the offline context for rendering
  const offlineCtx = new OfflineAudioContext(2, 44100 * 4, 44100);
  
  // Create oscillators for the bell sound
  const createBell = (ctx: AudioContext | OfflineAudioContext, destination: AudioNode) => {
    // Primary tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 440; // A4
    
    // Gain for envelope
    const gainNode1 = ctx.createGain();
    gainNode1.gain.value = 0;
    
    // Connect oscillator to gain and gain to destination
    osc1.connect(gainNode1);
    gainNode1.connect(destination);
    
    // Start the oscillator
    const now = ctx.currentTime;
    osc1.start(now);
    
    // Create a bell-like envelope
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 3);
    
    // Stop the oscillator after the sound is done
    osc1.stop(now + 3.1);
    
    // Higher harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 880; // One octave higher
    
    const gainNode2 = ctx.createGain();
    gainNode2.gain.value = 0;
    
    osc2.connect(gainNode2);
    gainNode2.connect(destination);
    
    osc2.start(now);
    
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
    
    osc2.stop(now + 3.1);
    
    // Even higher harmonic for brilliance
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 1320; // Perfect fifth above the second harmonic
    
    const gainNode3 = ctx.createGain();
    gainNode3.gain.value = 0;
    
    osc3.connect(gainNode3);
    gainNode3.connect(destination);
    
    osc3.start(now);
    
    gainNode3.gain.setValueAtTime(0, now);
    gainNode3.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gainNode3.gain.exponentialRampToValueAtTime(0.01, now + 2);
    
    osc3.stop(now + 3.1);
    
    return 3.1; // Duration of the sound
  };

  // Create the bell sound in the offline context
  const duration = createBell(offlineCtx, offlineCtx.destination);
  
  // Render the audio
  offlineCtx.startRendering().then((renderedBuffer) => {
    // Convert the rendered buffer to a WAV file
    const audioData = bufferToWave(renderedBuffer, 0, renderedBuffer.length);
    
    // Create a blob from the WAV data
    const blob = new Blob([audioData], { type: 'audio/wav' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element to download the file
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zen-bell.wav';
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  }).catch((err) => {
    console.error('Rendering failed: ' + err);
  });
};

// Convert an AudioBuffer to a WAV file
function bufferToWave(abuffer: AudioBuffer, offset = 0, len?: number): Uint8Array {
  const numOfChan = abuffer.numberOfChannels;
  const length = len || abuffer.length;
  const sampleRate = abuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numOfChan * bytesPerSample;
  
  const headerLength = 44;
  const dataLength = length * numOfChan * bytesPerSample;
  const fileLength = headerLength + dataLength;
  
  const buffer = new ArrayBuffer(fileLength);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, fileLength - 8, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numOfChan, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);
  
  // Write the PCM samples
  const dataOffset = headerLength;
  const channels = [];
  let i, sample, pos = dataOffset;
  
  // Extract channels
  for (i = 0; i < numOfChan; i++) {
    channels.push(abuffer.getChannelData(i));
  }
  
  // Interleave channels
  for (i = 0; i < length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      // Clamp the sample to the [-1, 1] range
      sample = Math.max(-1, Math.min(channels[channel][i + offset], 1));
      // Convert to 16-bit sample
      sample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
      // Write sample
      view.setInt16(pos, sample, true);
      pos += bytesPerSample;
    }
  }
  
  return new Uint8Array(buffer);
}

// Write a string to a DataView
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
