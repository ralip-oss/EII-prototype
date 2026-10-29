import { DayInfo, Task, DayId, HabitStick, ReflectionEntry, MicroVictory } from '../types';
import { getWeekDays } from '../utils/dateUtils';

// Generate days configuration for the current week dynamically
export function getDaysConfigForWeek(weekOffset: number = 0): DayInfo[] {
  const weekDays = getWeekDays(undefined, weekOffset);
  const microFooters: Record<string, { label: string; icon: string }> = {
    mon: { label: 'Archived', icon: 'check_circle' },
    tue: { label: 'Client sync', icon: 'check_circle' },
    wed: { label: 'Studio sync', icon: 'schedule' },
    thu: { label: 'Active now', icon: 'expand_more' },
    fri: { label: 'Milestone', icon: 'flag' },
    sat: { label: 'Recharge', icon: 'park' },
    sun: { label: 'Prep', icon: 'local_dining' },
  };

  return weekDays.map((d) => ({
    id: d.dayId,
    name: d.dayName,
    shortName: d.shortName.toUpperCase(),
    dayNumber: d.dayNumber,
    fullDateStr: `${d.dayName}, ${d.monthName} ${d.dayNumber}`,
    color: d.color,
    isToday: d.isToday,
    badge: d.isToday ? 'Today' : undefined,
    microFooter: microFooters[d.dayId],
  }));
}

export const DAYS_CONFIG: DayInfo[] = getDaysConfigForWeek(0);

export function getInitialActivities(weekOffset: number = 0): Task[] {
  const currentWeekDays = getWeekDays(undefined, weekOffset);
  const getDateKey = (dayId: DayId) => currentWeekDays.find((d) => d.dayId === dayId)?.dateKey;

  return [];
  /*
      id: 't-mon-1',
      title: 'Weekly planning',
      dayId: 'mon',
      dateKey: getDateKey('mon'),
      time: '09:00',
      endTime: '09:45',
      duration: '45m',
      category: 'Work',
      completed: true,
      status: 'completed',
    },
    {
      id: 't-mon-2',
      title: 'Design sync',
      dayId: 'mon',
      dateKey: getDateKey('mon'),
      time: '11:30',
      endTime: '12:30',
      duration: '1h',
      category: 'Work',
      completed: true,
      status: 'completed',
    },
    {
      id: 't-mon-3',
      title: 'Deep work',
      dayId: 'mon',
      dateKey: getDateKey('mon'),
      time: '15:00',
      endTime: '17:00',
      duration: '2h',
      category: 'Focus',
      completed: true,
      status: 'completed',
    },

    // Tuesday
    {
      id: 't-tue-1',
      title: 'Client check-in',
      dayId: 'tue',
      dateKey: getDateKey('tue'),
      time: '10:00',
      endTime: '10:30',
      duration: '30m',
      category: 'Work',
      completed: true,
      status: 'completed',
    },
    {
      id: 't-tue-2',
      title: 'Sprint backlog',
      dayId: 'tue',
      dateKey: getDateKey('tue'),
      time: '14:00',
      endTime: '15:00',
      duration: '1h',
      category: 'Work',
      completed: true,
      status: 'completed',
    },

    // Wednesday
    {
      id: 't-wed-0a',
      title: 'System architecture review',
      dayId: 'wed',
      dateKey: getDateKey('wed'),
      time: '11:00',
      endTime: '12:30',
      duration: '1h 30m',
      category: 'Focus',
      completed: true,
      status: 'completed',
    },
    {
      id: 't-wed-0b',
      title: 'Design token audit',
      dayId: 'wed',
      dateKey: getDateKey('wed'),
      time: '15:00',
      endTime: '16:00',
      duration: '1h',
      category: 'Work',
      completed: true,
      status: 'completed',
    },

    // Thursday (Today)
    {
      id: 't-thu-1',
      title: 'Gym',
      dayId: 'thu',
      dateKey: getDateKey('thu'),
      time: '07:30',
      endTime: '08:30',
      duration: '1h',
      category: 'Health',
      completed: true,
      status: 'completed',
      location: 'Studio 3',
      notes: '07:30 – 08:30 • Upper body strength & 15 min mobility',
    },
    {
      id: 't-thu-2',
      title: 'Team meeting',
      dayId: 'thu',
      dateKey: getDateKey('thu'),
      time: '10:00',
      endTime: '11:00',
      duration: '1h',
      category: 'Work',
      completed: false,
      status: 'active',
      location: 'Room 4B',
      attendees: 6,
      meetLink: 'https://meet.google.com',
      notes: 'Weekly cross-functional cadence. Sync on release candidate and component tokens.',
    },
    {
      id: 't-thu-3',
      title: 'Lunch & Walk',
      dayId: 'thu',
      dateKey: getDateKey('thu'),
      time: '12:30',
      endTime: '13:30',
      duration: '1h',
      category: 'Personal',
      completed: true,
      status: 'completed',
      location: 'Park Loop',
      notes: '12:30 – 13:30 • Sourdough café & green garden loop (No screen time)',
    },
    {
      id: 't-thu-4',
      title: 'Study session',
      dayId: 'thu',
      dateKey: getDateKey('thu'),
      time: '14:00',
      endTime: '16:00',
      duration: '2h',
      category: 'Focus',
      completed: false,
      status: 'todo',
      focusPlaylist: 'Nils Frahm Ambient',
      notes: 'Review system architecture & design tokens. Refactor design tokens for dark theme high-contrast compliance and review API contracts.',
    },
    {
      id: 't-thu-5',
      title: 'Groceries',
      dayId: 'thu',
      dateKey: getDateKey('thu'),
      time: '18:30',
      endTime: '19:15',
      duration: '45m',
      category: 'Errands',
      completed: false,
      status: 'todo',
      location: 'Organic Market on 5th',
      notes: '18:30 – 19:15',
      checklist: [
        { id: 'c-1', text: 'Almond milk (unsweetened)', done: false },
        { id: 'c-2', text: 'Baby spinach (2 packs)', done: false },
        { id: 'c-3', text: 'Gluten-free oat flour', done: false },
      ],
    },

    // Friday
    {
      id: 't-fri-1',
      title: 'Project launch',
      dayId: 'fri',
      dateKey: getDateKey('fri'),
      time: '13:00',
      endTime: '14:00',
      duration: '1h',
      category: 'Work',
      completed: false,
      status: 'todo',
    },
    {
      id: 't-fri-2',
      title: 'Team social',
      dayId: 'fri',
      dateKey: getDateKey('fri'),
      time: '17:00',
      endTime: '18:00',
      duration: '1h',
      category: 'Personal',
      completed: false,
      status: 'todo',
    },
    {
      id: 't-fri-3',
      title: 'Weekly wrap-up',
      dayId: 'fri',
      dateKey: getDateKey('fri'),
      time: '18:00',
      endTime: '18:45',
      duration: '45m',
      category: 'Work',
      completed: false,
      status: 'todo',
    },

    // Saturday
    {
      id: 't-sat-1',
      title: "Farmer's Market",
      dayId: 'sat',
      dateKey: getDateKey('sat'),
      time: '10:00',
      endTime: '11:30',
      duration: '1h 30m',
      category: 'Personal',
      completed: false,
      status: 'todo',
    },
    {
      id: 't-sat-2',
      title: 'Long run',
      dayId: 'sat',
      dateKey: getDateKey('sat'),
      time: '16:00',
      endTime: '17:00',
      duration: '1h',
      category: 'Health',
      completed: false,
      status: 'todo',
    },

    // Sunday
    {
      id: 't-sun-1',
      title: 'Reading & tea',
      dayId: 'sun',
      dateKey: getDateKey('sun'),
      time: '11:00',
      endTime: '12:00',
      duration: '1h',
      category: 'Personal',
      completed: false,
      status: 'todo',
    },
    {
      id: 't-sun-2',
      title: 'Next week forecast',
      dayId: 'sun',
      dateKey: getDateKey('sun'),
      time: '17:30',
      endTime: '18:15',
      duration: '45m',
      category: 'Work',
      completed: false,
      status: 'todo',
    },
  ];
  */
}

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_HABIT_STICKS: HabitStick[] = [
  {
    id: 'hab-1',
    title: 'Morning Sunlight (15 min)',
    category: 'Health',
    color: '#E8735A',
    completedDays: { mon: true, tue: true, wed: true, thu: true, fri: false, sat: false, sun: false },
  },
  {
    id: 'hab-2',
    title: 'Deep Work Block (No tabs)',
    category: 'Focus',
    color: '#8DB255',
    completedDays: { mon: true, tue: true, wed: true, thu: false, fri: false, sat: false, sun: false },
  },
  {
    id: 'hab-3',
    title: 'Daily Movement / Workout',
    category: 'Health',
    color: '#E9A23B',
    completedDays: { mon: true, tue: true, wed: true, thu: true, fri: false, sat: false, sun: false },
  },
  {
    id: 'hab-4',
    title: 'Hydration 2.5 Liters',
    category: 'Health',
    color: '#3FA796',
    completedDays: { mon: true, tue: true, wed: false, thu: true, fri: false, sat: false, sun: false },
  },
  {
    id: 'hab-5',
    title: 'Digital Sunset (21:00)',
    category: 'Recharge',
    color: '#8B6FE0',
    completedDays: { mon: true, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
  },
  {
    id: 'hab-6',
    title: 'Quiet Reading (20 min)',
    category: 'Mind',
    color: '#4F86E8',
    completedDays: { mon: true, tue: true, wed: true, thu: false, fri: false, sat: false, sun: false },
  },
];

export const INITIAL_ROLLOVER_TASKS: Task[] = [];

export const INITIAL_REFLECTION: ReflectionEntry = {
  id: 'ref-1',
  prompt: 'What gave you energy this week?',
  answer:
    '"Smooth sprint completion on Friday and consistent morning gym sessions. Stepping away from slack notifications between 2 PM and 4 PM carved out immense mental breathing room."',
  dateStr: 'Friday 18:00 Entry',
  tags: ['Mindfulness', 'Deep Focus'],
};

export const INITIAL_MICRO_VICTORIES: MicroVictory[] = [
  { id: 'mv-1', day: 'Mon', text: '0 Inbox reached', color: '#E8735A' },
  { id: 'mv-2', day: 'Thu', text: '12k morning steps', color: '#3FA796' },
  { id: 'mv-3', day: 'Fri', text: 'Design Sprint shipped', color: '#4F86E8' },
  { id: 'mv-4', day: 'Sat', text: '9 hrs sleep logged', color: '#8B6FE0' },
];

export const HOTLINKED_ASSETS = {
  logo: 'https://lh3.googleusercontent.com/aida/AEtjO1Xeh_uJl4eDch1t4Zoir3_TWbiHmccJ-KU7v4AL9P038dlEyCpr1xGJHGUZYu8ePQG6NEJrs42Wxi31TA989BTE-G9gyGZVUT3XfZB5JiLSH9n230abbIWLTc3uvb6Jg41xyP9wlvxxIE91Nvq06LKZtrav-10OLBlfytvS4H2EukZprgTRaa11jzdLKi3bTs6N0DXZC68_XYSmh-0M2RxQbpeTG4dLg2juCGHY-Jq0Nir3X2Qsf_c9_8iK',
  workspaceAmbience:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDwtM3Pq5DKBjJvUAbsmvwdytV2l8E0d82ML8oA1nOBV2SflCDf_w7PnoyG1Cr0dPcXkpmM4IVj7a5Mw5QsE55f3xxwj3kJ7AENgnRflY8b3diRVNz6iaXmeITFieMaGeT8Qtex-szskI-lyn3CdXIMZZHalRtKhFWl_1pHKLoAN44SsTHJL8Ia4hZhfuaDhsi3TnWiQDW6xhIBGZHE27fZ5kXtVEY_zSdV-xQzhj2ZvbCLmQ7LmZHZLw',
  serenityCard:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBub-5aZHD2Vazf0kJNyIiB6VvnVk2J6GiQabpTf5iYl-C5mM3r8tOr7w1uVZr9MAM4yVxE0tfqldnIH_47YEyQT0z1UIcDG5KSq0vEReQnU8C_34YGJPZPOyV8HYNX8S2Y3YJDF5bHZjpcPI8tKfmRLTmpWPAi8fjTtqiFQW3-VapColM6cynCle4kNZXuJd5w-IpSI7gvRaDIv_xu48QkthX-ACBHcDAsMwYSzOuN3RcqlYryS-oF9g',
};
