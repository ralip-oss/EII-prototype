import React, { useState } from 'react';
import { HabitStick, DayId } from '../types';
import { DAYS_CONFIG } from '../data/initialData';
import { zenAudio } from '../utils/audio';

interface HabitSticksModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitSticks: HabitStick[];
  onToggleHabitDay: (habitId: string, dayId: DayId) => void;
  onAddHabit: (title: string, category: string, color: string) => void;
  onDeleteHabit?: (habitId: string) => void;
}

export const HabitSticksModal: React.FC<HabitSticksModalProps> = ({
  isOpen,
  onClose,
  habitSticks,
  onToggleHabitDay,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Health');
  const [newColor, setNewColor] = useState('#8DB255');
  const [showAddForm, setShowAddForm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<HabitStick | null>(null);

  if (!isOpen) return null;

  const handleToggle = (habitId: string, dayId: DayId) => {
    zenAudio.playChime();
    onToggleHabitDay(habitId, dayId);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit(newTitle.trim(), newCategory, newColor);
    setNewTitle('');
    setShowAddForm(false);
    zenAudio.playChime();
  };

  const calculateStreak = (habit: HabitStick) => {
    let streak = 0;
    const dayKeys: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (const d of dayKeys) {
      if (habit.completedDays[d]) streak++;
    }
    return streak;
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[10px] z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-sticks-title"
        className="relative w-full max-w-[680px] my-auto bg-white dark:bg-[#18191d] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(27,28,25,0.18)] border border-black/[0.05] dark:border-white/[0.06] transition-all flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2e4faa] dark:bg-[#7d9eff]"></span>
              <h2
                id="habit-sticks-title"
                className="font-headline font-semibold text-xl text-[#1b1c19] dark:text-white"
              >
                Stickies Tracker
              </h2>
            </div>
            <p className="text-xs text-[#444748] dark:text-[#a1a1aa]">
              Inspired by tactile habit blocks. Tap each day to slot in your mindful ritual.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Days Header - mathematically aligned with each day checkbox column */}
        <div className="flex items-center justify-between px-3 sm:px-3.5 text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
          <span className="flex-1">Stickie Ritual</span>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {DAYS_CONFIG.map((d) => (
              <div key={d.id} className="w-6 sm:w-7 text-center font-bold">
                {d.shortName[0]}
              </div>
            ))}
            <div className="w-10 text-right">Streak</div>
            <div className="w-6 sm:w-7"></div>
          </div>
        </div>

        {/* Habit Sticks List */}
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {habitSticks.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-xs text-[#747878] dark:text-[#a1a1aa] bg-[#fbf9f4] dark:bg-[#151619] rounded-xl border border-dashed border-black/[0.08] dark:border-white/[0.08]">
              <span className="material-symbols-outlined text-[28px] text-[#2e4faa] dark:text-[#7d9eff] opacity-60">
                sticky_note_2
              </span>
              <span>No stickies tracked yet.</span>
              <span className="text-[11px] opacity-75">
                Click "+ Add New Stickie" below to create your first habit ritual.
              </span>
            </div>
          ) : (
            habitSticks.map((habit) => {
              const streak = calculateStreak(habit);
              return (
                <div
                  key={habit.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] border border-black/[0.03] dark:border-white/[0.04] flex items-center justify-between gap-3 group hover:shadow-xs transition-all"
                >
                  {/* Habit Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-2.5 h-7 rounded-sm shrink-0 shadow-xs"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-[#1b1c19] dark:text-white truncate">
                        {habit.title}
                      </span>
                      <span className="text-[10px] text-[#444748] dark:text-[#a1a1aa]">
                        {habit.category}
                      </span>
                    </div>
                  </div>

                  {/* Day Blocks - aligned with header column */}
                  <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {DAYS_CONFIG.map((d) => {
                      const isChecked = !!habit.completedDays[d.id];
                      return (
                        <div key={d.id} className="w-6 sm:w-7 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(habit.id, d.id)}
                            title={`${habit.title} on ${d.name}`}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-xs cursor-pointer ${
                              isChecked
                                ? 'text-white scale-100'
                                : 'bg-white dark:bg-[#282a30] text-transparent hover:border-black/20 dark:hover:border-white/20 border border-black/[0.06] dark:border-white/[0.06]'
                            }`}
                            style={isChecked ? { backgroundColor: habit.color } : {}}
                          >
                            <span className="material-symbols-outlined text-[14px] font-bold">
                              check
                            </span>
                          </button>
                        </div>
                      );
                    })}

                    <div className="w-10 text-right">
                      <span className="text-xs font-mono font-bold text-[#2e4faa] dark:text-[#7d9eff]">
                        {streak}/7
                      </span>
                    </div>

                    {/* Delete button (with accidental deletion confirmation) */}
                    <div className="w-6 sm:w-7 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setHabitToDelete(habit)}
                        title={`Remove ${habit.title}`}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-[#747878] hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Habit Stick Form */}
        {showAddForm ? (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-xl bg-[#f0eee9] dark:bg-[#212328] flex flex-col gap-3 border border-black/[0.04] dark:border-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                New Stickie
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-[#444748] dark:text-[#a1a1aa] hover:underline"
              >
                Cancel
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. 10m Meditation"
                className="flex-1 bg-white dark:bg-[#18191d] px-3 py-2 rounded-xl text-xs outline-none text-[#1b1c19] dark:text-white"
                autoFocus
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-white dark:bg-[#18191d] px-3 py-2 rounded-xl text-xs outline-none text-[#1b1c19] dark:text-white"
              >
                <option value="Health">Health</option>
                <option value="Focus">Focus</option>
                <option value="Recharge">Recharge</option>
                <option value="Mind">Mind</option>
              </select>
              <div className="flex items-center gap-1.5 px-2 bg-white dark:bg-[#18191d] rounded-xl">
                {['#E8735A', '#E9A23B', '#8DB255', '#3FA796', '#4F86E8', '#8B6FE0'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      newColor === c ? 'scale-125 ring-2 ring-[#1b1c19] dark:ring-white' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="py-2 bg-[#2e4faa] hover:bg-[#25418f] text-white rounded-xl text-xs font-semibold transition-opacity cursor-pointer"
            >
              Add Stickie
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="py-2.5 px-4 rounded-xl border border-dashed border-black/[0.15] dark:border-white/[0.15] text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Add New Stickie</span>
          </button>
        )}

        <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs text-[#444748] dark:text-[#a1a1aa]">
          <span>Consistency over perfection. No streaks penalty.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] font-semibold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Accidental Deletion Confirmation Modal */}
      {habitToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#202126] rounded-2xl p-6 max-w-sm w-full border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-headline font-semibold text-sm text-[#1b1c19] dark:text-white">
                  Remove Stickie?
                </h3>
                <p className="text-xs text-[#747878] dark:text-[#a1a1aa] leading-relaxed">
                  Are you sure you want to delete <strong className="text-[#1b1c19] dark:text-white">"{habitToDelete.title}"</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
              <button
                type="button"
                onClick={() => setHabitToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteHabit?.(habitToDelete.id);
                  setHabitToDelete(null);
                  zenAudio.playChime();
                }}
                className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                Delete Stickie
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
