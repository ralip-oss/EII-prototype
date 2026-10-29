export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  dayId: DayId;
  dateKey?: string; // e.g. "2026-10-15"
  time: string; // e.g. "09:00", "14:00"
  duration?: string; // e.g. "30m", "45m", "1h", "2h"
  endTime?: string; // e.g. "17:00"
  category?: 'Focus' | 'Work' | 'Health' | 'Personal' | 'Errands' | string;
  completed: boolean;
  status: 'todo' | 'active' | 'completed';
  color?: string; // Hex color code
  locked?: boolean; // If true, cannot be dragged
  repeat?: 'once' | 'weekly' | 'monthly' | 'yearly';
  location?: string;
  notes?: string;
  checklist?: ChecklistItem[];
  attendees?: number;
  meetLink?: string;
  focusPlaylist?: string;
  quietReminder?: boolean;
  isArchived?: boolean;
}

export interface DayInfo {
  id: DayId;
  name: string; // e.g. "Wednesday"
  shortName: string; // e.g. "WED"
  dayNumber: number; // e.g. 16
  fullDateStr: string; // e.g. "Wednesday, Oct 16"
  color: string; // e.g. "#8DB255"
  isToday: boolean;
  badge?: string; // e.g. "Today"
  microFooter?: {
    label: string;
    icon: string;
  };
}

export interface HabitStick {
  id: string;
  title: string;
  color: string;
  category: string;
  completedDays: Record<DayId, boolean>;
}

export interface ReflectionEntry {
  id: string;
  prompt: string;
  answer: string;
  dateStr: string;
  tags: string[];
}

export interface MicroVictory {
  id: string;
  day: string;
  text: string;
  color: string;
}
