
import { writeString } from './writeString';

export function bufferToWave(
  abuffer: AudioBuffer,
  offset = 0,
  len?: number
): Uint8Array {
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

  writeString(view, 0, 'RIFF');
  view.setUint32(4, fileLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const dataOffset = headerLength;
  const channels: Float32Array[] = [];
  let sample: number, pos = dataOffset;

  for (let i = 0; i < numOfChan; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      sample = Math.max(-1, Math.min(channels[channel][i + offset], 1));
      sample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
      view.setInt16(pos, sample, true);
      pos += bytesPerSample;
    }
  }

  return new Uint8Array(buffer);
}
