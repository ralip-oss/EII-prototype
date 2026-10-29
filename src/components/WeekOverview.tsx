import React, { useState, useEffect, useRef } from 'react';
import { DayId, Task } from '../types';
import {
  CalendarDay,
  HALF_HOUR_SLOTS,
  timeToMinutes,
  minutesToTime,
  durationToMinutes,
  getTaskColor,
  getMonthGrid,
} from '../utils/dateUtils';
import { EditTaskModal } from './EditTaskModal';
import { zenAudio } from '../utils/audio';

interface WeekOverviewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectDay: (dayId: DayId, dateKey?: string) => void;
  onOpenAddTask: (defaultDay?: DayId) => void;
  weekDays: CalendarDay[];
  anchorIntention: string;
  onUpdateAnchorIntention: (val: string) => void;
}

const SLOT_HEIGHT = 28; // 28px per 30-min slot (1 hour = 56px)

export const WeekOverview: React.FC<WeekOverviewProps> = ({
  tasks,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onSelectDay,
  onOpenAddTask,
  weekDays,
  anchorIntention,
  onUpdateAnchorIntention,
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [tempIntention, setTempIntention] = useState(anchorIntention);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ dayId: DayId; slot: string } | null>(null);

  // Month navigation state
  const activeYear = weekDays[3]?.year || 2026;
  const activeMonthIdx = weekDays[3]?.date.getMonth() || 9;
  const [monthOffset, setMonthOffset] = useState(0);

  const displayMonthDate = new Date(activeYear, activeMonthIdx + monthOffset, 1);
  const monthData = getMonthGrid(displayMonthDate.getFullYear(), displayMonthDate.getMonth());

  // Scroll container ref to auto-scroll to morning hours (07:30)
  const scheduleScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (viewMode === 'week' && scheduleScrollRef.current) {
      // 07:30 is index 15 (15 * 28px = 420px)
      scheduleScrollRef.current.scrollTop = 420;
    }
  }, [viewMode]);

  // Overall stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (task.locked) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTarget(null);
  };

  const handleDragOverSlot = (e: React.DragEvent, dayId: DayId, slot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverTarget || dragOverTarget.dayId !== dayId || dragOverTarget.slot !== slot) {
      setDragOverTarget({ dayId, slot });
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, day: CalendarDay, slot: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverTarget(null);
    setDraggedTaskId(null);

    if (!taskId) return;
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.locked) return;

    zenAudio.playChime();

    // Preserve duration or calculate end time
    const durMins = durationToMinutes(taskToMove.duration, taskToMove.time, taskToMove.endTime);
    const newStartMins = timeToMinutes(slot);
    const newEndMins = newStartMins + durMins;
    const newEndTime = minutesToTime(newEndMins);

    const updated: Task = {
      ...taskToMove,
      dayId: day.dayId,
      dateKey: day.dateKey,
      time: slot,
      endTime: newEndTime,
    };
    onUpdateTask(updated);
  };

  const handleToggleLock = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    zenAudio.playChime();
    onUpdateTask({
      ...task,
      locked: !task.locked,
    });
  };

  const handleOpenEdit = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleCheckboxClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    zenAudio.playChime();
    onToggleTask(taskId);
  };

  return (
    <div className="flex flex-col w-full max-w-[1440px] mx-auto px-3 sm:px-6 md:px-8 pb-20">
      {/* Top Pacing & Mood Header */}
      <div className="w-full flex flex-col md:flex-row md:items-end justify-between pt-5 pb-6 gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#444748] dark:text-[#a1a1aa] text-[11px] font-semibold uppercase tracking-widest">
            <span>Cycle 42</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#006b5e] dark:bg-[#8df1de]"></span>
            <span>Autumn Rhythm</span>
          </div>
          <h1 className="font-headline font-semibold text-2xl sm:text-3xl tracking-tight text-[#1b1c19] dark:text-[#f2f0ea]">
            {viewMode === 'week' ? 'Week at a Glance' : 'Month at a Glance'}
          </h1>
        </div>

        {/* Pacing status & Interchangeable Week | Month Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#f0eee9] dark:bg-[#1a1b1e] px-3.5 py-1.5 rounded-full border border-black/[0.03] dark:border-white/[0.04]">
            <div className="w-2 h-2 rounded-full bg-[#006b5e] dark:bg-[#8df1de] animate-pulse"></div>
            <span className="text-xs font-medium text-[#1b1c19] dark:text-[#e4e2dd]">
              {completedTasks} of {totalTasks} focus blocks complete
            </span>
          </div>

          {/* Interchangeable button: Week | Month */}
          <div className="flex items-center p-1 bg-[#eae8e3] dark:bg-[#25262c] rounded-full border border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-[#18191d] text-[#1b1c19] dark:text-white shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#18191d] text-[#1b1c19] dark:text-white shadow-xs'
                  : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE: WEEK (Time on Left Side, 30m intervals 00:00 to 23:30, Hour lines through all days, flush blocks) */}
      {viewMode === 'week' && (
        <div className="w-full overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
          {/* Unified Full Week Box */}
          <div className="min-w-[1020px] lg:min-w-0 w-full bg-white dark:bg-[#18191d] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_4px_24px_-2px_rgba(26,26,26,0.04)] overflow-hidden flex flex-col">
            {/* Top Bar of the Box: Days Header (Days on top bar: Monday, Oct 12 | Tuesday, Oct 13 | ...) */}
            <div className="grid grid-cols-[76px_repeat(7,1fr)] border-b border-black/[0.08] dark:border-white/[0.1] bg-[#fbf9f4] dark:bg-[#141518] sticky top-0 z-20">
              {/* Left Column: Time Header */}
              <div className="p-3 flex items-center justify-center font-headline font-semibold text-xs text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider border-r border-black/[0.08] dark:border-white/[0.1] bg-[#f5f3ee] dark:bg-[#1b1c20]">
                Time
              </div>

              {/* 7 Days of the Week: Clean, neutral without day-color coding */}
              {weekDays.map((day, idx) => {
                const dayTasks = tasks.filter(
                  (t) => t.dateKey === day.dateKey || (!t.dateKey && t.dayId === day.dayId)
                );
                const doneCount = dayTasks.filter((t) => t.completed).length;

                return (
                  <div
                    key={day.dayId}
                    onClick={() => onSelectDay(day.dayId, day.dateKey)}
                    className={`relative p-3 flex flex-col justify-between gap-1 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                      idx < 6 ? 'border-r border-black/[0.08] dark:border-white/[0.1]' : ''
                    } ${day.isToday ? 'bg-[#006b5e]/[0.04] dark:bg-[#8df1de]/[0.04]' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      {/* Responsive format: "Monday, Oct 12" / "Mon, Oct 12" if cropped */}
                      <span className="font-headline font-semibold text-xs sm:text-sm text-[#1b1c19] dark:text-[#f2f0ea] truncate">
                        <span className="hidden xl:inline">{day.dayName}</span>
                        <span className="xl:hidden">{day.shortName}</span>, {day.monthName} {day.dayNumber}
                      </span>

                      <span className="text-[10px] font-mono text-[#444748] dark:text-[#a1a1aa] shrink-0">
                        {doneCount}/{dayTasks.length}
                      </span>
                    </div>

                    {/* Today Badge */}
                    {day.isToday ? (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006b5e] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006b5e]"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#006b5e] dark:text-[#8df1de]">
                          Today
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#444748]/70 dark:text-[#a1a1aa]/70 font-mono">
                        {day.shortName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scrollable Schedule Grid: 00:00 to 23:30 (48 slots) */}
            <div
              ref={scheduleScrollRef}
              className="relative max-h-[660px] overflow-y-auto scrollbar-none"
            >
              <div
                className="grid grid-cols-[76px_repeat(7,1fr)] relative"
                style={{ height: `${HALF_HOUR_SLOTS.length * SLOT_HEIGHT}px` }}
              >
                {/* Left Side: Time Column (00:00 to 23:30 in 30-min intervals) */}
                <div className="relative border-r border-black/[0.08] dark:border-white/[0.1] bg-[#fbf9f4]/80 dark:bg-[#141518]/80 select-none">
                  {HALF_HOUR_SLOTS.map((slot, index) => {
                    const isHour = slot.endsWith(':00');
                    return (
                      <div
                        key={slot}
                        style={{
                          top: `${index * SLOT_HEIGHT}px`,
                          height: `${SLOT_HEIGHT}px`,
                        }}
                        className={`absolute left-0 right-0 flex items-center justify-end pr-2.5 font-mono ${
                          isHour
                            ? 'border-b border-black/[0.14] dark:border-white/[0.16] text-xs font-semibold text-[#1b1c19] dark:text-[#f2f0ea]'
                            : 'border-b border-dashed border-black/[0.06] dark:border-white/[0.08] text-[10px] text-[#747878] dark:text-[#a1a1aa]'
                        }`}
                      >
                        <span>{slot}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 7 Day Columns with Continuous Horizontal Lines Every Hour & Flush Task Blocks */}
                {weekDays.map((day, colIdx) => {
                  const dayTasks = tasks.filter(
                    (t) => t.dateKey === day.dateKey || (!t.dateKey && t.dayId === day.dayId)
                  );

                  return (
                    <div
                      key={day.dayId}
                      className={`relative ${
                        colIdx < 6 ? 'border-r border-black/[0.08] dark:border-white/[0.1]' : ''
                      } ${day.isToday ? 'bg-[#006b5e]/[0.015]' : ''}`}
                    >
                      {/* Background Grid Lines across the day column:
                          - Solid line every hour (:00)
                          - Subtle dashed line every half-hour (:30)
                          - Interactive drop targets for dragging tasks */}
                      {HALF_HOUR_SLOTS.map((slot, slotIndex) => {
                        const isHour = slot.endsWith(':00');
                        const isTarget =
                          dragOverTarget?.dayId === day.dayId && dragOverTarget?.slot === slot;

                        return (
                          <div
                            key={slot}
                            onDragOver={(e) => handleDragOverSlot(e, day.dayId, slot)}
                            onDrop={(e) => handleDropOnSlot(e, day, slot)}
                            style={{
                              top: `${slotIndex * SLOT_HEIGHT}px`,
                              height: `${SLOT_HEIGHT}px`,
                            }}
                            className={`absolute left-0 right-0 transition-colors ${
                              isHour
                                ? 'border-b border-black/[0.14] dark:border-white/[0.16]'
                                : 'border-b border-dashed border-black/[0.06] dark:border-white/[0.08]'
                            } ${
                              isTarget
                                ? 'bg-[#006b5e]/25 ring-2 ring-inset ring-[#006b5e] z-20'
                                : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.015]'
                            }`}
                          >
                            {isTarget && (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-[#006b5e] dark:text-[#8df1de]">
                                Drop at {slot}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Positioned Task Blocks Touching Column Sides, Tops, and Bottoms */}
                      {dayTasks.map((task) => {
                        const startMin = timeToMinutes(task.time || '09:00');
                        const durMin = durationToMinutes(task.duration, task.time, task.endTime);
                        const topPx = (startMin / 30) * SLOT_HEIGHT;
                        const heightPx = Math.max(SLOT_HEIGHT, (durMin / 30) * SLOT_HEIGHT);
                        // Tasks with the same name (case-insensitive) share the same color
                        const taskColor = getTaskColor(task.title, task.color);
                        const isDraggingCurrent = draggedTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable={!task.locked}
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onSelectDay(day.dayId, day.dateKey)}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            className={`absolute left-0 right-0 w-full group/task cursor-pointer transition-shadow z-10 px-2 py-1.5 flex flex-col justify-between overflow-hidden border-b border-black/[0.12] dark:border-white/[0.15] bg-white dark:bg-[#1e1f24] hover:shadow-lg hover:z-30 select-none ${
                              draggedTaskId ? (isDraggingCurrent ? 'opacity-40 scale-98' : 'pointer-events-none') : ''
                            } ${
                              task.locked
                                ? 'cursor-default ring-1 ring-black/10 dark:ring-white/10'
                                : 'cursor-grab active:cursor-grabbing'
                            } ${task.completed ? 'opacity-70' : ''}`}
                          >
                            {/* Color highlight bar at the TOP of the box (touching both sides) */}
                            <div
                              className="absolute top-0 left-0 right-0 h-1.5 transition-colors z-10"
                              style={{ backgroundColor: taskColor }}
                            />

                            {/* Task Content Header */}
                            <div className="flex items-start justify-between gap-1 pt-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {/* Checkbox */}
                                <button
                                  type="button"
                                  onClick={(e) => handleCheckboxClick(task.id, e)}
                                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    task.completed
                                      ? 'text-white'
                                      : 'border-[1.5px] border-[#747878] group-hover/task:border-current'
                                  }`}
                                  style={task.completed ? { backgroundColor: taskColor } : {}}
                                >
                                  {task.completed && (
                                    <span className="material-symbols-outlined text-[10px] font-bold">
                                      check
                                    </span>
                                  )}
                                </button>

                                <span
                                  className={`text-xs font-semibold truncate ${
                                    task.completed
                                      ? 'line-through text-[#444748] dark:text-[#71717a]'
                                      : 'text-[#1b1c19] dark:text-white'
                                  }`}
                                >
                                  {task.title}
                                </span>

                                {/* Locked subtle badge if task is locked */}
                                {task.locked && (
                                  <span
                                    className="material-symbols-outlined text-[13px] text-[#006b5e] dark:text-[#8df1de] shrink-0 opacity-80"
                                    title="Locked in place"
                                  >
                                    lock
                                  </span>
                                )}
                              </div>

                              {/* Hover Action Icons:
                                  1. Lock icon (shows closed lock if locked, open lock if unlocked)
                                  2. Three dots icon (opens Edit / Remove task modal) */}
                              <div className="opacity-0 group-hover/task:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity bg-white/95 dark:bg-[#1e1f24]/95 p-0.5 rounded-md shadow-sm border border-black/[0.06] dark:border-white/[0.08] z-20">
                                {/* Lock Toggle Icon */}
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleLock(e, task)}
                                  title={task.locked ? 'Task Locked (click to unlock)' : 'Task Unlocked (click to lock in place)'}
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                    task.locked
                                      ? 'text-[#006b5e] dark:text-[#8df1de] hover:bg-black/[0.06]'
                                      : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.06]'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    {task.locked ? 'lock' : 'lock_open'}
                                  </span>
                                </button>

                                {/* Three dots (Edit / Remove) */}
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEdit(e, task)}
                                  title="Edit or Remove task"
                                  className="w-5 h-5 rounded flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.06] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    more_horiz
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Task Footer: Time Range & Details */}
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748] dark:text-[#a1a1aa] pt-0.5">
                              <span>
                                {task.time} – {task.endTime || minutesToTime(startMin + durMin)}
                              </span>
                              {task.category && (
                                <span className="px-1 py-0.2 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[9px] font-semibold uppercase tracking-wider">
                                  {task.category}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: MONTH (Monthly Calendar Grid) */}
      {viewMode === 'month' && (
        <div className="w-full bg-white dark:bg-[#18191d] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_4px_24px_-2px_rgba(26,26,26,0.04)] p-4 sm:p-6 flex flex-col gap-5">
          {/* Month Header with Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="font-headline font-semibold text-xl text-[#1b1c19] dark:text-white">
                {monthData.monthName} {monthData.year}
              </span>
              <span className="text-xs text-[#444748] dark:text-[#a1a1aa] font-medium">
                {tasks.length} tasks scheduled this period
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMonthOffset((prev) => prev - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors"
                title="Previous month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => setMonthOffset(0)}
                className="px-2.5 py-1 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-xs font-semibold text-[#1b1c19] dark:text-white"
              >
                Current Month
              </button>
              <button
                type="button"
                onClick={() => setMonthOffset((prev) => prev + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-[#f0eee9] dark:hover:bg-[#25262c] transition-colors"
                title="Next month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Month Days 7-Col Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {monthData.days.map((mDay) => {
              const dayTasks = tasks.filter((t) => t.dateKey === mDay.dateKey);
              const doneCount = dayTasks.filter((t) => t.completed).length;

              return (
                <div
                  key={mDay.dateKey}
                  onClick={() => onSelectDay(mDay.dayId, mDay.dateKey)}
                  className={`min-h-[96px] sm:min-h-[114px] p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative group ${
                    mDay.isToday
                      ? 'bg-[#006b5e]/10 dark:bg-[#8df1de]/15 border-[#006b5e]/40 shadow-xs'
                      : mDay.isCurrentMonth
                      ? 'bg-[#fbf9f4]/70 dark:bg-[#202126]/70 hover:bg-[#f5f3ee] dark:hover:bg-[#24262d] border-black/[0.05] dark:border-white/[0.06]'
                      : 'bg-black/[0.01] dark:bg-white/[0.01] opacity-40 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-headline text-xs sm:text-sm font-semibold ${
                        mDay.isToday
                          ? 'text-[#006b5e] dark:text-[#8df1de] font-bold'
                          : 'text-[#1b1c19] dark:text-[#f2f0ea]'
                      }`}
                    >
                      {mDay.dayNumber}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono text-[#444748] dark:text-[#a1a1aa]">
                        {doneCount}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Pills in Month Cell */}
                  <div className="flex flex-col gap-1 my-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((t) => {
                      const tColor = getTaskColor(t.title, t.color);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] truncate bg-white/80 dark:bg-black/40 border border-black/[0.04] dark:border-white/[0.05]"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: tColor }}
                          />
                          <span
                            className={`truncate ${
                              t.completed ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] text-[#747878] dark:text-[#a1a1aa] font-medium pl-1">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] dark:border-white/[0.03]">
                    <span className="text-[9px] uppercase tracking-wider text-[#747878] dark:text-[#a1a1aa]">
                      {mDay.dayId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddTask(mDay.dayId);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-[#444748] hover:text-[#1b1c19] dark:text-[#a1a1aa] dark:hover:text-white transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Anchor Intention Card */}
      <div className="w-full mt-6 bg-white dark:bg-[#18191d] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#006b5e]/10 dark:bg-[#8df1de]/10 flex items-center justify-center text-[#006b5e] dark:text-[#8df1de] shrink-0">
            <span className="material-symbols-outlined text-[22px]">self_improvement</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006b5e] dark:text-[#8df1de]">
                Anchor Intention
              </span>
              <span className="text-xs text-[#747878]">•</span>
              <span className="text-xs text-[#747878] dark:text-[#a1a1aa]">Week 42</span>
            </div>
            {isEditingIntention ? (
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="text"
                  value={tempIntention}
                  onChange={(e) => setTempIntention(e.target.value)}
                  className="bg-[#f5f3ee] dark:bg-[#212328] px-3 py-1.5 rounded-lg text-sm font-serif italic text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none w-full sm:w-[480px]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateAnchorIntention(tempIntention);
                      setIsEditingIntention(false);
                      zenAudio.playChime();
                    }}
                    className="px-3 py-1 rounded-lg bg-[#006b5e] text-white text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempIntention(anchorIntention);
                      setIsEditingIntention(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-[#f0eee9] dark:bg-[#25262c] text-xs font-medium text-[#444748] dark:text-[#a1a1aa]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-serif italic text-sm text-[#1b1c19] dark:text-[#e4e2dd] max-w-3xl leading-relaxed">
                “{anchorIntention}”
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isEditingIntention) {
              setTempIntention(anchorIntention);
              setIsEditingIntention(true);
            }
          }}
          className="text-xs font-semibold text-[#006b5e] dark:text-[#8df1de] hover:underline flex items-center gap-0.5 shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          <span>{isEditingIntention ? 'Editing...' : 'Refine Intention'}</span>
        </button>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSaveTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        weekDays={weekDays}
      />
    </div>
  );
};
