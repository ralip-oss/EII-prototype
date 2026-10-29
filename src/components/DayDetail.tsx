import React, { useState } from 'react';
import { DayId, Task } from '../types';
import { HOTLINKED_ASSETS } from '../data/initialData';
import { CalendarDay } from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface DayDetailProps {
  selectedDayId: DayId;
  onSelectDay: (dayId: DayId) => void;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onToggleChecklistItem: (taskId: string, itemId: string) => void;
  onAddTask: (task: Partial<Task>) => void;
  onOpenFocusTimer: () => void;
  onNavigateToOverview: () => void;
  weekDays: CalendarDay[];
}

export const DayDetail: React.FC<DayDetailProps> = ({
  selectedDayId,
  onSelectDay,
  tasks,
  onToggleTask,
  onToggleChecklistItem,
  onAddTask,
  onOpenFocusTimer,
  onNavigateToOverview,
  weekDays,
}) => {
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [isCompact, setIsCompact] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [isQuietModeActive, setIsQuietModeActive] = useState(false);
  const [editingIntention, setEditingIntention] = useState(false);
  const [intentionText, setIntentionText] = useState(
    '“Focus on calm deep work before 2 PM. Avoid switching context when reviewing design architecture.”'
  );
  const [focusPillars, setFocusPillars] = useState(['#mindful-pace', '#no-multitask', '#hydrated']);
  const [newPillarInput, setNewPillarInput] = useState('');
  const [showAddPillar, setShowAddPillar] = useState(false);

  const activeDay =
    weekDays.find((d) => d.dayId === selectedDayId) ||
    weekDays[3] ||
    weekDays[0];

  // Filter tasks for this day
  const dayTasks = tasks.filter(
    (t) => t.dateKey === activeDay.dateKey || (!t.dateKey && t.dayId === selectedDayId)
  );
  const totalTasks = dayTasks.length;
  const completedTasks = dayTasks.filter((t) => t.completed).length;
  const todoTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered list
  const filteredTasks = dayTasks.filter((t) => {
    if (filter === 'todo') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleToggleTask = (taskId: string) => {
    zenAudio.playChime();
    onToggleTask(taskId);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onAddTask({
      title: quickInput.trim(),
      dayId: selectedDayId,
      time: '14:30',
      duration: '45m',
      category: 'Focus',
      completed: false,
      status: 'todo',
    });
    setQuickInput('');
    zenAudio.playChime();
  };

  const handleToggleQuietMode = () => {
    const nextState = !isQuietModeActive;
    setIsQuietModeActive(nextState);
    if (nextState) {
      zenAudio.startAmbient('rain', 0.08);
    } else {
      zenAudio.stopAmbient();
    }
  };

  const handleAddPillar = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPillarInput.trim()) {
      const formatted = newPillarInput.trim().startsWith('#')
        ? newPillarInput.trim()
        : `#${newPillarInput.trim()}`;
      setFocusPillars([...focusPillars, formatted]);
      setNewPillarInput('');
      setShowAddPillar(false);
    }
  };

  // SVG ring circumference
  const circumference = 138.23;
  const strokeOffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="flex flex-col w-full max-w-[1340px] mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24">
      {/* Day Selector Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {weekDays.map((d) => {
          const isSelected = d.dayId === selectedDayId;
          const countForDay = tasks.filter(
            (t) => (t.dateKey === d.dateKey || (!t.dateKey && t.dayId === d.dayId)) && t.completed
          ).length;
          const totalForDay = tasks.filter(
            (t) => t.dateKey === d.dateKey || (!t.dateKey && t.dayId === d.dayId)
          ).length;
          return (
            <button
              key={d.dayId}
              onClick={() => onSelectDay(d.dayId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] shadow-xs'
                  : 'bg-[#f0eee9] dark:bg-[#1a1b1e] text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: d.color }}
              ></span>
              <span>{d.shortName} {d.dayNumber}</span>
              <span className="opacity-60 text-[10px]">({countForDay}/{totalForDay})</span>
            </button>
          );
        })}
      </div>

      {/* Top Editorial Header & Day Context */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#444748] dark:text-[#a1a1aa] text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeDay.color }}
            ></span>
            <span className="tracking-widest uppercase font-semibold text-[11px]">
              Week 42 • Autumn Flow
            </span>
            <span className="opacity-40">•</span>
            <span>Tokyo • GMT+9</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-headline font-semibold text-3xl sm:text-4xl text-[#1b1c19] dark:text-[#f2f0ea] tracking-tight">
              {activeDay.dayName}, {activeDay.monthName} {activeDay.dayNumber}
            </h1>
            <span className="font-headline text-xl text-[#444748] dark:text-[#a1a1aa]/70 font-normal">
              Day 0{weekDays.findIndex((d) => d.dayId === activeDay.dayId) + 1}
            </span>
          </div>
          <p className="text-sm text-[#444748] dark:text-[#a1a1aa] max-w-xl leading-relaxed">
            A dedicated sanctuary for focused architecture design and rhythm. Keep interruptions low prior to afternoon focus block.
          </p>
        </div>

        {/* Radial Progress & Quick Stats Card */}
        <div className="flex items-center gap-4 bg-[#f0eee9] dark:bg-[#18191d] p-4 sm:p-5 rounded-2xl border border-black/[0.04] dark:border-white/[0.05] shadow-xs self-start lg:self-auto">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                className="text-[#e4e2dd] dark:text-[#25262c] stroke-current"
                cx="28"
                cy="28"
                fill="transparent"
                r="22"
                strokeWidth="3.2"
              ></circle>
              <circle
                className="stroke-current transition-all duration-700 ease-out"
                style={{ color: activeDay.color }}
                cx="28"
                cy="28"
                fill="transparent"
                r="22"
                strokeDasharray="138.23"
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                strokeWidth="3.6"
              ></circle>
            </svg>
            <span className="absolute font-headline font-bold text-sm text-[#1b1c19] dark:text-white">
              {completionPercentage}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-semibold text-sm sm:text-base text-[#1b1c19] dark:text-white">
              {completedTasks} of {totalTasks} tasks completed
            </span>
            <div className="flex items-center gap-2 text-xs text-[#444748] dark:text-[#a1a1aa] pt-0.5">
              <span className="flex items-center gap-1 font-semibold" style={{ color: activeDay.color }}>
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                On Track
              </span>
              <span>•</span>
              <span>4h 45m scheduled</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Main Layout: Timeline (Left 8 cols) & Zen Context Panels (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
        {/* Timeline Workspace */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          {/* Filter Pills & Time View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f5f3ee] dark:bg-[#18191d] p-2 rounded-2xl border border-black/[0.03] dark:border-white/[0.04] shadow-xs">
            <div className="flex items-center gap-1 bg-white dark:bg-[#212328] p-1 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]" role="tablist">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filter === 'all'
                    ? 'bg-[#eae8e3] dark:bg-[#2e3036] text-[#1b1c19] dark:text-white'
                    : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                }`}
              >
                <span>All</span>
                <span className="bg-[#e4e2dd] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] px-1.5 py-0.2 rounded-full text-[10px]">
                  {totalTasks}
                </span>
              </button>
              <button
                onClick={() => setFilter('todo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filter === 'todo'
                    ? 'bg-[#eae8e3] dark:bg-[#2e3036] text-[#1b1c19] dark:text-white'
                    : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                }`}
              >
                <span>To Do</span>
                <span className="bg-[#e4e2dd] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] px-1.5 py-0.2 rounded-full text-[10px]">
                  {todoTasks}
                </span>
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filter === 'completed'
                    ? 'bg-[#eae8e3] dark:bg-[#2e3036] text-[#1b1c19] dark:text-white'
                    : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white'
                }`}
              >
                <span>Completed</span>
                <span className="bg-[#e4e2dd] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] px-1.5 py-0.2 rounded-full text-[10px]">
                  {completedTasks}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 px-2 sm:px-0">
              <span className="text-xs text-[#444748] dark:text-[#a1a1aa] font-mono">
                Time Scale: 07:00 – 20:00
              </span>
              <div className="h-4 w-px bg-black/[0.08] dark:bg-white/[0.08] hidden sm:block"></div>
              <button
                onClick={() => setIsCompact(!isCompact)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isCompact
                    ? 'bg-[#eae8e3] dark:bg-[#2e3036] text-[#1b1c19] dark:text-white'
                    : 'text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white hover:bg-black/[0.04]'
                }`}
                title="Toggle Compact Mode"
              >
                <span className="material-symbols-outlined text-[18px]">density_small</span>
              </button>
            </div>
          </div>

          {/* Continuous Vertical Timeline */}
          <div className="relative bg-white dark:bg-[#18191d] p-5 sm:p-7 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-5">
            {/* Subtle Vertical Track line */}
            <div className="absolute left-10 sm:left-14 top-10 bottom-10 w-0.5 bg-[#eae8e3] dark:bg-[#25262c] -translate-x-1/2 pointer-events-none"></div>

            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#444748] dark:text-[#a1a1aa]">
                No tasks match this filter. Take a breath and enjoy the open space.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isGym = task.title.toLowerCase().includes('gym');
                const isMeeting = task.title.toLowerCase().includes('meeting');
                const isStudy = task.title.toLowerCase().includes('study');
                const isGroceries = task.title.toLowerCase().includes('groceries');

                return (
                  <article
                    key={task.id}
                    className="group relative flex gap-3 sm:gap-4 items-start transition-all"
                  >
                    {/* Time Column */}
                    <div className="w-12 sm:w-16 shrink-0 pt-3 text-right">
                      <span
                        className={`text-xs font-mono font-medium ${
                          task.status === 'active'
                            ? 'font-bold text-[#006b5e] dark:text-[#8df1de]'
                            : 'text-[#444748] dark:text-[#a1a1aa]'
                        }`}
                      >
                        {task.time}
                      </span>
                    </div>

                    {/* Timeline Interactive Pin */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      aria-label={`Toggle ${task.title}`}
                      className="relative z-10 mt-3 w-7 h-7 rounded-full bg-white dark:bg-[#18191d] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                    >
                      {task.completed ? (
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{
                            color: activeDay.color,
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          check_circle
                        </span>
                      ) : task.status === 'active' ? (
                        <div
                          className="w-3.5 h-3.5 rounded-full animate-pulse"
                          style={{ backgroundColor: activeDay.color }}
                        ></div>
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-[#747878] group-hover:text-[#1b1c19] dark:group-hover:text-white transition-colors">
                          radio_button_unchecked
                        </span>
                      )}
                    </button>

                    {/* Card Content Shell */}
                    <div
                      className={`flex-1 rounded-2xl transition-all relative overflow-hidden ${
                        isCompact ? 'p-3' : 'p-4 sm:p-5'
                      } ${
                        task.status === 'active'
                          ? 'bg-[#f0eee9] dark:bg-[#202126] shadow-xs'
                          : 'bg-[#f5f3ee] dark:bg-[#1c1d22] hover:bg-[#f0eee9] dark:hover:bg-[#23242a]'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {task.status === 'active' && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: activeDay.color }}
                        />
                      )}

                      <div className="flex flex-col gap-2">
                        {/* Title & Badges Header */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <h2
                              className={`font-headline font-semibold text-base sm:text-lg transition-colors ${
                                task.completed
                                  ? 'line-through text-[#444748] dark:text-[#71717a]'
                                  : 'text-[#1b1c19] dark:text-white'
                              }`}
                            >
                              {task.title}
                            </h2>
                            {task.category && (
                              <span className="px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.06] text-[#444748] dark:text-[#a1a1aa] text-[11px] font-semibold">
                                {task.category}
                              </span>
                            )}
                            {task.status === 'active' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#8df1de] text-[#005046] text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                Live
                              </span>
                            )}
                            {isStudy && (
                              <span className="px-2 py-0.5 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] text-[11px] font-semibold">
                                Deep Work
                              </span>
                            )}
                          </div>

                          {/* Meeting Link or Location or Duration */}
                          {task.meetLink && (
                            <a
                              href={task.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#282a30] text-[#1b1c19] dark:text-white hover:opacity-90 text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">videocam</span>
                              <span>Join Meet</span>
                            </a>
                          )}

                          {task.location && !task.meetLink && (
                            <div className="flex items-center gap-1 text-[#444748] dark:text-[#a1a1aa] text-xs">
                              <span className="material-symbols-outlined text-[15px]">
                                {isGym ? 'fitness_center' : isGroceries ? 'storefront' : 'nature_people'}
                              </span>
                              <span>{task.location}</span>
                            </div>
                          )}

                          {isStudy && (
                            <span className="text-xs text-[#444748] dark:text-[#a1a1aa] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">timer</span> 2h block
                            </span>
                          )}

                          {isGroceries && (
                            <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">
                              18:30 – 19:15
                            </span>
                          )}
                        </div>

                        {/* Notes text */}
                        {task.notes && (
                          <p className="text-xs text-[#444748] dark:text-[#a1a1aa] leading-relaxed">
                            {task.notes}
                          </p>
                        )}

                        {/* Meeting Metadata */}
                        {isMeeting && (
                          <div className="flex items-center gap-4 text-[#444748] dark:text-[#a1a1aa] text-xs pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">meeting_room</span> Room 4B
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">schedule</span> 10:00 – 11:00 (60 min)
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">group</span> 6 attendees
                            </span>
                          </div>
                        )}

                        {/* Study Session Subcard */}
                        {isStudy && (
                          <div className="bg-white dark:bg-[#212328] p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.04] shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-start gap-2.5 mt-1">
                            <span
                              className="material-symbols-outlined text-[18px] mt-0.5 shrink-0"
                              style={{ color: activeDay.color }}
                            >
                              menu_book
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                                Review system architecture & design tokens
                              </span>
                              <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">
                                Refactor design tokens for dark theme high-contrast compliance and review API contracts.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Focus Playlist Audio trigger */}
                        {task.focusPlaylist && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">Focus Playlist:</span>
                            <button
                              type="button"
                              onClick={onOpenFocusTimer}
                              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#25262c] text-[#1b1c19] dark:text-white text-xs font-medium flex items-center gap-1.5 shadow-xs hover:text-[#006b5e] dark:hover:text-[#8df1de] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">headphones</span>
                              <span>{task.focusPlaylist}</span>
                            </button>
                          </div>
                        )}

                        {/* Groceries Sub-checklist */}
                        {task.checklist && task.checklist.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1.5 bg-white/80 dark:bg-[#212328]/80 p-3 rounded-xl border border-black/[0.03] dark:border-white/[0.04]">
                            {task.checklist.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center gap-2 text-xs text-[#1b1c19] dark:text-[#f2f0ea] cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.done}
                                  onChange={() => onToggleChecklistItem(task.id, item.id)}
                                  className="w-3.5 h-3.5 rounded text-[#006b5e] accent-[#006b5e] focus:ring-0 cursor-pointer"
                                />
                                <span className={item.done ? 'line-through text-[#444748] dark:text-[#71717a]' : ''}>
                                  {item.text}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Groceries footer item count */}
                        {isGroceries && task.checklist && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-[#444748] dark:text-[#a1a1aa] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">storefront</span> Organic Market on 5th
                            </span>
                            <span className="text-xs font-semibold text-[#006b5e] dark:text-[#8df1de]">
                              {task.checklist.length} items
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Add Task Quick Input Slot */}
          <form
            onSubmit={handleQuickAdd}
            className="w-full bg-[#f5f3ee] dark:bg-[#18191d] p-3 sm:p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.04] flex items-center gap-3 shadow-xs"
          >
            <span className="material-symbols-outlined text-[#444748] dark:text-[#a1a1aa]">
              add_circle
            </span>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder={`Add an intentional task for ${activeDay.dayName}... (press Enter)`}
              className="bg-transparent border-0 outline-none w-full text-sm text-[#1b1c19] dark:text-white placeholder:text-[#444748]/60 dark:placeholder:text-[#a1a1aa]/50"
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#e4e2dd] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa] text-[10px] font-mono shadow-xs">
              Cmd + K
            </kbd>
          </form>
        </section>

        {/* Sidebar: Intentions, Energy Meter, Workspace Ambience, Weekly Cadence */}
        <aside className="lg:col-span-4 flex flex-col gap-5">
          {/* Daily Intention Card */}
          <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006b5e] dark:text-[#8df1de]">
                  lightbulb
                </span>
                <h2 className="font-headline font-semibold text-base text-[#1b1c19] dark:text-white">
                  Daily Intention
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingIntention(!editingIntention)}
                className="text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white p-1 rounded-full transition-colors"
                title="Edit Note"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {editingIntention ? 'check' : 'edit'}
                </span>
              </button>
            </div>

            {editingIntention ? (
              <textarea
                value={intentionText}
                onChange={(e) => setIntentionText(e.target.value)}
                className="w-full bg-[#f5f3ee] dark:bg-[#212328] p-3 rounded-xl text-xs text-[#1b1c19] dark:text-white border border-black/[0.06] focus:outline-none"
                rows={3}
              />
            ) : (
              <div className="bg-[#f5f3ee] dark:bg-[#1f2025] p-3.5 rounded-xl border border-black/[0.02] dark:border-white/[0.02]">
                <p className="text-xs text-[#1b1c19] dark:text-[#f2f0ea] italic leading-relaxed">
                  {intentionText}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                  Focus Pillars
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddPillar(!showAddPillar)}
                  className="text-[10px] text-[#006b5e] dark:text-[#8df1de] font-semibold hover:underline"
                >
                  + Add
                </button>
              </div>

              {showAddPillar && (
                <form onSubmit={handleAddPillar} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newPillarInput}
                    onChange={(e) => setNewPillarInput(e.target.value)}
                    placeholder="#hydrate"
                    className="flex-1 bg-[#f0eee9] dark:bg-[#212328] px-2.5 py-1 rounded-lg text-xs outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#006b5e] text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </form>
              )}

              <div className="flex flex-wrap gap-1.5">
                {focusPillars.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#f0eee9] dark:bg-[#25262c] text-[#1b1c19] dark:text-white text-xs font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Energy Curve Tracker Widget */}
          <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#006b5e] dark:text-[#8df1de]">
                  bolt
                </span>
                <h2 className="font-headline font-semibold text-base text-[#1b1c19] dark:text-white">
                  Energy Curve
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#006b5e] dark:text-[#8df1de]">
                Peak: 10am - 2pm
              </span>
            </div>

            {/* Sparkline curve */}
            <div className="pt-2">
              <div className="flex items-end justify-between h-20 gap-1.5 px-2 bg-[#f5f3ee] dark:bg-[#1f2025] rounded-xl py-2">
                {[
                  { hour: '08h', height: '60%', opacity: '0.4' },
                  { hour: '10h', height: '88%', opacity: '0.8' },
                  { hour: '12h', height: '95%', opacity: '1.0' },
                  { hour: '14h', height: '80%', opacity: '0.85' },
                  { hour: '16h', height: '55%', opacity: '0.5' },
                  { hour: '18h', height: '40%', opacity: '0.35' },
                  { hour: '20h', height: '25%', opacity: '0.2' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className="w-full rounded-t transition-all group-hover:opacity-100 bg-[#006b5e] dark:bg-[#8df1de]"
                      style={{
                        height: bar.height,
                        opacity: bar.opacity,
                      }}
                    ></div>
                    <span className="text-[10px] text-[#444748] dark:text-[#a1a1aa] font-mono">
                      {bar.hour}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#444748] dark:text-[#a1a1aa] pt-1">
              <span>Optimal focus windows identified</span>
              <span className="font-semibold text-[#1b1c19] dark:text-white">3.5 hrs deep</span>
            </div>
          </div>

          {/* Workspace Ambience (Rich Visual & Ambient Audio Switch) */}
          <div className="relative bg-white dark:bg-[#18191d] rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06] shadow-xs overflow-hidden flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#444748] dark:text-[#a1a1aa] text-xs">
                <span className="material-symbols-outlined text-[16px]">wb_twilight</span>
                <span>Workspace Ambience</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-xs text-[#1b1c19] dark:text-white font-medium">
                Oct 16
              </span>
            </div>

            {/* Photo Card with Zen overlay */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-xs group">
              <img
                src={HOTLINKED_ASSETS.workspaceAmbience}
                alt="Mindful Workspace bathed in autumn sunlight"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
                <span className="font-headline font-semibold text-sm">Mindful Space</span>
                <button
                  type="button"
                  onClick={handleToggleQuietMode}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    isQuietModeActive
                      ? 'bg-[#8df1de] text-[#005046]'
                      : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {isQuietModeActive ? 'volume_up' : 'volume_off'}
                  </span>
                  <span>{isQuietModeActive ? 'Quiet Mode On' : 'Quiet Mode'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-[#444748] dark:text-[#a1a1aa] italic leading-relaxed">
              &ldquo;In stillness, rhythm emerges. Tackle one complex system problem per day.&rdquo;
            </p>
          </div>

          {/* Weekly Cadence Micro Strip */}
          <div className="bg-[#f0eee9] dark:bg-[#18191d] p-5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Weekly Cadence
              </span>
              <button
                type="button"
                onClick={onNavigateToOverview}
                className="text-xs text-[#006b5e] dark:text-[#8df1de] font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Full Week</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center pt-1">
              {weekDays.map((d) => {
                const isCurrent = d.dayId === selectedDayId;
                const isPast = d.dayNumber < activeDay.dayNumber;
                return (
                  <button
                    key={d.dayId}
                    onClick={() => onSelectDay(d.dayId)}
                    className={`flex flex-col items-center p-1.5 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-white dark:bg-[#25262c] shadow-xs font-bold'
                        : 'hover:bg-white/60 dark:hover:bg-[#25262c]/50'
                    }`}
                  >
                    <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">{d.shortName[0]}</span>
                    {isPast ? (
                      <span className="material-symbols-outlined text-[#006b5e] dark:text-[#8df1de] text-[14px] mt-0.5">
                        check
                      </span>
                    ) : isCurrent ? (
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-[#006b5e] dark:bg-[#8df1de]"></span>
                    ) : (
                      <span className="text-[#444748] dark:text-[#a1a1aa] text-[10px] mt-0.5">•</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
