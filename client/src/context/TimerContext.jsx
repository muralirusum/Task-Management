import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [activeTimer, setActiveTimer] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  // Fetch active timer from backend on mount or user change
  const fetchActiveTimer = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/time/active');
      if (res.success && res.activeTimer) {
        setActiveTimer(res.activeTimer);
        // Calculate elapsed seconds so far
        if (res.activeTimer.status === 'running') {
          const now = new Date();
          const start = new Date(res.activeTimer.startTime);
          const currentSessionSec = Math.max(0, Math.round((now - start) / 1000));
          setSeconds((res.activeTimer.durationSeconds || 0) + currentSessionSec);
        } else {
          setSeconds(res.activeTimer.durationSeconds || 0);
        }
      } else {
        setActiveTimer(null);
        setSeconds(0);
      }
    } catch (err) {
      console.error('Failed to load active timer', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveTimer();
    } else {
      setActiveTimer(null);
      setSeconds(0);
    }
  }, [isAuthenticated, user?._id]);

  // Live timer interval
  useEffect(() => {
    if (activeTimer && activeTimer.status === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  const startTimer = async (taskId, note = '') => {
    try {
      const res = await api.post('/time/start', { taskId, note });
      if (res.success) {
        setActiveTimer(res.activeTimer);
        setSeconds(res.activeTimer.durationSeconds || 0);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to start timer' };
    }
  };

  const pauseTimer = async () => {
    try {
      const res = await api.post('/time/pause');
      if (res.success) {
        setActiveTimer(res.activeTimer);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to pause timer' };
    }
  };

  const resumeTimer = async () => {
    try {
      const res = await api.post('/time/resume');
      if (res.success) {
        setActiveTimer(res.activeTimer);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to resume timer' };
    }
  };

  const stopTimer = async () => {
    try {
      const res = await api.post('/time/stop');
      if (res.success) {
        setActiveTimer(null);
        setSeconds(0);
        return { success: true, durationMinutes: res.recordedDurationMinutes };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Failed to stop timer' };
    }
  };

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        seconds,
        formattedTime: formatTime(seconds),
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        refreshTimer: fetchActiveTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
