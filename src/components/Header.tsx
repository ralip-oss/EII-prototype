import React, { useState, useRef, useEffect } from 'react';
import { HOTLINKED_ASSETS } from '../data/initialData';

interface HeaderProps {
  currentView: 'week-overview' | 'day-detail' | 'weekly-review' | 'habits';
  onNavigate: (view: 'week-overview' | 'day-detail' | 'weekly-review' | 'habits') => void;
  onOpenAddTask: () => void;
  onOpenAiBatch: () => void;
  onOpenFocusTimer: () => void;
  onOpenSettings?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  weekRangeText: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetToday: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAddTask,
  onOpenAiBatch,
  onOpenFocusTimer,
  onOpenSettings,
  isDark,
  onToggleTheme,
  weekRangeText,
  onPrevWeek,
  onNextWeek,
  onResetToday,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-[#fbf9f4]/85 dark:bg-[#0f0f12]/85 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] shadow-[0_1px_8px_rgba(0,0,0,0.02)] transition-colors duration-300">
      <div className="h-16 w-full px-4 sm:px-6 md:px-8 max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand + Navigation tabs */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Brand lockup */}
          <button
            onClick={() => onNavigate('week-overview')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="Weekly Home"
          >
            <img
              alt="Weekly Logo"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              src={HOTLINKED_ASSETS.logo}
            />
            <span className="font-headline font-semibold text-xl tracking-tight text-[#1b1c19] dark:text-[#f2f0ea]">
              Weekly
            </span>
          </button>

          {/* Navigation items */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl" role="tablist">
            <button
              onClick={() => onNavigate('week-overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'week-overview'
                  ? 'bg-white dark:bg-[#1f2024] text-[#1b1c19] dark:text-white shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              Week Overview
            </button>
            <button
              onClick={() => onNavigate('day-detail')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'day-detail'
                  ? 'bg-white dark:bg-[#1f2024] text-[#1b1c19] dark:text-white shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              Day Detail
            </button>
            <button
              onClick={() => onNavigate('weekly-review')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                currentView === 'weekly-review'
                  ? 'bg-white dark:bg-[#1f2024] text-[#1b1c19] dark:text-white shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => onNavigate('habits')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                currentView === 'habits'
                  ? 'bg-white dark:bg-[#1f2024] text-[#2e4faa] dark:text-[#7d9eff] shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2e4faa] dark:bg-[#7d9eff]"></span>
              Stickies
            </button>
          </nav>
        </div>

        {/* Center: Week Calendar Navigator */}
        <div className="hidden md:flex items-center gap-1 bg-[#f5f3ee] dark:bg-[#18191c] px-2 py-1 rounded-full border border-black/[0.03] dark:border-white/[0.04]">
          <button
            onClick={onPrevWeek}
            aria-label="Previous week"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="font-headline font-semibold text-xs tracking-tight text-[#1b1c19] dark:text-[#f2f0ea] px-2 select-none">
            {weekRangeText}
          </span>
          <button
            onClick={onNextWeek}
            aria-label="Next week"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
          <button
            onClick={onResetToday}
            className="ml-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-[#25262b] text-[11px] font-semibold text-[#1b1c19] dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-[#eae8e3] dark:hover:bg-[#2e3036] transition-colors"
          >
            Today
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Soundscape button (secondary button accent 2e4faa) */}
          <button
            onClick={onOpenFocusTimer}
            title="Mindful Soundscape"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2e4faa] dark:text-[#7d9eff] bg-[#2e4faa]/10 dark:bg-[#2e4faa]/20 hover:bg-[#2e4faa]/20 border border-[#2e4faa]/25 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
            <span>Soundscape</span>
          </button>

          {/* AI Batch Scheduling CTA (secondary button accent 2e4faa) */}
          <button
            onClick={onOpenAiBatch}
            title="Batch Add Activities with AI Scheduler"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2e4faa] dark:text-[#7d9eff] bg-[#2e4faa]/10 dark:bg-[#2e4faa]/20 hover:bg-[#2e4faa]/20 transition-all border border-[#2e4faa]/25 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span className="hidden sm:inline">Batch AI</span>
          </button>

          {/* Add Activity primary CTA */}
          <button
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Add Activity</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to Light Canvas' : 'Switch to Dark Studio'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Profile Avatar icon with dropdown menu (Make Account & Settings) */}
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] flex items-center justify-center text-xs font-semibold select-none shadow-xs hover:ring-2 hover:ring-[#2e4faa]/40 transition-all cursor-pointer"
              title="Account & Settings"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1b1e] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] border border-black/[0.08] dark:border-white/[0.1] py-1.5 z-50 animate-fadeIn">
                <div className="px-3.5 py-2 flex items-center justify-between text-xs text-[#747878] dark:text-[#71717a] opacity-70 select-none">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    <span>Make Account</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.05]">Soon</span>
                </div>
                <div className="h-px bg-black/[0.05] dark:bg-white/[0.06] my-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#1b1c19] dark:text-[#f2f0ea] hover:bg-[#f0eee9] dark:hover:bg-[#25262c] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  <span>Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile subnav for smaller screens */}
      <div className="lg:hidden flex items-center justify-around px-4 py-1.5 border-t border-black/[0.04] dark:border-white/[0.04] bg-[#f5f3ee]/80 dark:bg-[#141518]/80 text-xs">
        <button
          onClick={() => onNavigate('week-overview')}
          className={`py-1 px-2.5 rounded-md font-medium transition-colors ${
            currentView === 'week-overview' ? 'text-[#006b5e] dark:text-[#8df1de] font-semibold' : 'text-[#444748] dark:text-[#a1a1aa]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onNavigate('day-detail')}
          className={`py-1 px-2.5 rounded-md font-medium transition-colors ${
            currentView === 'day-detail' ? 'text-[#006b5e] dark:text-[#8df1de] font-semibold' : 'text-[#444748] dark:text-[#a1a1aa]'
          }`}
        >
          Day Detail
        </button>
        <button
          onClick={() => onNavigate('weekly-review')}
          className={`py-1 px-2.5 rounded-md font-medium transition-colors ${
            currentView === 'weekly-review' ? 'text-[#006b5e] dark:text-[#8df1de] font-semibold' : 'text-[#444748] dark:text-[#a1a1aa]'
          }`}
        >
          Review
        </button>
        <button
          onClick={() => onNavigate('habits')}
          className={`py-1 px-2.5 rounded-md font-medium transition-colors ${
            currentView === 'habits' ? 'text-[#2e4faa] dark:text-[#7d9eff] font-semibold' : 'text-[#444748] dark:text-[#a1a1aa]'
          }`}
        >
          Stickies
        </button>
      </div>
    </header>
  );
};
