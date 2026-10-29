import React from 'react';
import { HOTLINKED_ASSETS } from '../data/initialData';

interface HeaderProps {
  currentView: 'week-overview' | 'day-detail' | 'weekly-review' | 'habits';
  onNavigate: (view: 'week-overview' | 'day-detail' | 'weekly-review' | 'habits') => void;
  onOpenAddTask: () => void;
  onOpenFocusTimer: () => void;
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
  onOpenFocusTimer,
  isDark,
  onToggleTheme,
  weekRangeText,
  onPrevWeek,
  onNextWeek,
  onResetToday,
}) => {
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
                  ? 'bg-white dark:bg-[#1f2024] text-[#006b5e] dark:text-[#8df1de] shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#006b5e] dark:bg-[#8df1de]"></span>
              Habit Sticks
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
          {/* Zen Ambience & Focus Sound button (Zympl inspired) */}
          <button
            onClick={onOpenFocusTimer}
            title="Mindful Focus & Soundscape"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#006b5e] dark:text-[#8df1de] bg-[#006b5e]/10 dark:bg-[#8df1de]/10 hover:bg-[#006b5e]/15 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
            <span>Focus Sound</span>
          </button>

          {/* Add Task primary CTA */}
          <button
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] rounded-lg text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to Light Canvas' : 'Switch to Dark Studio'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[19px]">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Profile Avatar icon */}
          <div
            className="w-8 h-8 rounded-full bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] flex items-center justify-center text-xs font-semibold select-none shadow-xs"
            title="Profile & Rhythm Settings"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
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
            currentView === 'habits' ? 'text-[#006b5e] dark:text-[#8df1de] font-semibold' : 'text-[#444748] dark:text-[#a1a1aa]'
          }`}
        >
          Habits
        </button>
      </div>
    </header>
  );
};
