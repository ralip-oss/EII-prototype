import React, { useState, useEffect } from 'react';
import { Task, DayId, HabitStick } from './types';
import {
  INITIAL_TASKS,
  INITIAL_HABIT_STICKS,
} from './data/initialData';
import {
  BASE_TODAY,
  getWeekDays,
  formatWeekRange,
  getTaskColor,
} from './utils/dateUtils';
import { Header } from './components/Header';
import { WeekOverview } from './components/WeekOverview';
import { DayDetail } from './components/DayDetail';
import { WeeklyReview } from './components/WeeklyReview';
import { AddTaskModal } from './components/AddTaskModal';
import { HabitSticksModal } from './components/HabitSticksModal';
import { ZenFocusTimer } from './components/ZenFocusTimer';
import { SettingsModal } from './components/SettingsModal';
import { Footer } from './components/Footer';

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<
    'week-overview' | 'day-detail' | 'weekly-review' | 'habits'
  >('week-overview');
  // Today is Thursday Oct 15 in this calendar week
  const [selectedDayId, setSelectedDayId] = useState<DayId>('thu');

  // Modals
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [addTaskDefaultDay, setAddTaskDefaultDay] = useState<DayId>('thu');
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [isHabitsModalOpen, setIsHabitsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Theme State (Default to Light Canvas, fully toggleable)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weekly_theme');
      if (saved) return saved === 'dark';
      return false; // Default Light Canvas
    }
    return false;
  });

  // Week offset (0 = current week Oct 12 – 18, 2026)
  const [weekOffset, setWeekOffset] = useState(0);

  // Real calendar days for the active week
  const weekDays = getWeekDays(BASE_TODAY, weekOffset);
  const weekRangeText = formatWeekRange(weekDays);

  // Task & Habit State
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weekly_tasks_v3');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_TASKS;
  });

  const [habitSticks, setHabitSticks] = useState<HabitStick[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weekly_habits_v3');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_HABIT_STICKS;
  });

  const [anchorIntention, setAnchorIntention] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weekly_anchor_intention_v3');
      if (saved) return saved;
    }
    return 'Protect mid-morning hours for uninterrupted architectural decisions. Let Thursday research inform the sprint launch without rushing.';
  });

  // Sync Theme with DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('weekly_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('weekly_theme', 'light');
    }
  }, [isDark]);

  // Sync Tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem('weekly_tasks_v3', JSON.stringify(tasks));
  }, [tasks]);

  // Sync Habit Sticks to LocalStorage
  useEffect(() => {
    localStorage.setItem('weekly_habits_v3', JSON.stringify(habitSticks));
  }, [habitSticks]);

  // Sync Anchor Intention
  useEffect(() => {
    localStorage.setItem('weekly_anchor_intention_v3', anchorIntention);
  }, [anchorIntention]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'week-overview' || hash === 'day-detail' || hash === 'weekly-review') {
        setCurrentView(hash as typeof currentView);
      } else if (hash === 'add-task') {
        setIsAddTaskOpen(true);
      } else if (hash === 'habits') {
        setCurrentView('habits');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for Add Task, Esc for Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAddTaskOpen(true);
      }
      if (e.key === 'Escape') {
        setIsAddTaskOpen(false);
        setIsFocusTimerOpen(false);
        setIsHabitsModalOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: nextCompleted ? 'completed' : 'todo',
          };
        }
        return t;
      })
    );
  };

  const handleToggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.checklist) {
          const updatedChecklist = t.checklist.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
          );
          return { ...t, checklist: updatedChecklist };
        }
        return t;
      })
    );
  };

  const handleAddTask = (newTask: Partial<Task>) => {
    const matchedDay = weekDays.find((d) => d.dayId === (newTask.dayId || selectedDayId));
    const title = newTask.title || 'Untitled Task';
    const normTitle = title.trim().toLowerCase();
    const existingSameTitle = tasks.find((t) => t.title.trim().toLowerCase() === normTitle);
    const color = existingSameTitle?.color || newTask.color || getTaskColor(title);

    const taskToAdd: Task = {
      id: `task-${Date.now()}`,
      title,
      color,
      dayId: newTask.dayId || selectedDayId,
      dateKey: newTask.dateKey || matchedDay?.dateKey,
      time: newTask.time || '14:00',
      duration: newTask.duration || '1h',
      endTime: newTask.endTime,
      category: newTask.category || 'Focus',
      completed: false,
      status: 'todo',
      notes: newTask.notes,
      quietReminder: newTask.quietReminder,
    };
    setTasks((prev) => [...prev, taskToAdd]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) => {
      const updatedNorm = updatedTask.title.trim().toLowerCase();
      return prev.map((t) => {
        if (t.id === updatedTask.id) return updatedTask;
        // Tasks with the same name (case-insensitive) share the same color!
        if (t.title.trim().toLowerCase() === updatedNorm && updatedTask.color) {
          return { ...t, color: updatedTask.color };
        }
        return t;
      });
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleOpenAddTask = (dayId?: DayId) => {
    setAddTaskDefaultDay(dayId || selectedDayId);
    setIsAddTaskOpen(true);
  };

  const handleSelectDay = (dayId: DayId) => {
    setSelectedDayId(dayId);
    setCurrentView('day-detail');
  };

  const handleToggleHabitDay = (habitId: string, dayId: DayId) => {
    setHabitSticks((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            completedDays: {
              ...h.completedDays,
              [dayId]: !h.completedDays[dayId],
            },
          };
        }
        return h;
      })
    );
  };

  const handleAddHabit = (title: string, category: string, color: string) => {
    const newStick: HabitStick = {
      id: `hab-${Date.now()}`,
      title,
      category,
      color,
      completedDays: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
    };
    setHabitSticks((prev) => [...prev, newStick]);
  };

  const handleResetData = () => {
    setTasks(INITIAL_TASKS);
    setHabitSticks(INITIAL_HABIT_STICKS);
    setAnchorIntention(
      'Protect mid-morning hours for uninterrupted architectural decisions. Let Thursday research inform the sprint launch without rushing.'
    );
    setWeekOffset(0);
    localStorage.removeItem('weekly_tasks_v3');
    localStorage.removeItem('weekly_habits_v3');
    localStorage.removeItem('weekly_anchor_intention_v3');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f4] dark:bg-[#0f0f12] text-[#1b1c19] dark:text-[#f2f0ea] transition-colors duration-300">
      {/* Top Fixed Header */}
      <Header
        currentView={currentView}
        onNavigate={(v) => {
          if (v === 'habits') {
            setIsHabitsModalOpen(true);
          } else {
            setCurrentView(v);
          }
        }}
        onOpenAddTask={() => handleOpenAddTask()}
        onOpenFocusTimer={() => setIsFocusTimerOpen(true)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        weekRangeText={weekRangeText}
        onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
        onNextWeek={() => setWeekOffset((prev) => prev + 1)}
        onResetToday={() => {
          setWeekOffset(0);
          setSelectedDayId('thu');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 sm:pt-20">
        {currentView === 'week-overview' && (
          <WeekOverview
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onSelectDay={handleSelectDay}
            onOpenAddTask={handleOpenAddTask}
            weekDays={weekDays}
            anchorIntention={anchorIntention}
            onUpdateAnchorIntention={setAnchorIntention}
          />
        )}

        {currentView === 'day-detail' && (
          <DayDetail
            selectedDayId={selectedDayId}
            onSelectDay={setSelectedDayId}
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            onAddTask={handleAddTask}
            onOpenFocusTimer={() => setIsFocusTimerOpen(true)}
            onNavigateToOverview={() => setCurrentView('week-overview')}
            weekDays={weekDays}
          />
        )}

        {currentView === 'weekly-review' && (
          <WeeklyReview tasks={tasks} weekDays={weekDays} />
        )}

        {currentView === 'habits' && (
          <div className="max-w-[1340px] mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="font-headline font-semibold text-3xl text-[#1b1c19] dark:text-white">
                  Tactile Habit Sticks
                </h1>
                <p className="text-sm text-[#444748] dark:text-[#a1a1aa] mt-1">
                  Gentle physical-feeling ritual tracking for serene momentum.
                </p>
              </div>
              <button
                onClick={() => setIsHabitsModalOpen(true)}
                className="px-4 py-2 bg-[#006b5e] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                + Add Habit Stick
              </button>
            </div>
            {/* Quick in-page habit sticks display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habitSticks.map((habit) => (
                <div
                  key={habit.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#18191d] border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-8 rounded-sm shadow-xs"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-base text-[#1b1c19] dark:text-white">
                          {habit.title}
                        </span>
                        <span className="text-xs text-[#444748] dark:text-[#a1a1aa]">
                          {habit.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.03] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      {weekDays.map((d) => {
                        const isChecked = !!habit.completedDays[d.dayId];
                        return (
                          <button
                            key={d.dayId}
                            type="button"
                            onClick={() => handleToggleHabitDay(habit.id, d.dayId)}
                            className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all ${
                              isChecked
                                ? 'text-white shadow-xs'
                                : 'bg-[#f5f3ee] dark:bg-[#25262c] text-[#444748] dark:text-[#a1a1aa]'
                            }`}
                            style={isChecked ? { backgroundColor: habit.color } : {}}
                          >
                            <span className="text-[10px] font-bold">{d.shortName[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHabits={() => setIsHabitsModalOpen(true)}
        onOpenFocus={() => setIsFocusTimerOpen(true)}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        defaultDayId={addTaskDefaultDay}
        weekDays={weekDays}
      />

      {/* Habit Sticks Modal */}
      <HabitSticksModal
        isOpen={isHabitsModalOpen}
        onClose={() => setIsHabitsModalOpen(false)}
        habitSticks={habitSticks}
        onToggleHabitDay={handleToggleHabitDay}
        onAddHabit={handleAddHabit}
      />

      {/* Zen Focus & Soundscape Timer */}
      <ZenFocusTimer
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetData={handleResetData}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />
    </div>
  );
}
