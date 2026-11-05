import React, { useState, useEffect, useMemo } from 'react';
import { DayId, Task } from '../types';
import { CalendarDay, timeToMinutes, minutesToTime, durationToMinutes } from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Partial<Task>) => void;
  defaultDayId?: DayId;
  weekDays: CalendarDay[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  defaultDayId = 'thu',
  weekDays,
}) => {
  const [title, setTitle] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<DayId>(defaultDayId);
  const [startTime, setStartTime] = useState('14:00');
  const [duration, setDuration] = useState('1h');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [category, setCategory] = useState('Focus');
  const [notes, setNotes] = useState('');
  const [hasReminder, setHasReminder] = useState(true);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [availableCategories, setAvailableCategories] = useState([
    'Focus',
    'Work',
    'Health',
    'Personal',
    'Errands',
  ]);

  useEffect(() => {
    if (defaultDayId) {
      setSelectedDayId(defaultDayId);
    }
  }, [defaultDayId, isOpen]);

  const selectedDayConfig =
    weekDays.find((d) => d.dayId === selectedDayId) || weekDays[3] || weekDays[0];

  const calculatedEndTime = useMemo(() => {
    const startMins = timeToMinutes(startTime);
    const durMins = durationToMinutes(duration);
    return minutesToTime(startMins + durMins);
  }, [startTime, duration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitted(true);
    zenAudio.playChime();

    setTimeout(() => {
      onAddTask({
        title: title.trim(),
        dayId: selectedDayId,
        dateKey: selectedDayConfig?.dateKey,
        time: startTime || '12:00',
        duration,
        endTime: calculatedEndTime,
        category,
        notes,
        quietReminder: hasReminder,
        completed: false,
        status: 'todo',
      });
      setIsSubmitted(false);
      onClose();
    }, 400);
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !availableCategories.includes(newTagInput.trim())) {
      setAvailableCategories([...availableCategories, newTagInput.trim()]);
      setCategory(newTagInput.trim());
      setNewTagInput('');
      setShowAddTag(false);
    }
  };

  const updateCustomDuration = (hours: number, minutes: number) => {
    setCustomHours(hours);
    setCustomMinutes(minutes);
    let str = '';
    if (hours > 0 && minutes > 0) {
      str = `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      str = `${hours}h`;
    } else {
      str = `${Math.max(5, minutes)}m`;
    }
    setDuration(str);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[10px] z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-[540px] my-auto bg-white dark:bg-[#18191d] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(27,28,25,0.18)] border border-black/[0.05] dark:border-white/[0.06] transition-all flex flex-col gap-5"
      >
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#006b5e] to-transparent"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#006b5e] dark:bg-[#8df1de]"></div>
            <h2
              id="modal-title"
              className="font-headline font-semibold text-xl tracking-tight text-[#1b1c19] dark:text-white"
            >
              New Activity
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

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title Input */}
          <div className="relative group">
            <label className="sr-only" htmlFor="taskTitle">
              Activity Title
            </label>
            <input
              id="taskTitle"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep focus study session"
              className="w-full bg-transparent pb-3 font-headline font-semibold text-lg sm:text-xl text-[#1b1c19] dark:text-white placeholder:text-[#444748]/40 focus:outline-none transition-all"
            />
            <div className="w-full h-[1.5px] bg-[#eae8e3] dark:bg-[#2e3036] group-focus-within:bg-[#1b1c19] dark:group-focus-within:bg-white transition-colors"></div>
          </div>

          {/* Day Strip Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Scheduled Day
              </span>
              <span className="text-xs font-semibold text-[#006b5e] dark:text-[#8df1de]">
                {selectedDayConfig.dayName}, {selectedDayConfig.monthName} {selectedDayConfig.dayNumber}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 pt-1">
              {weekDays.map((d) => {
                const isSelected = d.dayId === selectedDayId;
                return (
                  <button
                    key={d.dayId}
                    type="button"
                    onClick={() => setSelectedDayId(d.dayId)}
                    className={`group flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-[#2e4faa] text-white shadow-xs'
                        : 'bg-[#f5f3ee] dark:bg-[#212328] hover:bg-[#eae8e3] dark:hover:bg-[#2a2c33] text-[#1b1c19] dark:text-white'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-medium ${
                        isSelected ? 'opacity-90' : 'text-[#444748] dark:text-[#a1a1aa]'
                      }`}
                    >
                      {d.shortName[0]}
                    </span>
                    <span className="font-headline font-semibold text-sm">
                      {d.dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Start Time Field */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Start Time
              </span>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f5f3ee] dark:bg-[#212328] border border-black/[0.03] dark:border-white/[0.04] focus-within:border-black/[0.15]">
                <span className="material-symbols-outlined text-[18px] text-[#444748] dark:text-[#a1a1aa]">
                  schedule
                </span>
                <input
                  type="text"
                  aria-label="Start time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-transparent font-headline font-semibold text-sm text-[#1b1c19] dark:text-white focus:outline-none font-mono"
                />
                <span className="text-[10px] font-mono font-semibold text-[#444748] dark:text-[#a1a1aa]">
                  CET
                </span>
              </div>
            </div>

            {/* Duration Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                  Duration
                </span>
                <span className="text-[11px] text-[#006b5e] dark:text-[#8df1de] font-mono font-medium">
                  Ends at {calculatedEndTime}
                </span>
              </div>

              {/* Pre-determined time blocks */}
              <div className="grid grid-cols-4 gap-2 h-[38px]">
                {['30m', '45m', '1h', '2h'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      setDuration(d);
                    }}
                    className={`h-full rounded-xl text-xs font-semibold transition-all ${
                      !isCustomDuration && duration === d
                        ? 'bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] shadow-xs'
                        : 'bg-[#f5f3ee] dark:bg-[#212328] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Custom time button placed under pre-determined time blocks */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomDuration(true);
                  updateCustomDuration(customHours, customMinutes);
                }}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isCustomDuration
                    ? 'bg-[#2e4faa] text-white shadow-xs'
                    : 'bg-[#f5f3ee] dark:bg-[#212328] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white border border-dashed border-black/[0.08] dark:border-white/[0.08]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">tune</span>
                <span>Set Custom Time</span>
              </button>

              {/* Expandable Custom Time inputs when Set Custom Time is selected */}
              {isCustomDuration && (
                <div className="mt-1 p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#212328] border border-black/[0.04] dark:border-white/[0.05] flex flex-col gap-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1b1c19] dark:text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#2e4faa]">timer</span>
                      Set Custom Time:
                    </span>
                    <span className="font-mono text-xs text-[#2e4faa] dark:text-[#7d9eff] font-bold">
                      {duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 flex-1 bg-white dark:bg-[#18191d] px-2.5 py-1.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06]">
                      <label className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa]">Hours:</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={customHours}
                        onChange={(e) => {
                          const h = Math.max(0, parseInt(e.target.value, 10) || 0);
                          updateCustomDuration(h, customMinutes);
                        }}
                        className="w-full bg-transparent text-xs font-mono font-semibold text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-[#747878] dark:text-[#a1a1aa]">hr</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 bg-white dark:bg-[#18191d] px-2.5 py-1.5 rounded-lg border border-black/[0.05] dark:border-white/[0.06]">
                      <label className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa]">Minutes:</label>
                      <input
                        type="number"
                        min={5}
                        max={59}
                        step={5}
                        value={customMinutes}
                        onChange={(e) => {
                          const m = Math.max(5, Math.min(59, parseInt(e.target.value, 10) || 5));
                          updateCustomDuration(customHours, m);
                        }}
                        className="w-full bg-transparent text-xs font-mono font-semibold text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-[#747878] dark:text-[#a1a1aa]">min</span>
                    </div>
                  </div>

                  {/* Quick incremental shortcut chips including < 30min */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[
                      { label: '10m', h: 0, m: 10 },
                      { label: '15m', h: 0, m: 15 },
                      { label: '20m', h: 0, m: 20 },
                      { label: '45m', h: 0, m: 45 },
                      { label: '1h 15m', h: 1, m: 15 },
                      { label: '1h 30m', h: 1, m: 30 },
                      { label: '2h', h: 2, m: 0 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => updateCustomDuration(chip.h, chip.m)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all ${
                          customHours === chip.h && customMinutes === chip.m
                            ? 'bg-[#2e4faa] text-white'
                            : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#444748] dark:text-[#a1a1aa] hover:bg-black/[0.08]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Tag Selection */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Category Tag
              </span>
              <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]/70">Single tag</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {availableCategories.map((cat) => {
                const isCatSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isCatSelected
                        ? 'bg-[#eae8e3] dark:bg-[#2e3036] text-[#1b1c19] dark:text-white shadow-xs'
                        : 'bg-[#f5f3ee] dark:bg-[#212328] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                    }`}
                  >
                    {isCatSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006b5e] dark:bg-[#8df1de]"></span>
                    )}
                    <span>{cat}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowAddTag(!showAddTag)}
                className="px-2.5 py-1.5 rounded-full bg-[#f5f3ee] dark:bg-[#212328] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>New</span>
              </button>
            </div>

            {showAddTag && (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="New category..."
                  className="bg-[#f0eee9] dark:bg-[#212328] px-3 py-1.5 rounded-lg text-xs outline-none flex-1 text-[#1b1c19] dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="px-3 py-1 bg-[#006b5e] text-white rounded-lg text-xs font-semibold"
                >
                  Add Tag
                </button>
              </div>
            )}
          </div>

          {/* Notes & Context Box */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Notes & Context
              </span>
              <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]/70">Markdown ready</span>
            </div>
            <div className="rounded-xl bg-[#f5f3ee] dark:bg-[#212328] p-3 flex flex-col gap-2 border border-black/[0.03] dark:border-white/[0.04]">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add quiet notes, research references, or checklist items..."
                rows={3}
                className="w-full bg-transparent text-xs text-[#1b1c19] dark:text-white placeholder:text-[#444748]/50 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04] text-[#444748] dark:text-[#a1a1aa]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Add checklist item"
                    onClick={() => setNotes((prev) => `${prev}\n- [ ] `)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:text-[#1b1c19] dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_box</span>
                  </button>
                  <button
                    type="button"
                    title="Attach link"
                    onClick={() => setNotes((prev) => `${prev} [Link](https://)`)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:text-[#1b1c19] dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                  </button>
                  <button
                    type="button"
                    title="Add reference document"
                    onClick={() => setNotes((prev) => `${prev}\n> Reference: `)}
                    className="w-6 h-6 rounded flex items-center justify-center hover:text-[#1b1c19] dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  </button>
                </div>
                <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]/60">2 items</span>
              </div>
            </div>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#444748] dark:text-[#a1a1aa]">
                notifications_active
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                  Quiet Reminder
                </span>
                <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]">
                  15m before event
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasReminder}
              onClick={() => setHasReminder(!hasReminder)}
              className={`w-10 h-6 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                hasReminder
                  ? 'bg-[#006b5e] justify-end'
                  : 'bg-[#e4e2dd] dark:bg-[#2e3036] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs"></span>
            </button>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  isRepeat
                    ? 'bg-[#2e4faa]/15 text-[#2e4faa] dark:text-[#7d9eff]'
                    : 'bg-[#f5f3ee] dark:bg-[#212328] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">repeat</span>
                <span>{isRepeat ? 'Repeats Weekly' : 'Repeat'}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitted}
                className="px-5 py-2.5 rounded-xl bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] font-headline font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitted ? 'done_all' : 'check'}
                </span>
                <span>{isSubmitted ? 'Saved' : 'Create Activity'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
