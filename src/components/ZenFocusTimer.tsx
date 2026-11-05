import React, { useState, useEffect, useRef, useCallback } from 'react';
import { zenAudio } from '../utils/audio';

interface ZenFocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZenFocusTimer: React.FC<ZenFocusTimerProps> = ({ isOpen, onClose }) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMins, setCustomMins] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [soundscape, setSoundscape] = useState<'rain' | 'stream' | 'brown' | 'none'>('rain');
  const [volume, setVolume] = useState(0.08);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop audio and timers when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setIsFullScreen(false);
      zenAudio.stopAmbient();
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            zenAudio.playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Gentle breath pacing (4s Inhale, 4s Hold, 4s Exhale)
  useEffect(() => {
    if (!isRunning) return;
    const breathInterval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(breathInterval);
  }, [isRunning]);

  // Fullscreen user activity detector to auto-hide controls after 3 seconds of inactivity
  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isRunning && isFullScreen) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isRunning, isFullScreen]);

  useEffect(() => {
    if (isFullScreen) {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
      events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
      // Initial hide timeout
      hideTimerRef.current = setTimeout(() => {
        if (isRunning) setShowControls(false);
      }, 3500);

      return () => {
        events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    } else {
      setShowControls(true);
    }
  }, [isFullScreen, isRunning, handleUserActivity]);

  // Soundscape management
  const handleSoundChange = (type: 'rain' | 'stream' | 'brown' | 'none') => {
    setSoundscape(type);
    if (type === 'none') {
      zenAudio.stopAmbient();
    } else {
      zenAudio.startAmbient(type, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    zenAudio.setVolume(newVol);
  };

  const handleStartPause = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (nextRunning) {
      zenAudio.playChime();
      if (soundscape !== 'none') {
        zenAudio.startAmbient(soundscape, volume);
      }
    } else {
      zenAudio.stopAmbient();
    }
  };

  // Begin focus flow: enters fullscreen and starts timer & ambient audio
  const handleBegin = () => {
    setIsRunning(true);
    setIsFullScreen(true);
    zenAudio.playChime();
    if (soundscape !== 'none') {
      zenAudio.startAmbient(soundscape, volume);
    }
  };

  const handleReset = (mins = durationMinutes) => {
    setIsRunning(false);
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    zenAudio.stopAmbient();
  };

  const handleCustomTimeApply = (h: number, m: number) => {
    const totalMins = Math.max(1, h * 60 + m);
    setCustomHours(h);
    setCustomMins(m);
    setDurationMinutes(totalMins);
    setSecondsRemaining(totalMins * 60);
    setIsRunning(false);
    zenAudio.stopAmbient();
  };

  if (!isOpen) return null;

  // Format as hh:mm:ss
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');
  const formattedTime = `${hoursStr}:${minutesStr}:${secondsStr}`;

  // ==========================================
  // FULLSCREEN IMMERSIVE ZEN VIEW
  // ==========================================
  if (isFullScreen) {
    return (
      <div
        onMouseMove={handleUserActivity}
        onTouchStart={handleUserActivity}
        className={`fixed inset-0 z-[100] w-screen h-screen bg-[#0b0c0e] text-white flex flex-col items-center justify-center select-none overflow-hidden ${
          !showControls ? 'cursor-none' : ''
        }`}
      >
        {/* Top Header Bar - Auto-hides on idle */}
        <div
          className={`absolute top-0 left-0 right-0 p-5 sm:p-7 flex items-center justify-between z-30 transition-opacity duration-500 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8df1de] animate-pulse"></span>
            <span className="font-headline font-semibold text-sm sm:text-base tracking-wide text-[#e4e2dd]">
              Mindful Soundscape Flow
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-mono text-[#a1a1aa]">
              {soundscape}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsFullScreen(false);
            }}
            title="Exit Fullscreen / Way Out"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all backdrop-blur-md cursor-pointer border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>
            <span>Exit Fullscreen</span>
          </button>
        </div>

        {/* Central Visualization: Breathing Orb & Large hh:mm:ss Display */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Ambient Outer Breathing Aura */}
          <div
            className={`w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#006b5e]/25 dark:bg-[#8df1de]/20 blur-3xl absolute transition-all duration-1000 ${
              isRunning
                ? breathPhase === 'Inhale'
                  ? 'scale-125 opacity-90'
                  : breathPhase === 'Hold'
                  ? 'scale-110 opacity-70'
                  : 'scale-90 opacity-40'
                : 'scale-100 opacity-50'
            }`}
          />

          {/* Glowing Orb Border */}
          <div
            className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center border border-white/10 bg-[#14151a]/80 backdrop-blur-xl shadow-2xl transition-transform duration-1000 ${
              isRunning
                ? breathPhase === 'Inhale'
                  ? 'scale-105 ring-4 ring-[#8df1de]/30'
                  : breathPhase === 'Hold'
                  ? 'scale-100 ring-2 ring-[#8df1de]/20'
                  : 'scale-95 ring-0'
                : 'scale-100'
            }`}
          >
            {/* hh:mm:ss Digital Clock */}
            <span className="font-mono font-bold text-4xl sm:text-6xl tracking-tight text-white drop-shadow-md">
              {formattedTime}
            </span>

            {/* Breath Phase Guide */}
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#8df1de] mt-2.5 transition-all">
              {isRunning ? breathPhase : 'Paused'}
            </span>
          </div>
        </div>

        {/* Floating Bottom Controls - Auto-hides on idle */}
        <div
          className={`absolute bottom-6 sm:bottom-8 z-30 transition-opacity duration-500 flex flex-col items-center gap-3 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Floating Pill with Controls */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#18191f]/90 border border-white/10 backdrop-blur-xl shadow-2xl">
            {/* Pause / Resume Button */}
            <button
              type="button"
              onClick={handleStartPause}
              className="px-4 py-2 rounded-xl bg-white text-[#1b1c19] text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
              <span>{isRunning ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => handleReset(durationMinutes)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Reset
            </button>

            <div className="h-5 w-px bg-white/10"></div>

            {/* Soundscape Selector */}
            <div className="flex items-center gap-1">
              {[
                { id: 'rain', label: 'Rain', icon: 'water_drop' },
                { id: 'stream', label: 'Stream', icon: 'waves' },
                { id: 'brown', label: 'Brown Noise', icon: 'blur_on' },
                { id: 'none', label: 'Mute', icon: 'volume_off' },
              ].map((snd) => (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => handleSoundChange(snd.id as typeof soundscape)}
                  title={snd.label}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                    soundscape === snd.id
                      ? 'bg-[#2e4faa] text-white font-semibold shadow-xs'
                      : 'text-[#a1a1aa] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{snd.icon}</span>
                  <span className="hidden sm:inline">{snd.label}</span>
                </button>
              ))}
            </div>

            {/* Volume Slider if not muted */}
            {soundscape !== 'none' && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/10">
                <span className="material-symbols-outlined text-[14px] text-[#a1a1aa]">
                  volume_up
                </span>
                <input
                  type="range"
                  min="0.01"
                  max="0.25"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 accent-[#2e4faa] h-1 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          <span className="text-[10px] text-[#71717a] font-mono tracking-wider">
            Move mouse or touch screen to reveal controls
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODAL CONFIGURATION VIEW (Before Fullscreen)
  // ==========================================
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[10px] z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zen-focus-title"
        className="relative w-full max-w-[520px] my-auto bg-white dark:bg-[#18191d] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(27,28,25,0.25)] border border-black/[0.05] dark:border-white/[0.06] transition-all flex flex-col items-center gap-5"
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2e4faa]/10 text-[#2e4faa] dark:text-[#7d9eff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            </div>
            <h2
              id="zen-focus-title"
              className="font-headline font-semibold text-lg text-[#1b1c19] dark:text-white"
            >
              Soundscape & Focus Flow
            </h2>
          </div>
          <button
            onClick={() => {
              if (!isRunning) zenAudio.stopAmbient();
              onClose();
            }}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Breathing Orb Preview with hh:mm:ss */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#2e4faa]/10 dark:bg-[#2e4faa]/20 blur-xl scale-100" />
          <div className="relative z-10 flex flex-col items-center justify-center bg-[#f5f3ee] dark:bg-[#212328] w-38 h-38 rounded-full border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <span className="font-mono font-bold text-3xl tracking-tight text-[#1b1c19] dark:text-white">
              {formattedTime}
            </span>
            <span className="text-[11px] text-[#2e4faa] dark:text-[#7d9eff] font-medium mt-1">
              {durationMinutes} min session
            </span>
          </div>
        </div>

        {/* Duration Selection: Presets & Custom Time */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
            <span>Duration</span>
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-[11px] text-[#2e4faa] dark:text-[#7d9eff] lowercase hover:underline font-semibold cursor-pointer"
            >
              {isCustomMode ? 'Use presets' : 'Set custom time'}
            </button>
          </div>

          {!isCustomMode ? (
            <div className="grid grid-cols-5 gap-1.5">
              {[15, 25, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleReset(m)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    durationMinutes === m
                      ? 'bg-[#2e4faa] text-white shadow-xs'
                      : 'bg-[#f0eee9] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                  }`}
                >
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] border border-black/[0.04] dark:border-white/[0.05]">
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={customHours}
                  onChange={(e) => {
                    const h = Math.max(0, parseInt(e.target.value, 10) || 0);
                    handleCustomTimeApply(h, customMins);
                  }}
                  className="w-14 bg-white dark:bg-[#18191d] px-2 py-1 rounded-lg text-xs font-mono font-bold text-center text-[#1b1c19] dark:text-white border border-black/[0.05]"
                />
                <span className="text-xs text-[#747878] dark:text-[#a1a1aa]">hours</span>
              </div>
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="number"
                  min={1}
                  max={59}
                  value={customMins}
                  onChange={(e) => {
                    const m = Math.max(1, parseInt(e.target.value, 10) || 1);
                    handleCustomTimeApply(customHours, m);
                  }}
                  className="w-14 bg-white dark:bg-[#18191d] px-2 py-1 rounded-lg text-xs font-mono font-bold text-center text-[#1b1c19] dark:text-white border border-black/[0.05]"
                />
                <span className="text-xs text-[#747878] dark:text-[#a1a1aa]">mins</span>
              </div>
            </div>
          )}
        </div>

        {/* Soundscape Selector */}
        <div className="w-full bg-[#f5f3ee] dark:bg-[#202126] p-4 rounded-xl flex flex-col gap-3 border border-black/[0.03] dark:border-white/[0.04]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c19] dark:text-white">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#2e4faa] dark:text-[#7d9eff]">
                graphic_eq
              </span>
              <span>Ambient Soundscape</span>
            </span>
            <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa] capitalize">
              {soundscape}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'rain', label: 'Rain', icon: 'water_drop' },
              { id: 'stream', label: 'Stream', icon: 'waves' },
              { id: 'brown', label: 'Brown Noise', icon: 'blur_on' },
              { id: 'none', label: 'Mute', icon: 'volume_off' },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => handleSoundChange(snd.id as typeof soundscape)}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  soundscape === snd.id
                    ? 'bg-white dark:bg-[#282a30] text-[#2e4faa] dark:text-[#7d9eff] font-semibold shadow-xs'
                    : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{snd.icon}</span>
                <span>{snd.label}</span>
              </button>
            ))}
          </div>

          {soundscape !== 'none' && (
            <div className="flex items-center gap-3 pt-1">
              <span className="material-symbols-outlined text-[14px] text-[#444748] dark:text-[#a1a1aa]">
                volume_mute
              </span>
              <input
                type="range"
                min="0.01"
                max="0.25"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-[#2e4faa] h-1 bg-[#e4e2dd] dark:bg-[#2e3036] rounded-lg cursor-pointer"
              />
              <span className="material-symbols-outlined text-[14px] text-[#444748] dark:text-[#a1a1aa]">
                volume_up
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
          <button
            type="button"
            onClick={() => handleReset(durationMinutes)}
            className="px-3.5 py-2 text-xs font-medium text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white transition-colors cursor-pointer"
          >
            Reset
          </button>

          {/* Begin button covers the full screen as requested */}
          <button
            type="button"
            onClick={handleBegin}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs bg-[#2e4faa] hover:bg-[#25418f] text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Begin Focus Flow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
