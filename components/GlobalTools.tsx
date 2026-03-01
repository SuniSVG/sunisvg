'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function GlobalTools() {
  const { pomodoroIsActive, pomodoroTimeLeft, setPomodoroTimeLeft, pomodoroMode, setPomodoroIsActive, setPomodoroMode } = useAppStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroIsActive && pomodoroTimeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimeLeft(pomodoroTimeLeft - 1);
      }, 1000);
    } else if (pomodoroIsActive && pomodoroTimeLeft === 0) {
      // Switch mode
      const newMode = pomodoroMode === 'work' ? 'break' : 'work';
      setPomodoroMode(newMode);
      setPomodoroTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
      setPomodoroIsActive(false); // Pause on switch
      // Play sound here if needed
    }
    return () => clearInterval(interval);
  }, [pomodoroIsActive, pomodoroTimeLeft, pomodoroMode, setPomodoroTimeLeft, setPomodoroMode, setPomodoroIsActive]);

  return null; // This component just manages global side effects
}
