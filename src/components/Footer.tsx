import React from 'react';

interface FooterProps {
  onOpenSettings: () => void;
  onOpenHabits: () => void;
  onOpenFocus: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings, onOpenHabits, onOpenFocus }) => {
  return (
    <footer className="w-full bg-[#f5f3ee] dark:bg-[#141518] py-8 border-t border-black/[0.04] dark:border-white/[0.04] transition-colors">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#444748] dark:text-[#a1a1aa] text-xs">
        <div className="flex items-center gap-2">
          <span>© 2024 Weekly. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-[#444748] dark:text-[#a1a1aa] hidden md:inline">
            Quiet, intentional pacing.
          </span>
          <button
            onClick={onOpenHabits}
            className="hover:text-[#1b1c19] dark:hover:text-white transition-colors"
          >
            Habit Sticks
          </button>
          <button
            onClick={onOpenFocus}
            className="hover:text-[#1b1c19] dark:hover:text-white transition-colors"
          >
            Soundscape
          </button>
          <button
            onClick={onOpenSettings}
            className="hover:text-[#1b1c19] dark:hover:text-white transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </footer>
  );
};
