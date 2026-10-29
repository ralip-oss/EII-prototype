import React, { useState, useMemo } from 'react';
import { Task, DayId } from '../types';
import { CalendarDay, getTaskColor } from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface AiBatchScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatchActivities: (newActivities: Task[]) => void;
  existingActivities: Task[];
  weekDays: CalendarDay[];
}

interface ActivityConfig {
  id: string;
  title: string;
  frequency: number; // e.g. 3
  duration: string; // "1h", "45m", "1h 30m", or custom
  customMinutes?: number; // min 30
  isCustomDuration?: boolean;
  timePreference: 'anytime' | 'morning' | 'afternoon' | 'evening' | 'custom';
  earliestHour: string; // "08:00"
  latestHour: string; // "18:30"
  description: string;
}

export const AiBatchScheduleModal: React.FC<AiBatchScheduleModalProps> = ({
  isOpen,
  onClose,
  onAddBatchActivities,
  existingActivities,
  weekDays,
}) => {
  const [step, setStep] = useState<'input' | 'configure' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [activities, setActivities] = useState<ActivityConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [proposedActivities, setProposedActivities] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown expansion state for grouped arranged activities
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});

  // User refinement changes box
  const [refinementText, setRefinementText] = useState('');

  if (!isOpen) return null;

  const handleAddActivityFromInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // Support comma or newline separated items: "Learn guitar, study, go to the gym"
    const titles = inputText
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newConfigs: ActivityConfig[] = titles.map((title) => {
      const lower = title.toLowerCase();
      let defaultFreq = 3;
      let defaultDur = '1h';
      let defaultPref: ActivityConfig['timePreference'] = 'anytime';
      let defaultDesc = '';
      let earliest = '08:00';
      let latest = '18:30';

      if (lower.includes('gym') || lower.includes('workout')) {
        defaultFreq = 3;
        defaultDur = '1h';
        defaultPref = 'custom';
        earliest = '08:00';
        latest = '18:30';
        defaultDesc = 'Plan requires gym sessions between 08:00 and 18:30. Prefer alternate days with rest.';
      } else if (lower.includes('guitar') || lower.includes('music') || lower.includes('piano')) {
        defaultFreq = 4;
        defaultDur = '45m';
        defaultPref = 'evening';
        defaultDesc = 'Quiet focused practice in the evening.';
      } else if (lower.includes('study') || lower.includes('read')) {
        defaultFreq = 3;
        defaultDur = '1h 30m';
        defaultPref = 'morning';
        defaultDesc = 'High focus deep work blocks.';
      }

      return {
        id: `cfg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title,
        frequency: defaultFreq,
        duration: defaultDur,
        customMinutes: 60,
        isCustomDuration: false,
        timePreference: defaultPref,
        earliestHour: earliest,
        latestHour: latest,
        description: defaultDesc,
      };
    });

    setActivities((prev) => [...prev, ...newConfigs]);
    setInputText('');
  };

  const handleRemoveConfig = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateConfig = (id: string, updates: Partial<ActivityConfig>) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, ...updates } : act))
    );
  };

  const handleQuickAddPreset = (title: string) => {
    setInputText(title);
  };

  // Group proposed activities by unique title for clean collapsed display
  const groupedProposedActivities = useMemo(() => {
    const map = new Map<string, any[]>();
    proposedActivities.forEach((act) => {
      const key = (act.title || '').trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(act);
    });

    return Array.from(map.entries()).map(([, items]) => {
      const displayTitle = items[0].title;
      return {
        key: displayTitle.toLowerCase(),
        title: displayTitle,
        color: getTaskColor(displayTitle),
        category: items[0].category,
        count: items.length,
        items,
      };
    });
  }, [proposedActivities]);

  const toggleActivityExpand = (key: string) => {
    setExpandedActivities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRunAiScheduling = async () => {
    if (activities.length === 0) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        activities: activities.map((a) => ({
          title: a.title,
          frequency: a.frequency,
          duration: a.isCustomDuration && a.customMinutes ? `${a.customMinutes}m` : a.duration,
          timeConstraint:
            a.timePreference === 'custom'
              ? `${a.earliestHour} - ${a.latestHour}`
              : a.timePreference,
          earliestHour: a.timePreference === 'custom' ? a.earliestHour : undefined,
          latestHour: a.timePreference === 'custom' ? a.latestHour : undefined,
          description: a.description,
        })),
        existingActivities: existingActivities.map((t) => ({
          id: t.id,
          title: t.title,
          dayId: t.dayId,
          dateKey: t.dateKey,
          time: t.time,
          duration: t.duration,
          endTime: t.endTime,
        })),
        weekDays: weekDays.map((w) => ({
          dayId: w.dayId,
          dayName: w.dayName,
          dateKey: w.dateKey,
        })),
      };

      const res = await fetch('/api/gemini/schedule-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.scheduledActivities && data.scheduledActivities.length > 0) {
        setProposedActivities(data.scheduledActivities);
        setAiReasoning(
          data.reasoning ||
            'AI smartly arranged activities avoiding busy hours, respecting your time limits, and pacing focus blocks across the week.'
        );
        // By default, leave all accordion groups collapsed as requested
        setExpandedActivities({});
        setStep('review');
        zenAudio.playChime();
      } else {
        throw new Error(data.message || 'No schedule generated');
      }
    } catch (err: any) {
      console.error('Scheduling error:', err);
      setErrorMsg('Could not connect to scheduler. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // User requested plan refinement with changes text box
  const handleRefineSchedule = async () => {
    if (!refinementText.trim()) return;
    setIsRefining(true);
    setErrorMsg('');

    try {
      const payload = {
        activities: activities.map((a) => ({
          title: a.title,
          frequency: a.frequency,
          duration: a.isCustomDuration && a.customMinutes ? `${a.customMinutes}m` : a.duration,
          timeConstraint:
            a.timePreference === 'custom'
              ? `${a.earliestHour} - ${a.latestHour}`
              : a.timePreference,
          earliestHour: a.timePreference === 'custom' ? a.earliestHour : undefined,
          latestHour: a.timePreference === 'custom' ? a.latestHour : undefined,
          description: a.description,
        })),
        existingActivities: existingActivities.map((t) => ({
          id: t.id,
          title: t.title,
          dayId: t.dayId,
          dateKey: t.dateKey,
          time: t.time,
          duration: t.duration,
          endTime: t.endTime,
        })),
        weekDays: weekDays.map((w) => ({
          dayId: w.dayId,
          dayName: w.dayName,
          dateKey: w.dateKey,
        })),
        refinementFeedback: refinementText,
        previousProposal: proposedActivities,
      };

      const res = await fetch('/api/gemini/schedule-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.scheduledActivities && data.scheduledActivities.length > 0) {
        setProposedActivities(data.scheduledActivities);
        setAiReasoning(
          data.reasoning ||
            'Adjusted weekly plan incorporating your requested modifications.'
        );
        setRefinementText('');
        zenAudio.playChime();
      } else {
        throw new Error(data.message || 'Could not apply refinements');
      }
    } catch (err: any) {
      console.error('Refinement error:', err);
      setErrorMsg('Could not apply adjustments. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleAcceptSchedule = () => {
    const formattedNewActivities: Task[] = proposedActivities.map((act) => ({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: act.title,
      color: getTaskColor(act.title),
      dayId: act.dayId as DayId,
      dateKey: act.dateKey,
      time: act.time,
      endTime: act.endTime,
      duration: act.duration,
      category: act.category || 'Focus',
      completed: false,
      status: 'todo',
      notes: act.notes,
    }));

    onAddBatchActivities(formattedNewActivities);
    zenAudio.playChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[12px] z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-modal-title"
        className="relative w-full max-w-[760px] my-auto bg-white dark:bg-[#18191d] rounded-2xl shadow-[0_24px_60px_-12px_rgba(27,28,25,0.25)] border border-black/[0.06] dark:border-white/[0.08] transition-all flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Top glowing ambient gradient banner with secondary #2e4faa accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#2e4faa] via-[#5978dd] to-[#2e4faa]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2e4faa]/10 text-[#2e4faa] dark:text-[#7d9eff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h2
                id="ai-modal-title"
                className="font-headline font-semibold text-lg sm:text-xl text-[#1b1c19] dark:text-white"
              >
                AI Smart Batch Scheduler
              </h2>
              <p className="text-xs text-[#444748] dark:text-[#a1a1aa]">
                Add multiple activities at once — AI arranges them with zero conflicts
              </p>
            </div>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5 flex-1">
          {/* STEP 1: INPUT ACTIVITIES */}
          {step === 'input' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1b1c19] dark:text-[#f2f0ea]">
                  What activities would you like to add?
                </label>
                <p className="text-[11px] text-[#444748] dark:text-[#a1a1aa]">
                  Enter multiple items separated by commas or newlines (e.g., “Learn how to play guitar, study, go to the gym”).
                </p>
                <form onSubmit={handleAddActivityFromInput} className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="e.g. Learn guitar, Study, Go to the gym..."
                    className="flex-1 bg-[#f5f3ee] dark:bg-[#212328] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#2e4faa] hover:bg-[#25418f] text-white font-headline font-semibold text-xs transition-all shrink-0 shadow-xs"
                  >
                    + Add
                  </button>
                </form>
              </div>

              {/* Quick Preset Pills */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#747878] dark:text-[#a1a1aa]">
                  Quick Inspiration
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Learn guitar',
                    'Go to the gym',
                    'Deep study',
                    'Morning yoga',
                    'Book reading',
                    '5K Run',
                    'Language practice',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickAddPreset(preset)}
                      className="px-2.5 py-1 rounded-full bg-[#f0eee9] dark:bg-[#25262c] text-[11px] text-[#444748] dark:text-[#d1d5db] hover:text-[#2e4faa] dark:hover:text-[#7d9eff] hover:border-[#2e4faa]/30 transition-colors border border-transparent"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Added Activities Badges */}
              {activities.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
                  <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                    Activities to schedule ({activities.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f5f3ee] dark:bg-[#212328] border border-black/[0.04] dark:border-white/[0.05] text-xs font-semibold text-[#1b1c19] dark:text-white"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getTaskColor(act.title) }}
                        />
                        <span>{act.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveConfig(act.id)}
                          className="text-[#747878] hover:text-red-500 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONFIGURE FREQUENCY, CUSTOM DURATION & SPECIFIC HOURS */}
          {step === 'configure' && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#2e4faa]/10 p-3 rounded-xl border border-[#2e4faa]/20 text-xs text-[#2e4faa] dark:text-[#7d9eff]">
                Specify frequency, duration (custom time supported with min 30m), and any time constraints.
              </div>

              <div className="flex flex-col gap-4">
                {activities.map((act, index) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl bg-[#f5f3ee]/60 dark:bg-[#202126]/60 border border-black/[0.05] dark:border-white/[0.06] flex flex-col gap-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getTaskColor(act.title) }}
                        />
                        <span className="font-headline font-semibold text-sm text-[#1b1c19] dark:text-white">
                          {index + 1}. {act.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveConfig(act.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Frequency & Duration row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Frequency */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                          How many times this week?
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleUpdateConfig(act.id, { frequency: num })}
                              className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                                act.frequency === num
                                  ? 'bg-[#2e4faa] text-white shadow-xs'
                                  : 'bg-white dark:bg-[#18191d] text-[#444748] dark:text-[#a1a1aa] border border-black/[0.04] dark:border-white/[0.05]'
                              }`}
                            >
                              {num}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration (Custom Support with Min 30m) */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                            Duration per session
                          </label>
                          <span className="text-[10px] text-[#747878] dark:text-[#a1a1aa]">
                            Min: 30 min
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={act.isCustomDuration ? 'custom' : act.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                handleUpdateConfig(act.id, {
                                  isCustomDuration: true,
                                  customMinutes: act.customMinutes || 45,
                                  duration: `${act.customMinutes || 45}m`,
                                });
                              } else {
                                handleUpdateConfig(act.id, {
                                  isCustomDuration: false,
                                  duration: val,
                                });
                              }
                            }}
                            className="flex-1 bg-white dark:bg-[#18191d] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none"
                          >
                            <option value="30m">30 min (default min)</option>
                            <option value="45m">45 min</option>
                            <option value="1h">1 hour</option>
                            <option value="1h 15m">1h 15m</option>
                            <option value="1h 30m">1h 30m</option>
                            <option value="2h">2 hours</option>
                            <option value="custom">Custom minutes...</option>
                          </select>

                          {act.isCustomDuration && (
                            <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-[#18191d] px-2.5 py-1 rounded-lg border border-black/[0.05] dark:border-white/[0.06]">
                              <input
                                type="number"
                                min={30}
                                step={5}
                                value={act.customMinutes || 30}
                                onChange={(e) => {
                                  const num = Math.max(30, parseInt(e.target.value, 10) || 30);
                                  handleUpdateConfig(act.id, {
                                    customMinutes: num,
                                    duration: `${num}m`,
                                  });
                                }}
                                className="w-14 bg-[#f5f3ee] dark:bg-[#25262c] px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-center"
                              />
                              <span className="text-[10px] text-[#747878] dark:text-[#a1a1aa] font-medium">
                                min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time Window Constraints */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                        Specific Hours / Time Window
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {(['anytime', 'morning', 'afternoon', 'custom'] as const).map((pref) => (
                          <button
                            key={pref}
                            type="button"
                            onClick={() => handleUpdateConfig(act.id, { timePreference: pref })}
                            className={`py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                              act.timePreference === pref
                                ? 'bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] shadow-xs'
                                : 'bg-white dark:bg-[#18191d] text-[#444748] dark:text-[#a1a1aa] border border-black/[0.04] dark:border-white/[0.05]'
                            }`}
                          >
                            {pref === 'custom' ? 'Custom Hours' : pref}
                          </button>
                        ))}
                      </div>

                      {/* Custom Hours Input */}
                      {act.timePreference === 'custom' && (
                        <div className="flex items-center gap-2 mt-1 p-2 bg-white dark:bg-[#18191d] rounded-lg border border-black/[0.04] dark:border-white/[0.05]">
                          <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]">Between:</span>
                          <input
                            type="time"
                            step="1800"
                            value={act.earliestHour}
                            onChange={(e) => handleUpdateConfig(act.id, { earliestHour: e.target.value })}
                            className="bg-[#f5f3ee] dark:bg-[#25262c] px-2 py-1 rounded text-xs font-mono font-semibold"
                          />
                          <span className="text-[11px] text-[#444748] dark:text-[#a1a1aa]">and:</span>
                          <input
                            type="time"
                            step="1800"
                            value={act.latestHour}
                            onChange={(e) => handleUpdateConfig(act.id, { latestHour: e.target.value })}
                            className="bg-[#f5f3ee] dark:bg-[#25262c] px-2 py-1 rounded text-xs font-mono font-semibold"
                          />
                        </div>
                      )}
                    </div>

                    {/* Description Text Box for AI */}
                    <div className="flex flex-col gap-1 pt-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#444748] dark:text-[#a1a1aa]">
                        Description & Notes for AI
                      </label>
                      <textarea
                        value={act.description}
                        onChange={(e) => handleUpdateConfig(act.id, { description: e.target.value })}
                        placeholder="Add details, specific goals, preferred days, or instructions..."
                        rows={2}
                        className="w-full bg-white dark:bg-[#18191d] p-2.5 rounded-lg text-xs text-[#1b1c19] dark:text-white border border-black/[0.04] dark:border-white/[0.05] focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW AI SCHEDULE (GROUPED ACCORDION + WEEK MOCKUP + REFINEMENT BOX) */}
          {step === 'review' && (
            <div className="flex flex-col gap-5">
              {/* AI Reasoning Callout */}
              <div className="p-4 rounded-xl bg-[#2e4faa]/10 border border-[#2e4faa]/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-[#2e4faa] dark:text-[#7d9eff] shrink-0 mt-0.5">
                  psychology
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#2e4faa] dark:text-[#7d9eff]">
                    AI Scheduling Rationale:
                  </span>
                  <p className="text-xs text-[#1b1c19] dark:text-[#e4e2dd] leading-relaxed">
                    {aiReasoning}
                  </p>
                </div>
              </div>

              {/* WEEKLY PLAN VISUAL MOCKUP */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1b1c19] dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#2e4faa]">calendar_view_week</span>
                    Weekly Plan Mockup (Preview)
                  </span>
                  <span className="text-[11px] text-[#747878] dark:text-[#a1a1aa]">
                    Previewing {proposedActivities.length} newly arranged sessions
                  </span>
                </div>

                <div className="p-3 bg-[#f5f3ee]/80 dark:bg-[#202126]/80 rounded-xl border border-black/[0.05] dark:border-white/[0.06] overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-[560px]">
                    {weekDays.map((day) => {
                      const dayProposed = proposedActivities.filter((a) => a.dayId === day.dayId);
                      const dayExisting = existingActivities.filter((a) => a.dayId === day.dayId);

                      return (
                        <div
                          key={day.dayId}
                          className="flex flex-col gap-1.5 bg-white dark:bg-[#18191d] rounded-lg p-2 border border-black/[0.04] dark:border-white/[0.05] min-h-[120px]"
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-black/[0.04] dark:border-white/[0.05]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b1c19] dark:text-white">
                              {day.shortName}
                            </span>
                            <span className="text-[9px] font-mono text-[#747878] dark:text-[#a1a1aa]">
                              {day.dayNumber}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 flex-1">
                            {/* Existing subtle badges */}
                            {dayExisting.map((act) => (
                              <div
                                key={act.id}
                                className="px-1.5 py-0.5 rounded bg-black/[0.03] dark:bg-white/[0.04] text-[9px] text-[#747878] dark:text-[#a1a1aa] truncate"
                                title={`Existing: ${act.title} (${act.time})`}
                              >
                                {act.time} {act.title}
                              </div>
                            ))}

                            {/* Proposed vibrant activity badges */}
                            {dayProposed.map((act, idx) => (
                              <div
                                key={idx}
                                className="px-1.5 py-1 rounded text-[9px] font-semibold text-[#1b1c19] dark:text-white flex flex-col gap-0.5 border-l-2 shadow-2xs"
                                style={{
                                  borderLeftColor: getTaskColor(act.title),
                                  backgroundColor: `${getTaskColor(act.title)}18`,
                                }}
                                title={`${act.title} (${act.time} - ${act.endTime})`}
                              >
                                <span className="font-bold truncate">{act.title}</span>
                                <span className="font-mono text-[8px] opacity-75">
                                  {act.time}–{act.endTime}
                                </span>
                              </div>
                            ))}

                            {dayProposed.length === 0 && dayExisting.length === 0 && (
                              <span className="text-[8px] text-[#a1a1aa] dark:text-[#52525b] italic text-center py-4">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ARRANGED ACTIVITIES: GROUPED ACCORDION VIEW */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                    Arranged Activities ({groupedProposedActivities.length} unique activities)
                  </span>
                  <span className="text-[11px] text-[#747878] dark:text-[#a1a1aa]">
                    Click any activity to view dates & times
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {groupedProposedActivities.map((group) => {
                    const isExpanded = !!expandedActivities[group.key];

                    return (
                      <div
                        key={group.key}
                        className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fbf9f4] dark:bg-[#1f2025] overflow-hidden transition-all shadow-xs"
                      >
                        {/* Header card button */}
                        <button
                          type="button"
                          onClick={() => toggleActivityExpand(group.key)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: group.color }}
                            />
                            <div className="flex flex-col">
                              <span className="font-headline font-semibold text-xs sm:text-sm text-[#1b1c19] dark:text-white">
                                {group.title}
                              </span>
                              <span className="text-[11px] text-[#747878] dark:text-[#a1a1aa]">
                                {group.count} {group.count === 1 ? 'session' : 'sessions'} scheduled across the week
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[10px] font-mono text-[#444748] dark:text-[#a1a1aa]">
                              {isExpanded ? 'Hide schedule' : 'View schedule'}
                            </span>
                            <span
                              className={`material-symbols-outlined text-[20px] text-[#747878] transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            >
                              keyboard_arrow_down
                            </span>
                          </div>
                        </button>

                        {/* Collapsible Dropdown Menu with Scheduled Dates & Times */}
                        {isExpanded && (
                          <div className="p-3 pt-0 border-t border-black/[0.04] dark:border-white/[0.05] bg-white dark:bg-[#18191d] flex flex-col gap-2 animate-fadeIn">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#747878] dark:text-[#a1a1aa] pt-2 px-1">
                              Scheduled Dates & Times:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {group.items.map((session, sIdx) => {
                                const matchedDay = weekDays.find((d) => d.dayId === session.dayId);
                                const dayStr = matchedDay ? matchedDay.fullDateStr : session.dayId.toUpperCase();

                                return (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 rounded-lg bg-[#fbf9f4] dark:bg-[#202126] border border-black/[0.04] dark:border-white/[0.05] flex items-center justify-between text-xs"
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-[#1b1c19] dark:text-white">
                                        {dayStr}
                                      </span>
                                      <span className="text-[11px] font-mono text-[#747878] dark:text-[#a1a1aa]">
                                        {session.time} – {session.endTime}
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-[10px] font-mono text-[#444748] dark:text-[#d1d5db]">
                                      {session.duration}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* USER REFINEMENT / REQUESTED CHANGES BOX */}
              <div className="p-4 rounded-xl bg-[#f5f3ee]/60 dark:bg-[#202126]/60 border border-black/[0.05] dark:border-white/[0.06] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1b1c19] dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#2e4faa]">edit_note</span>
                    Want to make changes to this plan?
                  </label>
                  <span className="text-[10px] text-[#747878] dark:text-[#a1a1aa]">
                    AI will adjust the schedule
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    placeholder="e.g., Space gym workouts on Mon/Wed/Fri, move guitar to 19:00, make study session 45m..."
                    rows={2}
                    className="flex-1 bg-white dark:bg-[#18191d] p-2.5 rounded-lg text-xs text-[#1b1c19] dark:text-white border border-black/[0.05] dark:border-white/[0.06] focus:outline-none resize-none leading-relaxed"
                  />
                  <button
                    type="button"
                    disabled={!refinementText.trim() || isRefining}
                    onClick={handleRefineSchedule}
                    className="px-4 py-2 rounded-lg bg-[#2e4faa] hover:bg-[#25418f] text-white font-headline font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 self-end sm:self-stretch flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isRefining ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                        <span>Refine Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between bg-[#fbf9f4] dark:bg-[#151619]">
          {step === 'input' && (
            <>
              <span className="text-xs text-[#747878] dark:text-[#a1a1aa]">
                {activities.length} {activities.length === 1 ? 'activity' : 'activities'} added
              </span>
              <button
                type="button"
                disabled={activities.length === 0}
                onClick={() => setStep('configure')}
                className="px-5 py-2.5 rounded-xl bg-[#2e4faa] hover:bg-[#25418f] text-white font-headline font-semibold text-xs hover:opacity-95 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>Set Preferences</span>
                <span>→</span>
              </button>
            </>
          )}

          {step === 'configure' && (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleRunAiScheduling}
                className="px-5 py-2.5 rounded-xl bg-[#2e4faa] hover:bg-[#25418f] text-white font-headline font-semibold text-xs hover:opacity-95 active:scale-95 transition-all shadow-xs flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI Arranging Schedule...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>Arrange with AI</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                type="button"
                onClick={() => setStep('configure')}
                className="px-4 py-2 text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:text-[#1b1c19] dark:hover:text-white"
              >
                ← Adjust Settings
              </button>
              <button
                type="button"
                onClick={handleAcceptSchedule}
                className="px-5 py-2.5 rounded-xl bg-[#1b1c19] dark:bg-white text-white dark:text-[#1b1c19] font-headline font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Confirm & Add All to Schedule</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
