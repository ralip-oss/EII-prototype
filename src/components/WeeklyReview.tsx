import React, { useState } from 'react';
import { Task, ReflectionEntry, MicroVictory } from '../types';
import {
  INITIAL_ROLLOVER_TASKS,
  INITIAL_REFLECTION,
  INITIAL_MICRO_VICTORIES,
  HOTLINKED_ASSETS,
} from '../data/initialData';
import { CalendarDay, formatWeekRange } from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface WeeklyReviewProps {
  tasks: Task[];
  weekDays: CalendarDay[];
  onRollTasksToNextWeek?: (tasks: Task[]) => void;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({ weekDays }) => {
  const [rolloverTasks, setRolloverTasks] = useState<Task[]>(INITIAL_ROLLOVER_TASKS);
  const [reflection, setReflection] = useState<ReflectionEntry>(INITIAL_REFLECTION);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [tempReflectionText, setTempReflectionText] = useState(reflection.answer);
  const [microVictories, setMicroVictories] = useState<MicroVictory[]>(INITIAL_MICRO_VICTORIES);
  const [newVictoryText, setNewVictoryText] = useState('');
  const [showAddVictory, setShowAddVictory] = useState(false);
  const [isRollingAll, setIsRollingAll] = useState(false);
  const [rollSuccessMessage, setRollSuccessMessage] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const rangeLabel = formatWeekRange(weekDays);

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
      setRollSuccessMessage('All activities gently scheduled for Next Monday');
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
- 24 of 28 activities completed (86%)
- Pacing: Optimal Flow
- Consistency: 92% Steady
- Busiest Day: Wednesday (6 blocks, 5.5h)
- Reflection: ${reflection.answer}
    `;
    navigator.clipboard?.writeText(summary);
    setCopiedSummary(true);
    zenAudio.playChime();
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const dailyVelocityPcts: Record<string, number> = {
    mon: 100,
    tue: 80,
    wed: 85,
    thu: 90,
    fri: 100,
    sat: 60,
    sun: 75,
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
            {rangeLabel} <span className="mx-2 opacity-40">/</span>
            <span className="text-[#1b1c19] dark:text-white font-semibold"> 24 of 28 activities completed </span>
            <span className="text-[#006b5e] dark:text-[#8df1de] font-semibold">(86%)</span>
          </p>
        </div>

        {/* Action Pill and Summary Button */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="px-3.5 py-1.5 rounded-full bg-[#f0eee9] dark:bg-[#18191d] border border-black/[0.04] dark:border-white/[0.05] flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[#006b5e] dark:text-[#8df1de] text-[18px]">
              spa
            </span>
            <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
              Pacing: Optimal Flow
            </span>
          </div>

          <button
            onClick={handleArchiveSummary}
            type="button"
            className="px-4 py-1.5 rounded-full bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
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
            const pct = dailyVelocityPcts[d.dayId] || 80;
            const isPeak = d.dayId === 'wed' || d.dayId === 'thu';
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
                      backgroundColor: d.color,
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
              Tasks Completed
            </span>
            <div className="w-8 h-8 rounded-full bg-[#006b5e]/10 dark:bg-[#8df1de]/10 flex items-center justify-center text-[#006b5e] dark:text-[#8df1de]">
              <span className="material-symbols-outlined text-[18px]">done_all</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-[#1b1c19] dark:text-white">
              24
            </span>
            <span className="text-base text-[#444748] dark:text-[#a1a1aa]">/ 28</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#006b5e] dark:text-[#8df1de] text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span>+4 vs last week</span>
            <span className="text-[#444748] dark:text-[#a1a1aa] font-normal ml-1">· 93% on-time</span>
          </div>
        </div>

        {/* Metric 2: Busiest Day */}
        <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
              Busiest Day
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#8DB255]"></div>
          </div>
          <div className="my-4 flex flex-col">
            <span className="font-headline font-bold text-2xl sm:text-3xl text-[#1b1c19] dark:text-white">
              Wednesday
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#444748] dark:text-[#a1a1aa] text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8DB255]"></span>
            <span>6 scheduled blocks</span>
            <span className="opacity-40">·</span>
            <span className="text-[#1b1c19] dark:text-white font-medium">5.5 hrs focus time</span>
          </div>
        </div>

        {/* Metric 3: Habit Consistency */}
        <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#444748] dark:text-[#a1a1aa] uppercase tracking-wider">
              Habit Consistency
            </span>
            <div className="w-8 h-8 rounded-full bg-[#f0eee9] dark:bg-[#25262c] flex items-center justify-center text-[#1b1c19] dark:text-white">
              <span className="material-symbols-outlined text-[18px]">repeat</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="font-headline font-bold text-3xl sm:text-4xl text-[#1b1c19] dark:text-white">
              92%
            </span>
            <span className="text-[#006b5e] dark:text-[#8df1de] text-xs font-semibold ml-2 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Steady
            </span>
          </div>
          <div className="w-full bg-[#f0eee9] dark:bg-[#25262c] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#006b5e] dark:bg-[#8df1de] h-full rounded-full" style={{ width: '92%' }}></div>
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
                {rolloverTasks.length} Tasks Pending
              </span>
            </div>

            {rollSuccessMessage ? (
              <div className="p-4 bg-[#8df1de]/20 border border-[#8df1de] rounded-xl text-xs font-semibold text-[#005046] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{rollSuccessMessage}</span>
              </div>
            ) : rolloverTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#444748] dark:text-[#a1a1aa]">
                No pending rollover items. All caught up!
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
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
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
                              backgroundColor: t.id.includes('1') ? '#3FA796' : '#D9669A',
                            }}
                          ></span>
                          <span>{t.notes}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRollSingle(t.id)}
                      className="px-3 py-1 rounded-full bg-white dark:bg-[#282a30] text-[#1b1c19] dark:text-white text-xs font-semibold hover:bg-[#1b1c19] hover:text-white dark:hover:bg-white dark:hover:text-[#1b1c19] transition-all flex items-center gap-1 shrink-0 shadow-xs"
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
                  className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs"
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
              <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]">
                {reflection.dateStr}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#f5f3ee] dark:bg-[#202126] flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa] font-semibold">
                Prompt
              </span>
              <p className="font-headline font-semibold text-sm sm:text-base text-[#1b1c19] dark:text-white">
                {reflection.prompt}
              </p>

              {isEditingReflection ? (
                <div className="flex flex-col gap-2 mt-2">
                  <textarea
                    value={tempReflectionText}
                    onChange={(e) => setTempReflectionText(e.target.value)}
                    className="w-full bg-white dark:bg-[#282a30] p-3 rounded-xl text-xs text-[#1b1c19] dark:text-white border border-black/[0.06] focus:outline-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSaveReflection}
                      className="px-3 py-1 bg-[#006b5e] text-white rounded-lg text-xs font-semibold"
                    >
                      Save Reflection
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#1b1c19] dark:text-[#f2f0ea] pt-1 leading-relaxed italic">
                  {reflection.answer}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {reflection.tags.map((tg) => (
                  <span
                    key={tg}
                    className="px-2.5 py-0.5 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-[11px] font-medium text-[#444748] dark:text-[#a1a1aa]"
                  >
                    {tg}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingReflection(!isEditingReflection)}
                className="text-xs text-[#006b5e] dark:text-[#8df1de] font-semibold hover:underline"
              >
                {isEditingReflection ? 'Cancel' : 'Edit Entry'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Serenity Mood Card & Micro-Victories (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Photographic Serenity Mood Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-xs bg-[#eae8e3] dark:bg-[#25262c] h-[340px] sm:h-[360px] flex flex-col justify-end p-5 sm:p-6 group">
            <img
              src={HOTLINKED_ASSETS.serenityCard}
              alt="Serene minimalist workspace with notebook and morning sunlight"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
            <div className="relative z-10 flex flex-col gap-1 text-white">
              <span className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">
                Pacing Ritual
              </span>
              <h4 className="font-headline font-semibold text-lg sm:text-xl leading-snug">
                &ldquo;Protect the margins. Space creates clarity.&rdquo;
              </h4>
              <p className="text-xs text-white/90 mt-1">
                Next week starts fresh in 18 hours. Enjoy Sunday night resting your senses.
              </p>
            </div>
          </div>

          {/* Micro-Victories Pill Mosaic */}
          <div className="bg-white dark:bg-[#18191d] p-5 sm:p-6 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                Micro-Victories
              </span>
              <button
                type="button"
                onClick={() => setShowAddVictory(!showAddVictory)}
                className="text-xs text-[#006b5e] dark:text-[#8df1de] font-semibold hover:underline"
              >
                + Add victory
              </button>
            </div>

            {showAddVictory && (
              <form onSubmit={handleAddVictory} className="flex gap-2">
                <input
                  type="text"
                  value={newVictoryText}
                  onChange={(e) => setNewVictoryText(e.target.value)}
                  placeholder="e.g. 10 pages read"
                  className="flex-1 bg-[#f0eee9] dark:bg-[#212328] px-3 py-1.5 rounded-lg text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#006b5e] text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {microVictories.map((v) => (
                <div
                  key={v.id}
                  className="px-3 py-1.5 rounded-full bg-[#f5f3ee] dark:bg-[#212328] flex items-center gap-2 border border-black/[0.02] dark:border-white/[0.04]"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: v.color }}
                  ></span>
                  <span className="text-xs font-medium text-[#1b1c19] dark:text-white">
                    {v.day}: {v.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
