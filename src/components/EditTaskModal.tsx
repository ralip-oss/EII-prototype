import React, { useState, useEffect } from 'react';
import { Task, DayId } from '../types';
import {
  CalendarDay,
  TASK_COLOR_PALETTE,
  getTaskColor,
  timeToMinutes,
  minutesToTime,
  durationToMinutes,
} from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  weekDays: CalendarDay[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSaveTask,
  onDeleteTask,
  weekDays,
}) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('');
  const [dayId, setDayId] = useState<DayId>('mon');
  const [dateKey, setDateKey] = useState('');
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [duration, setDuration] = useState('1h');
  const [repeat, setRepeat] = useState<'once' | 'weekly' | 'monthly' | 'yearly'>('once');
  const [notes, setNotes] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setColor(task.color || getTaskColor(task.title));
      setDayId(task.dayId || 'mon');
      setDateKey(task.dateKey || '');
      const startTimeVal = task.time || '09:00';
      setTime(startTimeVal);

      const durMins = durationToMinutes(task.duration, task.time, task.endTime);
      const startMins = timeToMinutes(startTimeVal);
      const endMins = startMins + durMins;
      setEndTime(task.endTime || minutesToTime(endMins));
      setDuration(task.duration || `${durMins / 60}h`);
      setRepeat(task.repeat || 'once');
      setNotes(task.notes || '');
      setIsLocked(!!task.locked);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleStartTimeChange = (newStartTime: string) => {
    setTime(newStartTime);
    const startM = timeToMinutes(newStartTime);
    const durM = durationToMinutes(duration);
    setEndTime(minutesToTime(startM + durM));
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    const startM = timeToMinutes(time);
    const endM = timeToMinutes(newEndTime);
    if (endM > startM) {
      const diff = endM - startM;
      if (diff % 60 === 0) {
        setDuration(`${diff / 60}h`);
      } else {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setDuration(h > 0 ? `${h}h ${m}m` : `${m}m`);
      }
    }
  };

  const handleDurationPreset = (preset: string) => {
    setDuration(preset);
    const durM = durationToMinutes(preset);
    const startM = timeToMinutes(time);
    setEndTime(minutesToTime(startM + durM));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    zenAudio.playChime();
    const updated: Task = {
      ...task,
      title: title.trim(),
      color,
      dayId,
      dateKey,
      time,
      endTime,
      duration,
      repeat,
      notes: notes.trim(),
      locked: isLocked,
    };
    onSaveTask(updated);
    onClose();
  };

  const handleDelete = () => {
    zenAudio.playChime();
    onDeleteTask(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[10px] z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-title"
        className="relative w-full max-w-[540px] my-auto bg-white dark:bg-[#18191d] rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(27,28,25,0.18)] border border-black/[0.05] dark:border-white/[0.06] transition-all flex flex-col gap-5"
      >
        {/* Top color highlight bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl transition-colors"
          style={{ backgroundColor: color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h2
              id="edit-task-title"
              className="font-headline font-semibold text-lg sm:text-xl text-[#1b1c19] dark:text-white"
            >
              Edit Task
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* 1. Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
              Task Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!task.color || color === getTaskColor(task.title)) {
                  setColor(getTaskColor(nextTitle));
                }
              }}
              placeholder="e.g., Gym, Team meeting, Deep work..."
              className="w-full bg-[#f5f3ee] dark:bg-[#212328] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1b1c19] dark:text-white border border-black/[0.04] dark:border-white/[0.05] focus:outline-none"
              autoFocus
            />
            <span className="text-[10px] text-[#444748] dark:text-[#a1a1aa]">
              Tasks with the same name (case-insensitive) share the same color.
            </span>
          </div>

          {/* 2. Color Swatches */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Task Color
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#444748] dark:text-[#a1a1aa]">{color}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  title="Custom color picker"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {TASK_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-offset-2 ring-[#1b1c19] dark:ring-white dark:ring-offset-[#18191d]'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* 3. Time and Date */}
          <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#f5f3ee]/80 dark:bg-[#212328]/80 border border-black/[0.03] dark:border-white/[0.04]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
              Time & Date
            </span>

            {/* Date Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#444748] dark:text-[#a1a1aa]">
                  Day of the Week
                </label>
                <select
                  value={dayId}
                  onChange={(e) => {
                    const targetDayId = e.target.value as DayId;
                    setDayId(targetDayId);
                    const matched = weekDays.find((d) => d.dayId === targetDayId);
                    if (matched) setDateKey(matched.dateKey);
                  }}
                  className="w-full bg-white dark:bg-[#18191d] px-3 py-2 rounded-lg text-xs font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                >
                  {weekDays.map((d) => (
                    <option key={d.dayId} value={d.dayId}>
                      {d.dayName}, {d.monthName} {d.dayNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#444748] dark:text-[#a1a1aa]">
                  Calendar Date
                </label>
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => {
                    const nextDateKey = e.target.value;
                    setDateKey(nextDateKey);
                    const matched = weekDays.find((d) => d.dateKey === nextDateKey);
                    if (matched) setDayId(matched.dayId);
                  }}
                  className="w-full bg-white dark:bg-[#18191d] px-3 py-2 rounded-lg text-xs font-mono font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                />
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#444748] dark:text-[#a1a1aa]">
                  Start Time
                </label>
                <input
                  type="time"
                  step="1800"
                  value={time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full bg-white dark:bg-[#18191d] px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#444748] dark:text-[#a1a1aa]">
                  End Time
                </label>
                <input
                  type="time"
                  step="1800"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full bg-white dark:bg-[#18191d] px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
                <label className="text-[10px] font-medium text-[#444748] dark:text-[#a1a1aa]">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => handleDurationPreset(e.target.value)}
                  className="w-full bg-white dark:bg-[#18191d] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                >
                  <option value="30m">30 min</option>
                  <option value="45m">45 min</option>
                  <option value="1h">1 hour</option>
                  <option value="1h 30m">1h 30m</option>
                  <option value="2h">2 hours</option>
                  <option value="3h">3 hours</option>
                  <option value="4h">4 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Repeat Option */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
              Repeat
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['once', 'weekly', 'monthly', 'yearly'] as const).map((rep) => (
                <button
                  key={rep}
                  type="button"
                  onClick={() => setRepeat(rep)}
                  className={`py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    repeat === rep
                      ? 'bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] shadow-xs'
                      : 'bg-[#f5f3ee] dark:bg-[#212328] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                  }`}
                >
                  {rep}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
              Description & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details, notes, links, or meeting agenda..."
              rows={3}
              className="w-full bg-[#f5f3ee] dark:bg-[#212328] p-3 rounded-xl text-xs text-[#1b1c19] dark:text-white border border-black/[0.04] dark:border-white/[0.05] focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 6. Lock in place switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#212328]">
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-[20px] ${isLocked ? 'text-[#006b5e] dark:text-[#8df1de]' : 'text-[#747878]'}`}>
                {isLocked ? 'lock' : 'lock_open'}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                  Lock Task in Place
                </span>
                <span className="text-[10px] text-[#444748] dark:text-[#a1a1aa]">
                  {isLocked
                    ? 'Task is locked: cannot be moved via drag and drop'
                    : 'Task is unlocked: can be freely dragged around the week'}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLocked}
              onClick={() => setIsLocked(!isLocked)}
              className={`w-10 h-6 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${
                isLocked ? 'bg-[#006b5e] justify-end' : 'bg-[#e4e2dd] dark:bg-[#2e3036] justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs"></span>
            </button>
          </div>

          {/* Bottom Actions: Remove Task & Save */}
          <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Remove Task</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] font-headline font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
