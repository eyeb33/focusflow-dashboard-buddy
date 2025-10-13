import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type RecordingState = 'idle' | 'recording' | 'processing';

export function useVoiceRecording() {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setState('recording');
      setDuration(0);

      // Start duration counter
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = async () => {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        setState('processing');
        
        try {
          // Create blob from chunks
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            console.log('Sending audio for transcription...');
            
            // Send to transcription service
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (error) throw error;
            if (!data?.text) throw new Error('No transcription returned');

            console.log('Transcription received:', data.text);
            setState('idle');
            setDuration(0);
            resolve(data.text);
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read audio data'));
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Transcription error:', error);
          setState('idle');
          setDuration(0);
          toast({
            title: "Transcription Error",
            description: "Could not transcribe audio. Please try again.",
            variant: "destructive",
          });
          reject(error);
        } finally {
          // Cleanup
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          chunksRef.current = [];
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    state,
    duration,
    startRecording,
    stopRecording,
  };
}
