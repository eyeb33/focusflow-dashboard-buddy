import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useVoicePlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('coachVoiceEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem('coachVoice') || 'alloy';
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);

  const playText = useCallback(async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;

    try {
      console.log('Generating speech for:', text.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('synthesize-speech', {
        body: { text, voice: selectedVoice }
      });

      if (error) throw error;
      if (!data?.audioContent) throw new Error('No audio returned');

      // Add to queue
      queueRef.current.push(data.audioContent);
      
      // Start playing if not already playing
      if (!isPlaying) {
        await playNext();
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      toast({
        title: "Voice Error",
        description: "Could not generate speech. Continuing with text only.",
        variant: "destructive",
      });
    }
  }, [voiceEnabled, selectedVoice, isPlaying]);

  const playNext = useCallback(async () => {
    if (queueRef.current.length === 0) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const base64Audio = queueRef.current.shift()!;

    try {
      // Create audio element
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;

      // Play next when done
      audio.onended = () => {
        playNext();
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        playNext(); // Continue with next
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      playNext(); // Continue with next
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    queueRef.current = [];
    setIsPlaying(false);
  }, []);

  const toggleVoice = useCallback(() => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem('coachVoiceEnabled', JSON.stringify(newValue));
    if (!newValue) {
      stop();
    }
  }, [voiceEnabled, stop]);

  const changeVoice = useCallback((voice: string) => {
    setSelectedVoice(voice);
    localStorage.setItem('coachVoice', voice);
  }, []);

  return {
    isPlaying,
    voiceEnabled,
    selectedVoice,
    playText,
    stop,
    toggleVoice,
    changeVoice,
  };
}
