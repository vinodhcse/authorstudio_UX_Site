// Idle timer utility for automatic session timeout
import React from 'react';
import { useAuthStore } from './useAuthStore';

interface IdleTimerConfig {
  idleTimeout: number; // milliseconds
  warningTime: number; // milliseconds before timeout to show warning
}

class IdleTimer {
  private timer: number | null = null;
  private warningTimer: number | null = null;
  private config: IdleTimerConfig;
  private onIdle: () => void;
  private onWarning: (remainingTime: number) => void;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;

  constructor(config: IdleTimerConfig, onIdle: () => void, onWarning: (remainingTime: number) => void) {
    this.config = config;
    this.onIdle = onIdle;
    this.onWarning = onWarning;
    
    // Bind event handlers
    this.handleActivity = this.handleActivity.bind(this);
  }

  private handleActivity = () => {
    this.lastActivity = Date.now();
    this.resetTimer();
  };

  private resetTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (!this.isActive) return;

    // Set warning timer
    const warningDelay = this.config.idleTimeout - this.config.warningTime;
    if (warningDelay > 0) {
      this.warningTimer = window.setTimeout(() => {
        this.onWarning(this.config.warningTime);
      }, warningDelay);
    }

    // Set idle timer
    this.timer = window.setTimeout(() => {
      this.onIdle();
      this.stop();
    }, this.config.idleTimeout);
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });

    this.resetTimer();
  }

  stop() {
    this.isActive = false;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    // Remove event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });
  }

  getRemainingTime(): number {
    if (!this.isActive) return 0;
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.config.idleTimeout - elapsed);
  }

  extend(additionalTime: number) {
    if (!this.isActive) return;
    this.config.idleTimeout += additionalTime;
    this.resetTimer();
  }
}

// React hook for idle timer
export const useIdleTimer = (config: IdleTimerConfig) => {
  const { clearInMemoryData } = useAuthStore();
  const [showWarning, setShowWarning] = React.useState(false);
  const [remainingTime, setRemainingTime] = React.useState(0);
  const timerRef = React.useRef<IdleTimer | null>(null);

  const handleIdle = React.useCallback(() => {
    console.log('User idle - clearing in-memory data');
    clearInMemoryData();
    setShowWarning(false);
  }, [clearInMemoryData]);

  const handleWarning = React.useCallback((time: number) => {
    console.log('Idle warning - user will be logged out soon');
    setRemainingTime(time);
    setShowWarning(true);
  }, []);

  const extendSession = React.useCallback(() => {
    if (timerRef.current) {
      timerRef.current.extend(config.idleTimeout * 0.5); // Extend by 50% of original timeout
      setShowWarning(false);
    }
  }, [config.idleTimeout]);

  const dismissWarning = React.useCallback(() => {
    setShowWarning(false);
  }, []);

  React.useEffect(() => {
    timerRef.current = new IdleTimer(config, handleIdle, handleWarning);
    timerRef.current.start();

    return () => {
      if (timerRef.current) {
        timerRef.current.stop();
      }
    };
  }, [config, handleIdle, handleWarning]);

  return {
    showWarning,
    remainingTime,
    extendSession,
    dismissWarning,
    getRemainingTime: () => timerRef.current?.getRemainingTime() || 0
  };
};

// Default configuration: 30 minutes idle timeout with 5 minute warning
export const DEFAULT_IDLE_CONFIG: IdleTimerConfig = {
  idleTimeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000,  // 5 minutes warning
};

export default IdleTimer;
