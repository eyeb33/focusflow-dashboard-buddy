import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import TimerCircle from "./TimerCircle";
import { Button } from "@/components/ui/button";

const DEFAULTS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  sessionsPerCycle: 4
};

const PomodoroTimer = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [duration, setDuration] = useState(DEFAULTS.focus);
  const [timeLeft, setTimeLeft] = useState(DEFAULTS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load user preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (!user) return;
      const { data, error } = await supabase.from("user_preferences").select("*").eq("id", user.id).single();
      if (data) {
        DEFAULTS.focus = data.focus_duration * 60;
        DEFAULTS.shortBreak = data.short_break_duration * 60;
        DEFAULTS.longBreak = data.long_break_duration * 60;
        DEFAULTS.sessionsPerCycle = data.sessions_per_cycle;
        setDuration(DEFAULTS.focus);
        setTimeLeft(DEFAULTS.focus);
      }
    };
    loadPrefs();
  }, [user]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const handleSessionComplete = async () => {
    if (user) {
      await supabase.from("pomodoro_sessions").insert({
        user_id: user.id,
        type: phase,
        duration: duration
      });
    }
    if (phase === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      if (newCount % DEFAULTS.sessionsPerCycle === 0) {
        switchTo('longBreak');
      } else {
        switchTo('shortBreak');
      }
    } else {
      switchTo('focus');
    }
  };

  const switchTo = (newPhase: 'focus' | 'shortBreak' | 'longBreak') => {
    const durations = {
      focus: DEFAULTS.focus,
      shortBreak: DEFAULTS.shortBreak,
      longBreak: DEFAULTS.longBreak
    };
    setPhase(newPhase);
    setDuration(durations[newPhase]);
    setTimeLeft(durations[newPhase]);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-2xl font-bold capitalize">{phase.replace('Break', ' Break')}</h2>
      <TimerCircle timeLeft={timeLeft} duration={duration} progress={(duration - timeLeft) / duration * 100} />
      <div className="text-4xl font-mono">{formatTime(timeLeft)}</div>
      <Button onClick={toggleTimer}>{isRunning ? 'Pause' : 'Start'}</Button>
    </div>
  );
};

export default PomodoroTimer;