import React, { useState, useEffect, useRef } from 'react';
import { zenAudio } from '../utils/audio';

interface ZenFocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZenFocusTimer: React.FC<ZenFocusTimerProps> = ({ isOpen, onClose }) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundscape, setSoundscape] = useState<'rain' | 'stream' | 'brown' | 'none'>('rain');
  const [volume, setVolume] = useState(0.08);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleReset = (mins = durationMinutes) => {
    setIsRunning(false);
    setDurationMinutes(mins);
    setSecondsRemaining(mins * 60);
    zenAudio.stopAmbient();
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[10px] z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zen-focus-title"
        className="relative w-full max-w-[500px] my-auto bg-white dark:bg-[#18191d] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(27,28,25,0.18)] border border-black/[0.05] dark:border-white/[0.06] transition-all flex flex-col items-center gap-6"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#006b5e] dark:text-[#8df1de]">
              spa
            </span>
            <h2
              id="zen-focus-title"
              className="font-headline font-semibold text-lg text-[#1b1c19] dark:text-white"
            >
              Mindful Focus & Soundscape
            </h2>
          </div>
          <button
            onClick={() => {
              if (!isRunning) zenAudio.stopAmbient();
              onClose();
            }}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Breathing Orb Visualization */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Subtle Outer Glow */}
          <div
            className={`absolute inset-0 rounded-full bg-[#006b5e]/10 dark:bg-[#8df1de]/10 transition-transform duration-1000 ${
              isRunning
                ? breathPhase === 'Inhale'
                  ? 'scale-110 opacity-90'
                  : breathPhase === 'Hold'
                  ? 'scale-105 opacity-70'
                  : 'scale-95 opacity-40'
                : 'scale-100'
            }`}
          />
          {/* Inner Circle with Timer */}
          <div className="relative z-10 flex flex-col items-center justify-center bg-[#f5f3ee] dark:bg-[#212328] w-36 h-36 rounded-full border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <span className="font-headline font-bold text-3xl tracking-tight text-[#1b1c19] dark:text-white font-mono">
              {formattedTime}
            </span>
            <span className="text-[11px] text-[#006b5e] dark:text-[#8df1de] font-medium mt-1">
              {isRunning ? breathPhase : 'Ready'}
            </span>
          </div>
        </div>

        {/* Duration Presets */}
        <div className="flex items-center gap-2">
          {[15, 25, 45, 90].map((m) => (
            <button
              key={m}
              type="button"
              disabled={isRunning}
              onClick={() => handleReset(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                durationMinutes === m
                  ? 'bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] shadow-xs'
                  : 'bg-[#f0eee9] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Soundscape Selector (Zympl inspiration) */}
        <div className="w-full bg-[#f5f3ee] dark:bg-[#202126] p-4 rounded-xl flex flex-col gap-3 border border-black/[0.03] dark:border-white/[0.04]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#1b1c19] dark:text-white">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#006b5e] dark:text-[#8df1de]">
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
                className={`py-2 px-1.5 rounded-lg text-[11px] font-medium flex flex-col items-center gap-1 transition-all ${
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
                className="w-full accent-[#006b5e] dark:accent-[#8df1de] h-1 bg-[#e4e2dd] dark:bg-[#2e3036] rounded-lg cursor-pointer"
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
            className="px-3.5 py-2 text-xs font-medium text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white transition-colors"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleStartPause}
            className={`px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs ${
              isRunning
                ? 'bg-[#eae8e3] dark:bg-[#282a30] text-[#1b1c19] dark:text-white hover:bg-[#e4e2dd]'
                : 'bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] hover:opacity-90 active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            <span>{isRunning ? 'Pause Flow' : 'Begin Focus Flow'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
