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
}

export const HabitSticksModal: React.FC<HabitSticksModalProps> = ({
  isOpen,
  onClose,
  habitSticks,
  onToggleHabitDay,
  onAddHabit,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Health');
  const [newColor, setNewColor] = useState('#8DB255');
  const [showAddForm, setShowAddForm] = useState(false);

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
              <span className="w-2.5 h-2.5 rounded-full bg-[#006b5e] dark:bg-[#8df1de]"></span>
              <h2
                id="habit-sticks-title"
                className="font-headline font-semibold text-xl text-[#1b1c19] dark:text-white"
              >
                Tactile Habit Sticks
              </h2>
            </div>
            <p className="text-xs text-[#444748] dark:text-[#a1a1aa]">
              Inspired by physical habit blocks. Tap each day to slot in your mindful ritual.
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

        {/* Days Header */}
        <div className="flex items-center justify-between px-3 text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
          <span>Habit Ritual</span>
          <div className="flex items-center gap-2.5 sm:gap-3.5 pr-2">
            {DAYS_CONFIG.map((d) => (
              <span key={d.id} className="w-6 text-center">
                {d.shortName[0]}
              </span>
            ))}
            <span className="w-10 text-right">Streak</span>
          </div>
        </div>

        {/* Habit Sticks List (Tactile Wooden/Pastel feeling) */}
        <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {habitSticks.map((habit) => {
            const streak = calculateStreak(habit);
            return (
              <div
                key={habit.id}
                className="p-3 sm:p-3.5 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] border border-black/[0.03] dark:border-white/[0.04] flex items-center justify-between gap-3 group hover:shadow-xs transition-all"
              >
                {/* Habit Info */}
                <div className="flex items-center gap-3 min-w-0">
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

                {/* Day Blocks */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                  {DAYS_CONFIG.map((d) => {
                    const isChecked = !!habit.completedDays[d.id];
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleToggle(habit.id, d.id)}
                        title={`${habit.title} on ${d.name}`}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-xs ${
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
                    );
                  })}

                  <div className="w-10 text-right">
                    <span className="text-xs font-mono font-bold text-[#006b5e] dark:text-[#8df1de]">
                      {streak}/7
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Habit Stick Form */}
        {showAddForm ? (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-xl bg-[#f0eee9] dark:bg-[#212328] flex flex-col gap-3 border border-black/[0.04] dark:border-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                New Habit Stick
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
              className="py-2 bg-[#006b5e] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Add Stick
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="py-2.5 px-4 rounded-xl border border-dashed border-black/[0.15] dark:border-white/[0.15] text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add New Habit Stick</span>
          </button>
        )}

        <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs text-[#444748] dark:text-[#a1a1aa]">
          <span>Consistency over perfection. No streaks penalty.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] font-semibold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
