import React, { useState, useMemo } from 'react';
import { Task, ReflectionEntry, MicroVictory, HabitStick } from '../types';
import {
  INITIAL_REFLECTION,
  INITIAL_MICRO_VICTORIES,
  HOTLINKED_ASSETS,
} from '../data/initialData';
import { CalendarDay, formatWeekRange, durationToMinutes } from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface WeeklyReviewProps {
  tasks: Task[];
  weekDays: CalendarDay[];
  habitSticks?: HabitStick[];
  onRollTasksToNextWeek?: (tasks: Task[]) => void;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({
  tasks,
  weekDays,
  habitSticks = [],
}) => {
  // Pending uncompleted activities from the active tasks list
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const [rolloverTasks, setRolloverTasks] = useState<Task[]>([]);
  const [reflection, setReflection] = useState<ReflectionEntry>(INITIAL_REFLECTION);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [tempReflectionText, setTempReflectionText] = useState(reflection.answer);
  const [microVictories, setMicroVictories] = useState<MicroVictory[]>(INITIAL_MICRO_VICTORIES);
  const [newVictoryText, setNewVictoryText] = useState('');
  const [showAddVictory, setShowAddVictory] = useState(false);
  const [isRollingAll, setIsRollingAll] = useState(false);
  const [rollSuccessMessage, setRollSuccessMessage] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Keep rollover synced with pending tasks when tasks change
  React.useEffect(() => {
    setRolloverTasks(pendingTasks);
  }, [pendingTasks]);

  const rangeLabel = formatWeekRange(weekDays);

  // 100% Dynamic Metrics calculated from actual tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Daily velocity for each of the 7 days
  const { dailyVelocityPcts, busiestDay, busiestDayCount, busiestDayHours } = useMemo(() => {
    const vMap: Record<string, number> = {};
    let bDay = weekDays[0];
    let bCount = 0;
    let bMins = 0;

    weekDays.forEach((d) => {
      const dayTasks = tasks.filter(
        (t) => t.dateKey === d.dateKey || (!t.dateKey && t.dayId === d.dayId)
      );
      const done = dayTasks.filter((t) => t.completed).length;
      vMap[d.dayId] = dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0;

      if (dayTasks.length > bCount) {
        bCount = dayTasks.length;
        bDay = d;
      }
    });

    if (bCount > 0) {
      const bDayTasks = tasks.filter(
        (t) => t.dateKey === bDay.dateKey || (!t.dateKey && t.dayId === bDay.dayId)
      );
      bMins = bDayTasks.reduce(
        (acc, t) => acc + durationToMinutes(t.duration, t.time, t.endTime),
        0
      );
    }

    return {
      dailyVelocityPcts: vMap,
      busiestDay: bDay,
      busiestDayCount: bCount,
      busiestDayHours: (bMins / 60).toFixed(1),
    };
  }, [tasks, weekDays]);

  // Habit consistency calculation
  const habitConsistency = useMemo(() => {
    if (!habitSticks || habitSticks.length === 0) return 0;
    const totalSlots = habitSticks.length * 7;
    let doneSlots = 0;
    habitSticks.forEach((h) => {
      Object.values(h.completedDays || {}).forEach((v) => {
        if (v) doneSlots++;
      });
    });
    return Math.round((doneSlots / totalSlots) * 100);
  }, [habitSticks]);

  const toggleRolloverDone = (id: string) => {
    zenAudio.playChime();
    setRolloverTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleRollSingle = (id: string) => {
    zenAudio.playChime();
    setRolloverTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRollAll = () => {
    setIsRollingAll(true);
    zenAudio.playChime();
    setTimeout(() => {
      setIsRollingAll(false);
      setRollSuccessMessage('All pending activities queued for Next Monday');
      setTimeout(() => {
        setRolloverTasks([]);
      }, 700);
    }, 500);
  };

  const handleSaveReflection = () => {
    setReflection((prev) => ({ ...prev, answer: tempReflectionText }));
    setIsEditingReflection(false);
    zenAudio.playChime();
  };

  const handleAddVictory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVictoryText.trim()) return;
    setMicroVictories([
      ...microVictories,
      {
        id: `mv-${Date.now()}`,
        day: 'Sun',
        text: newVictoryText.trim(),
        color: '#D9669A',
      },
    ]);
    setNewVictoryText('');
    setShowAddVictory(false);
    zenAudio.playChime();
  };

  const handleArchiveSummary = () => {
    const summary = `Weekly Review Summary (${rangeLabel})
- ${completedTasks} of ${totalTasks} activities completed (${completionPercentage}%)
- Pacing: ${totalTasks === 0 ? 'Clear Schedule' : completionPercentage >= 80 ? 'Optimal Flow' : 'Steady Momentum'}
- Stickies Consistency: ${habitConsistency}%
- Busiest Day: ${totalTasks > 0 ? `${busiestDay.dayName} (${busiestDayCount} blocks, ${busiestDayHours}h)` : 'None'}
- Reflection: ${reflection.answer}
    `;
    navigator.clipboard?.writeText(summary);
    setCopiedSummary(true);
    zenAudio.playChime();
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="flex flex-col w-full max-w-[1340px] mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 gap-8">
      {/* Top Editorial Header & Ambient Indicator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#006b5e] dark:bg-[#8df1de]"></span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#444748] dark:text-[#a1a1aa]">
              Retrospective · Rhythm Calm
            </span>
          </div>
          <h1 className="font-headline font-semibold text-3xl sm:text-4xl text-[#1b1c19] dark:text-[#f2f0ea] tracking-tight">
            Weekly Review
          </h1>
          <p className="text-base text-[#444748] dark:text-[#a1a1aa]">
            <span className="font-serif font-normal">{rangeLabel}</span> <span className="mx-2 opacity-40">/</span>
            <span className="text-[#1b1c19] dark:text-white font-semibold">
              {' '}{completedTasks} of {totalTasks} activities completed{' '}
            </span>
            <span className="text-[#006b5e] dark:text-[#8df1de] font-semibold">
              ({completionPercentage}%)
            </span>
          </p>
        </div>

        {/* Action Pill and Summary Button */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full bg-[#f0eee9] dark:bg-[#18191d] border border-black/[0.04] dark:border-white/[0.05] flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[#006b5e] dark:text-[#8df1de] text-[18px]">
              spa
            </span>
            <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
              Pacing: {totalTasks === 0 ? 'Clear Baseline' : completionPercentage >= 80 ? 'Optimal Flow' : 'Steady Pacing'}
            </span>
          </div>

          <button
            onClick={handleArchiveSummary}
            type="button"
            className="px-4 py-1.5 rounded-full bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedSummary ? 'check' : 'file_download'}
            </span>
            <span>{copiedSummary ? 'Copied Summary' : 'Archive Summary'}</span>
          </button>
        </div>
      </div>

      {/* 7-Day Visual Velocity Strip */}
      <div className="w-full bg-white dark:bg-[#18191d] rounded-2xl p-5 sm:p-7 border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-headline font-semibold text-base sm:text-lg text-[#1b1c19] dark:text-white">
              Daily Velocity
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa]">
              Seven-Day Horizon
            </span>
          </div>
          <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">
            Target: 80% daily baseline
          </span>
        </div>

        {/* Days Grid with Velocity Bars */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 md:gap-6 pt-3">
          {weekDays.map((d) => {
            const pct = dailyVelocityPcts[d.dayId] || 0;
            const isPeak = totalTasks > 0 && d.dayId === busiestDay.dayId && busiestDayCount > 0;
            return (
              <div key={d.dayId} className="flex flex-col items-center gap-2 group">
                <div
                  className={`w-full h-44 rounded-xl p-1.5 flex flex-col justify-end relative overflow-hidden transition-all ${
                    isPeak
                      ? 'bg-[#eae8e3] dark:bg-[#25262c] shadow-xs'
                      : 'bg-[#f5f3ee] dark:bg-[#1f2025]'
                  }`}
                >
                  <div
                    className="w-full rounded-lg transition-all duration-700 ease-out"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: pct > 0 ? d.color : 'transparent',
                    }}
                  />
                  <span
                    className={`absolute top-2 left-0 right-0 text-center text-xs font-semibold ${
                      isPeak
                        ? 'text-[#1b1c19] dark:text-white font-bold'
                        : 'text-[#444748] dark:text-[#a1a1aa]'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-0.5">
                    <span className={`text-xs font-semibold ${isPeak ? 'font-bold' : ''}`}>
                      {d.shortName}
                    </span>
                    {isPeak && (
                      <span
                        className="material-symbols-outlined text-[13px]"
                        style={{ color: d.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa] font-mono">
                    {d.dayNumber}
                  </span>
                </div>

                {isPeak ? (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${d.color}25`,
                      color: d.color,
                    }}
                  >
                    Peak
                  </span>
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Tasks Completed */}
        <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
              Activities Completed
            </span>
            <div className="w-8 h-8 rounded-full bg-[#006b5e]/10 dark:bg-[#8df1de]/10 flex items-center justify-center text-[#006b5e] dark:text-[#8df1de]">
              <span className="material-symbols-outlined text-[18px]">done_all</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-[#1b1c19] dark:text-white">
              {completedTasks}
            </span>
            <span className="text-base text-[#444748] dark:text-[#a1a1aa]">/ {totalTasks}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#006b5e] dark:text-[#8df1de] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>{completionPercentage}% complete</span>
            <span className="text-[#444748] dark:text-[#a1a1aa] font-normal ml-1">
              · {totalTasks === 0 ? 'Clear week' : `${totalTasks - completedTasks} left`}
            </span>
          </div>
        </div>

        {/* Metric 2: Busiest Day */}
        <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
              Busiest Day
            </span>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: totalTasks > 0 ? busiestDay.color : '#a1a1aa' }}
            ></div>
          </div>
          <div className="my-4 flex flex-col">
            <span className="font-headline font-bold text-2xl sm:text-3xl text-[#1b1c19] dark:text-white">
              {totalTasks > 0 ? busiestDay.dayName : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#444748] dark:text-[#a1a1aa]">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: totalTasks > 0 ? busiestDay.color : '#a1a1aa' }}
            ></span>
            <span>{totalTasks > 0 ? `${busiestDayCount} scheduled blocks` : '0 scheduled blocks'}</span>
            <span className="opacity-40">·</span>
            <span className="text-[#1b1c19] dark:text-white font-medium">
              {totalTasks > 0 ? `${busiestDayHours} hrs focus time` : '0 hrs focus time'}
            </span>
          </div>
        </div>

        {/* Metric 3: Habit Consistency */}
        <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
              Stickies Consistency
            </span>
            <div className="w-8 h-8 rounded-full bg-[#f0eee9] dark:bg-[#25262c] flex items-center justify-center text-[#1b1c19] dark:text-white">
              <span className="material-symbols-outlined text-[18px]">repeat</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-[#1b1c19] dark:text-white">
              {habitConsistency}%
            </span>
            <span className="text-[#006b5e] dark:text-[#8df1de] text-xs font-semibold ml-2 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              {habitConsistency >= 80 ? 'Steady' : habitConsistency > 0 ? 'Building' : 'No stickies'}
            </span>
          </div>
          <div className="w-full bg-[#f0eee9] dark:bg-[#25262c] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2e4faa] h-full rounded-full transition-all duration-500"
              style={{ width: `${habitConsistency}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Editorial Centerpiece: Rollover & Serenity Mood Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Rollover section (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Rollover Card */}
          <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex flex-col">
                <h2 className="font-headline font-semibold text-lg text-[#1b1c19] dark:text-white">
                  Rollover to Next Week
                </h2>
                <p className="text-xs text-[#444748] dark:text-[#a1a1aa]">
                  Uncompleted items gently queued for your upcoming sprint.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-xs text-[#1b1c19] dark:text-white font-semibold">
                {rolloverTasks.length} {rolloverTasks.length === 1 ? 'Activity' : 'Activities'} Pending
              </span>
            </div>

            {rollSuccessMessage ? (
              <div className="p-4 bg-[#8df1de]/20 border border-[#8df1de] rounded-xl text-xs font-semibold text-[#005046] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{rollSuccessMessage}</span>
              </div>
            ) : rolloverTasks.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-1.5 text-xs text-[#444748] dark:text-[#a1a1aa] bg-[#fbf9f4] dark:bg-[#151619] rounded-xl border border-dashed border-black/[0.06] dark:border-white/[0.06]">
                <span className="material-symbols-outlined text-[24px] text-emerald-500 opacity-80">
                  check_circle
                </span>
                <span>No pending rollover items. All caught up!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {rolloverTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] flex items-center justify-between gap-3 group hover:bg-[#f0eee9] dark:hover:bg-[#262830] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        aria-label="Toggle completed"
                        onClick={() => toggleRolloverDone(t.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                          t.completed
                            ? 'bg-[#006b5e] border-[#006b5e] text-white'
                            : 'border-[#c4c7c7] hover:border-[#006b5e]'
                        }`}
                      >
                        {t.completed && (
                          <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                        )}
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-sm font-medium truncate ${
                            t.completed ? 'line-through opacity-50' : 'text-[#1b1c19] dark:text-white'
                          }`}
                        >
                          {t.title}
                        </span>
                        <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa] flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: t.color || '#3FA796',
                            }}
                          ></span>
                          <span>{t.time} · {t.duration || 'Focus'}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRollSingle(t.id)}
                      className="px-3 py-1 rounded-full bg-white dark:bg-[#282a30] text-[#1b1c19] dark:text-white text-xs font-semibold hover:bg-[#1b1c19] hover:text-white dark:hover:bg-white dark:hover:text-[#1b1c19] transition-all flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                    >
                      <span>Next Week</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Master Rollover Action Button */}
            {rolloverTasks.length > 0 && !rollSuccessMessage && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">
                  Zero backlog guilt. Shift intentionally.
                </span>
                <button
                  type="button"
                  onClick={handleRollAll}
                  disabled={isRollingAll}
                  className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isRollingAll ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <span>Roll all {rolloverTasks.length} activities to Next Monday</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Weekly Takeaway & Reflection Card */}
          <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006b5e] dark:text-[#8df1de] text-[20px]">
                  psychology_alt
                </span>
                <h3 className="font-headline font-semibold text-base text-[#1b1c19] dark:text-white">
                  Weekly Takeaway & Reflection
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingReflection(!isEditingReflection)}
                className="text-xs text-[#006b5e] dark:text-[#8df1de] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isEditingReflection ? 'done' : 'edit'}
                </span>
                <span>{isEditingReflection ? 'Done' : 'Edit Prompt'}</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-[#444748] dark:text-[#a1a1aa]">
              {reflection.prompt}
            </span>

            {isEditingReflection ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={tempReflectionText}
                  onChange={(e) => setTempReflectionText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] text-xs text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.05] focus:outline-none"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleSaveReflection}
                  className="self-end px-3 py-1 bg-[#2e4faa] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Save Reflection
                </button>
              </div>
            ) : (
              <p className="font-serif italic text-sm text-[#1b1c19] dark:text-[#e4e2dd] leading-relaxed bg-[#f5f3ee] dark:bg-[#1f2025] p-3.5 rounded-xl border border-black/[0.02] dark:border-white/[0.02]">
                {reflection.answer}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-[#444748] dark:text-[#a1a1aa] pt-1">
              <span>{reflection.dateStr}</span>
              <div className="flex items-center gap-1">
                {reflection.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-[#f0eee9] dark:bg-[#25262c] text-[10px] text-[#444748] dark:text-[#a1a1aa]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Serenity & Micro-Victories (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Micro-Victories Log */}
          <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006b5e] dark:text-[#8df1de] text-[20px]">
                  emoji_events
                </span>
                <h3 className="font-headline font-semibold text-base text-[#1b1c19] dark:text-white">
                  Micro-Victories Log
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVictory(!showAddVictory)}
                className="text-xs text-[#006b5e] dark:text-[#8df1de] font-semibold hover:underline cursor-pointer"
              >
                + Add Victory
              </button>
            </div>

            {showAddVictory && (
              <form onSubmit={handleAddVictory} className="flex gap-2">
                <input
                  type="text"
                  value={newVictoryText}
                  onChange={(e) => setNewVictoryText(e.target.value)}
                  placeholder="e.g. Completed sprint without rushing"
                  className="flex-1 bg-[#f5f3ee] dark:bg-[#202126] px-3 py-1.5 rounded-xl text-xs text-[#1b1c19] dark:text-white outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#2e4faa] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {microVictories.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: v.color }}
                    ></span>
                    <span className="text-[#1b1c19] dark:text-white font-medium">{v.text}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#444748] dark:text-[#a1a1aa] uppercase">
                    {v.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Serenity Art Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-xs h-64 group">
            <img
              src={HOTLINKED_ASSETS.serenityCard}
              alt="Calm Japanese garden stones and zen moss"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8df1de]">
                Weekly Tao
              </span>
              <p className="font-serif italic text-base leading-snug">
                &ldquo;Do without doing. Rest without guilt. The cycle begins again with clarity.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
