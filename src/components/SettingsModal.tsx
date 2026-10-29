import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  isDark,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[10px] z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="relative w-full max-w-[480px] my-auto bg-white dark:bg-[#18191d] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(27,28,25,0.18)] border border-black/[0.05] dark:border-white/[0.06] transition-all flex flex-col gap-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#006b5e] dark:text-[#8df1de]">
              tune
            </span>
            <h2
              id="settings-title"
              className="font-headline font-semibold text-lg text-[#1b1c19] dark:text-white"
            >
              Weekly Settings & Rhythm
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Theme preference */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#202126]">
            <div className="flex flex-col">
              <span className="font-semibold text-[#1b1c19] dark:text-white">Visual Mode</span>
              <span className="text-[#444748] dark:text-[#a1a1aa]">
                {isDark ? 'Dark Studio' : 'Light Canvas (Warm Unbleached Linen)'}
              </span>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#2a2c33] text-[#1b1c19] dark:text-white font-semibold shadow-xs"
            >
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Timezone & Rhythm Cycle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#202126]">
            <div className="flex flex-col">
              <span className="font-semibold text-[#1b1c19] dark:text-white">Active Cycle</span>
              <span className="text-[#444748] dark:text-[#a1a1aa]">Cycle 42 • Autumn Rhythm (Tokyo GMT+9)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#8df1de]/20 text-[#006b5e] dark:text-[#8df1de] font-semibold text-[10px]">
              Active
            </span>
          </div>

          {/* Reset Demo Data */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#202126]">
            <div className="flex flex-col">
              <span className="font-semibold text-[#1b1c19] dark:text-white">Reset Sample Week</span>
              <span className="text-[#444748] dark:text-[#a1a1aa]">
                Reload the original Oct 14-20 template
              </span>
            </div>
            <button
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
