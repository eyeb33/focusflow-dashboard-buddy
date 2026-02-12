
import { bufferToWave } from './bufferToWave';
import { writeString } from './writeString';

/**
 * Allows user to synthesize and download a zen bell WAV file.
 */
export const downloadBellSound = () => {
  const audioContext = new AudioContext();
  const mainGainNode = audioContext.createGain();
  mainGainNode.connect(audioContext.destination);
  mainGainNode.gain.value = 0.8;

  // Create the offline context for rendering
  const offlineCtx = new OfflineAudioContext(2, 44100 * 4, 44100);

  const createBell = (ctx: AudioContext | OfflineAudioContext, destination: AudioNode) => {
    // Primary tone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 440; // A4
    
    const gainNode1 = ctx.createGain();
    gainNode1.gain.value = 0;
    osc1.connect(gainNode1);
    gainNode1.connect(destination);
    const now = ctx.currentTime;
    osc1.start(now);
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 3);
    osc1.stop(now + 3.1);

    // Higher harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 880;
    const gainNode2 = ctx.createGain();
    gainNode2.gain.value = 0;
    osc2.connect(gainNode2);
    gainNode2.connect(destination);
    osc2.start(now);
    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
    osc2.stop(now + 3.1);

    // Even higher harmonic
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 1320;
    const gainNode3 = ctx.createGain();
    gainNode3.gain.value = 0;
    osc3.connect(gainNode3);
    gainNode3.connect(destination);
    osc3.start(now);
    gainNode3.gain.setValueAtTime(0, now);
    gainNode3.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gainNode3.gain.exponentialRampToValueAtTime(0.01, now + 2);
    osc3.stop(now + 3.1);

    return 3.1;
  };

  // Synthesize bell sound
  const duration = createBell(offlineCtx, offlineCtx.destination);

  offlineCtx.startRendering().then((renderedBuffer) => {
    const audioData = bufferToWave(renderedBuffer, 0, renderedBuffer.length);

    // Create a Blob for the browser to download
    const blob = new Blob([audioData.buffer as ArrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zen-bell.wav';
    link.click();
    URL.revokeObjectURL(url);
  }).catch((err) => {
    console.error('Rendering failed: ' + err);
  });
};
