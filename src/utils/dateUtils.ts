import { DayId } from '../types';

export interface CalendarDay {
  date: Date;
  dateKey: string; // "YYYY-MM-DD"
  dayId: DayId;
  dayName: string; // "Monday", etc.
  shortName: string; // "Mon", etc.
  monthName: string; // "Oct", etc.
  dayNumber: number; // 12, etc.
  year: number; // 2026
  fullDateStr: string; // "Monday, Oct 12"
  isToday: boolean;
  color: string;
}

export const DAY_COLORS: Record<DayId, string> = {
  mon: '#E8735A',
  tue: '#E9A23B',
  wed: '#8DB255',
  thu: '#3FA796',
  fri: '#4F86E8',
  sat: '#8B6FE0',
  sun: '#D9669A',
};

export const DAY_IDS: DayId[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FULL_DAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const SHORT_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Returns the actual real current date in local time
 */
export function getRealToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const BASE_TODAY = getRealToday();

export function getTodayDayId(): DayId {
  const today = getRealToday();
  const day = today.getDay(); // 0 is Sun, 1 is Mon, ... 6 is Sat
  const idx = day === 0 ? 6 : day - 1; // 0 for Mon, 6 for Sun
  return DAY_IDS[idx];
}

/**
 * Returns the Monday date for the week containing the given date + offset in weeks
 */
export function getMondayOfWeek(referenceDate: Date = getRealToday(), weekOffset: number = 0): Date {
  const d = new Date(referenceDate);
  // In JS, getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Distance to previous/current Monday
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the 7 days of the week starting from the Monday calculated with weekOffset
 */
export function getWeekDays(referenceDate: Date = getRealToday(), weekOffset: number = 0): CalendarDay[] {
  const realToday = getRealToday();
  const monday = getMondayOfWeek(referenceDate, weekOffset);
  const days: CalendarDay[] = [];

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(monday);
    curDate.setDate(monday.getDate() + i);

    const isToday =
      curDate.getFullYear() === realToday.getFullYear() &&
      curDate.getMonth() === realToday.getMonth() &&
      curDate.getDate() === realToday.getDate();

    const dayId = DAY_IDS[i];
    const yyyy = curDate.getFullYear();
    const mm = String(curDate.getMonth() + 1).padStart(2, '0');
    const dd = String(curDate.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    days.push({
      date: curDate,
      dateKey,
      dayId,
      dayName: FULL_DAY_NAMES[i],
      shortName: SHORT_DAY_NAMES[i],
      monthName: MONTH_NAMES[curDate.getMonth()],
      dayNumber: curDate.getDate(),
      year: curDate.getFullYear(),
      fullDateStr: `${FULL_DAY_NAMES[i]}, ${MONTH_NAMES[curDate.getMonth()]} ${curDate.getDate()}`,
      isToday,
      color: DAY_COLORS[dayId],
    });
  }

  return days;
}

/**
 * Format week header range string cleanly:
 * e.g. "Oct 12 – 18, 2026", "Oct 26 – Nov 1, 2026", "Dec 28, 2026 – Jan 3, 2027"
 */
export function formatWeekRange(weekDays: CalendarDay[]): string {
  if (!weekDays || weekDays.length < 7) return '';

  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  const firstMonth = firstDay.monthName;
  const lastMonth = lastDay.monthName;
  const firstYear = firstDay.year;
  const lastYear = lastDay.year;

  if (firstYear !== lastYear) {
    return `${firstMonth} ${firstDay.dayNumber}, ${firstYear} – ${lastMonth} ${lastDay.dayNumber}, ${lastYear}`;
  }

  if (firstMonth !== lastMonth) {
    return `${firstMonth} ${firstDay.dayNumber} – ${lastMonth} ${lastDay.dayNumber}, ${firstYear}`;
  }

  return `${firstMonth} ${firstDay.dayNumber} – ${lastDay.dayNumber}, ${firstYear}`;
}

/**
 * Returns month calendar grid for a given year and month (0-indexed)
 */
export interface MonthGridDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayId: DayId;
  color: string;
}

export function getMonthGrid(year: number, month: number): {
  monthName: string;
  year: number;
  days: MonthGridDay[];
} {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week for first day (0=Sun, 1=Mon, ..., 6=Sat)
  const startDay = firstDayOfMonth.getDay();
  // We want Monday=0, Sun=6
  const mondayOffset = startDay === 0 ? 6 : startDay - 1;

  const days: MonthGridDay[] = [];

  const realToday = getRealToday();
  // Previous month padding days
  for (let i = mondayOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const dayOfWeekIdx = (d.getDay() + 6) % 7;
    const dayId = DAY_IDS[dayOfWeekIdx];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    days.push({
      date: d,
      dateKey: `${yyyy}-${mm}-${dd}`,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday:
        d.getFullYear() === realToday.getFullYear() &&
        d.getMonth() === realToday.getMonth() &&
        d.getDate() === realToday.getDate(),
      dayId,
      color: DAY_COLORS[dayId],
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    const dayOfWeekIdx = (d.getDay() + 6) % 7;
    const dayId = DAY_IDS[dayOfWeekIdx];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    days.push({
      date: d,
      dateKey: `${yyyy}-${mm}-${dd}`,
      dayNumber: i,
      isCurrentMonth: true,
      isToday:
        d.getFullYear() === realToday.getFullYear() &&
        d.getMonth() === realToday.getMonth() &&
        d.getDate() === realToday.getDate(),
      dayId,
      color: DAY_COLORS[dayId],
    });
  }

  // Next month padding days to complete 7-day grid rows (multiples of 7, up to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dayOfWeekIdx = (d.getDay() + 6) % 7;
    const dayId = DAY_IDS[dayOfWeekIdx];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    days.push({
      date: d,
      dateKey: `${yyyy}-${mm}-${dd}`,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday:
        d.getFullYear() === realToday.getFullYear() &&
        d.getMonth() === realToday.getMonth() &&
        d.getDate() === realToday.getDate(),
      dayId,
      color: DAY_COLORS[dayId],
    });
  }

  return {
    monthName: FULL_MONTH_NAMES[month],
    year,
    days,
  };
}

/**
 * 48 30-minute intervals from 00:00 to 23:30
 */
export const HALF_HOUR_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, '0');
  HALF_HOUR_SLOTS.push(`${hh}:00`);
  HALF_HOUR_SLOTS.push(`${hh}:30`);
}

/**
 * Parse "HH:MM" to total minutes from midnight (0 to 1439)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight back to "HH:MM"
 */
export function minutesToTime(mins: number): string {
  const bounded = Math.max(0, Math.min(mins, 1439));
  const h = Math.floor(bounded / 60);
  const m = Math.floor(bounded % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Convert duration string or start/end times into duration minutes
 */
export function durationToMinutes(duration?: string, startTime?: string, endTime?: string): number {
  if (startTime && endTime) {
    const startM = timeToMinutes(startTime);
    const endM = timeToMinutes(endTime);
    if (endM > startM) {
      return endM - startM;
    }
  }

  if (!duration) return 60; // default 1 hour

  const d = duration.toLowerCase().trim();
  let total = 0;

  // match "2h", "1h 30m", "45m", "30m"
  const hMatch = d.match(/(\d+)\s*h/);
  if (hMatch) {
    total += parseInt(hMatch[1], 10) * 60;
  }
  const mMatch = d.match(/(\d+)\s*m/);
  if (mMatch) {
    total += parseInt(mMatch[1], 10);
  }

  return total > 0 ? total : 60;
}

/**
 * Curated harmonic palette for tasks (anti-slop, balanced, high legibility)
 */
export const TASK_COLOR_PALETTE = [
  '#006b5e', // Pine / Deep Teal
  '#d97706', // Warm Amber
  '#2563eb', // Royal Blue
  '#7c3aed', // Soft Purple
  '#d2624a', // Terracotta
  '#059669', // Emerald
  '#be185d', // Dusty Rose
  '#0284c7', // Sky Cyan
  '#475569', // Slate Steel
  '#ea580c', // Tangerine
  '#4f46e5', // Indigo
  '#4338ca', // Deep Violet
];

/**
 * Deterministically get the task color based on the task's title (case-insensitive)
 * or return the custom color if explicitly set on the task.
 */
export function getTaskColor(title?: string, customColor?: string): string {
  if (customColor) return customColor;
  if (!title) return TASK_COLOR_PALETTE[0];

  const normalized = title.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return TASK_COLOR_PALETTE[hash % TASK_COLOR_PALETTE.length];
}
