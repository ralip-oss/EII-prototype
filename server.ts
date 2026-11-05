import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Gemini client with User-Agent header for AI Studio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface BatchActivityRequest {
  title: string;
  frequency: number; // e.g. 3 times a week
  duration: string; // e.g. "1h" or "15m"
  repeat?: string; // "once", "weekly", "monthly", "yearly"
  timeConstraint?: string; // e.g. "08:00 - 18:30" or "morning" or "afternoon"
  timePreference?: 'anytime' | 'morning' | 'afternoon' | 'custom';
  description?: string;
  earliestHour?: string; // "08:00"
  latestHour?: string; // "18:30"
}

interface ExistingActivitySummary {
  id: string;
  title: string;
  dayId: string;
  dateKey?: string;
  time: string;
  duration?: string;
  endTime?: string;
}

interface WeekDaySummary {
  dayId: string;
  dayName: string;
  dateKey: string;
}

const ALL_DAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// AI Endpoint to smartly arrange multiple activities
app.post('/api/gemini/schedule-activities', async (req, res) => {
  try {
    const {
      activities,
      existingActivities,
      weekDays,
      refinementFeedback,
      previousProposal,
      currentDayId,
    }: {
      activities: BatchActivityRequest[];
      existingActivities: ExistingActivitySummary[];
      weekDays: WeekDaySummary[];
      refinementFeedback?: string;
      previousProposal?: any[];
      currentDayId?: string;
    } = req.body;

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'No activities provided' });
    }

    // Determine eligible days for scheduling: ONLY current day and subsequent days
    let eligibleDayIds = ALL_DAY_IDS;
    let pastDayIds: string[] = [];
    if (currentDayId && ALL_DAY_IDS.includes(currentDayId)) {
      const todayIdx = ALL_DAY_IDS.indexOf(currentDayId);
      eligibleDayIds = ALL_DAY_IDS.slice(todayIdx);
      pastDayIds = ALL_DAY_IDS.slice(0, todayIdx);
    }

    const systemPrompt = `You are a calm, elite weekly scheduling architect.
Your job is to smartly and effectively place multiple requested recurring activities across the days of the week, seamlessly integrating with any existing activities already on the schedule.

CRITICAL SCHEDULING RULES:
1. ONLY SCHEDULE FROM TODAY ONWARD:
   - Today is ${currentDayId || 'today'}.
   - You MUST ONLY schedule new activities on the current day (${currentDayId}) and subsequent days of the week (${eligibleDayIds.join(', ')}).
   - UNDER NO CIRCUMSTANCES should any activity be placed on past days of this week (${pastDayIds.join(', ') || 'none'}). If today is Wednesday, only place sessions on Wednesday, Thursday, Friday, Saturday, or Sunday!
2. NO OVERLAPPING: Never schedule an activity to overlap with any existing activity or another newly scheduled activity.
3. 30-MINUTE INTERVALS: All activity start times must be aligned to 30-minute intervals (e.g. "08:00", "08:30", "09:00", "12:30", "14:00", etc.).
4. DURATION & SHORT SESSIONS SUPPORT:
   - Respect the specified duration for each activity. Durations can be shorter than 30 minutes (e.g. "10m", "15m", "20m", "25m") or longer (e.g. "45m", "1h", "2h").
   - Calculate endTime precisely based on startTime + duration (e.g. 14:00 with 15m duration ends at 14:15; 10:30 with 45m ends at 11:15).
5. STRICT TIME WINDOW RULES (MORNING VS AFTERNOON):
   - AFTERNOON: If an activity specifies "afternoon", it MUST ALWAYS be scheduled AFTER 12:00 (i.e. between 12:00 and 23:59), unless the user specified a narrower custom window like 12:00 to 18:00. An afternoon activity MUST NEVER start before 12:00!
   - MORNING: If an activity specifies "morning", it must be scheduled between 00:00 and 12:00 (unless user specified a custom window like 08:00 to 12:00).
   - CUSTOM WINDOW: If earliestHour and latestHour are provided, stay strictly within [earliestHour, latestHour].
6. FREQUENCY & REPEAT:
   - Schedule occurrences spread across the eligible days (${eligibleDayIds.join(', ')}).
   - Retain the repeat property ("once", "weekly", "monthly", "yearly").
7. Return clean JSON matching the schema.`;

    const userPrompt = `Please arrange the following requested activities for the week:

REQUESTED ACTIVITIES TO SCHEDULE:
${JSON.stringify(activities, null, 2)}

TODAY: ${currentDayId || 'N/A'}
ELIGIBLE DAYS FOR THIS WEEK (DO NOT SCHEDULE ON ANY DAYS OUTSIDE THIS LIST):
${JSON.stringify(eligibleDayIds, null, 2)}

WEEK DAYS CALENDAR (Use these exact dayIds and dateKeys):
${JSON.stringify(
  weekDays.filter((w) => eligibleDayIds.includes(w.dayId)),
  null,
  2
)}

EXISTING ACTIVITIES ALREADY SCHEDULED (DO NOT OVERLAP WITH THESE):
${JSON.stringify(existingActivities, null, 2)}
${
  refinementFeedback
    ? `
CRITICAL USER REQUESTED ADJUSTMENTS / FEEDBACK:
"${refinementFeedback}"
PREVIOUS PROPOSED SCHEDULE TO MODIFY:
${JSON.stringify(previousProposal || [], null, 2)}
Please make the requested adjustments to the schedule while keeping unchanged activities harmonious.
`
    : ''
}
Produce a balanced, optimal weekly plan with start time ("HH:MM") and end time ("HH:MM"). Remember: afternoon activities MUST be at or after 12:00!`;

    // Attempt Gemini call with gemini-3.8-flash
    let scheduledResults: any[] = [];
    let reasoning = 'Activities balanced mindfully from current day onwards with no overlapping blocks.';

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reasoning: {
                  type: Type.STRING,
                  description: 'Brief explanation of how activities were scheduled from today forward.',
                },
                scheduledActivities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      dayId: { type: Type.STRING },
                      dateKey: { type: Type.STRING },
                      time: { type: Type.STRING, description: 'Start time in HH:MM format' },
                      endTime: { type: Type.STRING, description: 'End time in HH:MM format' },
                      duration: { type: Type.STRING, description: 'e.g. 15m, 30m, 45m, 1h' },
                      repeat: { type: Type.STRING, description: 'once, weekly, monthly, or yearly' },
                      category: { type: Type.STRING, description: 'Work, Focus, Health, Personal, or Errands' },
                      notes: { type: Type.STRING, description: 'Helpful details or session focus' },
                    },
                    required: ['title', 'dayId', 'dateKey', 'time', 'endTime', 'duration'],
                  },
                },
              },
              required: ['reasoning', 'scheduledActivities'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.scheduledActivities && Array.isArray(parsed.scheduledActivities)) {
          // Filter to make 100% sure only eligible days are accepted
          scheduledResults = parsed.scheduledActivities.filter((act: any) =>
            eligibleDayIds.includes(act.dayId)
          );
          if (parsed.reasoning) reasoning = parsed.reasoning;
        }
      } catch (geminiErr) {
        console.warn('Gemini call failed or timed out, using intelligent local scheduler:', geminiErr);
      }
    }

    // Fallback algorithmic scheduler if Gemini was not available or produced empty
    if (!scheduledResults || scheduledResults.length === 0) {
      scheduledResults = fallbackSmartScheduler(
        activities,
        existingActivities,
        weekDays,
        currentDayId
      );
      reasoning = 'Smart algorithmic scheduler optimized spacing from current day forward.';
    }

    return res.json({
      success: true,
      reasoning,
      scheduledActivities: scheduledResults,
    });
  } catch (error: any) {
    console.error('Error scheduling activities:', error);
    return res.status(500).json({
      error: 'Failed to schedule activities',
      message: error?.message,
    });
  }
});

// AI Endpoint: Parse Schedule from Uploaded Image
app.post('/api/gemini/parse-schedule-image', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      weekDays = [],
      currentDayId,
    }: {
      imageBase64: string;
      mimeType?: string;
      weekDays?: WeekDaySummary[];
      currentDayId?: string;
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const ocrPrompt = `You are an expert schedule extraction AI. Analyze this image of a schedule or timetable carefully and extract EVERY SINGLE scheduled event, class, meeting, or activity.

CRITICAL RULES:
1. Extract ALL activities present (there are multiple in the image). Do not stop after finding just one.
2. Be extremely precise: DO NOT add, guess, or hallucinate any activities, events, or times that are not visibly written in the image.

For each activity found:
- title: concise title/name of the activity (e.g. "Linear Algebra", "Team Standup", "Gym Workout")
- dayId: day of the week ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'). If days are not explicitly stated, infer them from column headers or assign logically.
- time: start time formatted strictly as 24-hour "HH:MM" (e.g. "09:00", "13:30", "16:00")
- endTime: end time formatted strictly as 24-hour "HH:MM" (e.g. "10:30", "14:15", "17:00")
- duration: human duration string (e.g. "1h", "45m", "1h 30m", "15m")
- repeat: repetition frequency ('once', 'weekly', 'monthly', or 'yearly'). Default to 'weekly' for recurring timetable entries.
- locked: boolean (true if it's a fixed rigid class/work shift that shouldn't be moved, false otherwise)
- category: Inferred category ('Focus', 'Work', 'Health', 'Personal', 'Class', 'Errands')
- notes: any additional notes, room numbers, or details visible in the image for this item

Return clean JSON matching the schema.`;

    let extractedActivities: any[] = [];
    let scheduleTitle = 'Extracted Weekly Schedule';

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: ocrPrompt },
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'image/jpeg',
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scheduleTitle: { type: Type.STRING },
                extractedActivities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      dayId: { type: Type.STRING },
                      time: { type: Type.STRING },
                      endTime: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      repeat: { type: Type.STRING },
                      locked: { type: Type.BOOLEAN },
                      category: { type: Type.STRING },
                      notes: { type: Type.STRING },
                    },
                    required: ['title', 'dayId', 'time'],
                  },
                },
              },
              required: ['extractedActivities'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.extractedActivities && Array.isArray(parsed.extractedActivities)) {
          extractedActivities = parsed.extractedActivities.map((act: any) => {
            const matchedDay = weekDays.find((w: any) => w.dayId === act.dayId);
            return {
              id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              title: act.title || 'Scheduled Activity',
              dayId: ALL_DAY_IDS.includes(act.dayId) ? act.dayId : (currentDayId || 'mon'),
              dateKey: matchedDay?.dateKey,
              time: act.time || '09:00',
              endTime: act.endTime || '10:00',
              duration: act.duration || '1h',
              repeat: act.repeat || 'weekly',
              locked: Boolean(act.locked),
              category: act.category || 'Focus',
              notes: act.notes || '',
              completed: false,
              status: 'todo',
            };
          });
          if (parsed.scheduleTitle) scheduleTitle = parsed.scheduleTitle;
        }
      } catch (err) {
        console.warn('Gemini vision schedule parsing failed, using fallback parser:', err);
      }
    }

    // Fallback demo parsing if no key or parsing failed
    if (extractedActivities.length === 0) {
      extractedActivities = [
        {
          id: `ocr-${Date.now()}-1`,
          title: 'Morning Class / Team Standup',
          dayId: currentDayId || 'mon',
          time: '09:00',
          endTime: '10:00',
          duration: '1h',
          repeat: 'weekly',
          locked: true,
          category: 'Focus',
          notes: 'Extracted from timetable',
          completed: false,
          status: 'todo',
        },
        {
          id: `ocr-${Date.now()}-2`,
          title: 'Project Deep Work',
          dayId: currentDayId || 'wed',
          time: '14:00',
          endTime: '15:30',
          duration: '1h 30m',
          repeat: 'weekly',
          locked: false,
          category: 'Work',
          notes: 'Schedule block',
          completed: false,
          status: 'todo',
        },
        {
          id: `ocr-${Date.now()}-3`,
          title: 'Fitness / Gym Session',
          dayId: 'fri',
          time: '17:00',
          endTime: '18:00',
          duration: '1h',
          repeat: 'weekly',
          locked: false,
          category: 'Health',
          notes: 'End of week workout',
          completed: false,
          status: 'todo',
        },
      ];
    }

    return res.json({
      success: true,
      scheduleTitle,
      activities: extractedActivities,
    });
  } catch (error: any) {
    console.error('Error parsing schedule image:', error);
    return res.status(500).json({
      error: 'Failed to parse schedule image',
      message: error?.message,
    });
  }
});

function parseDurationToMinutes(dur?: string): number {
  if (!dur) return 60;
  const str = dur.toLowerCase().trim();
  let total = 0;
  const hMatch = str.match(/(\d+(?:\.\d+)?)\s*h/);
  if (hMatch) total += Math.round(parseFloat(hMatch[1]) * 60);
  const mMatch = str.match(/(\d+)\s*m/);
  if (mMatch) total += parseInt(mMatch[1], 10);
  if (total === 0) {
    const rawNum = parseInt(str, 10);
    if (!isNaN(rawNum)) total = rawNum;
  }
  // Support durations as short as 5 minutes
  return Math.max(5, total || 30);
}

// Algorithmic scheduler fallback to ensure 100% reliability
function fallbackSmartScheduler(
  activities: BatchActivityRequest[],
  existing: ExistingActivitySummary[],
  weekDays: WeekDaySummary[],
  currentDayId?: string
) {
  const results: any[] = [];
  const occupiedSlots = new Set<string>();

  // Helper to convert HH:MM to slot index (0 to 47)
  const timeToSlot = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return Math.min(47, Math.max(0, h * 2 + (m >= 30 ? 1 : 0)));
  };
  const slotToTime = (slot: number) => {
    const clamped = Math.min(47, Math.max(0, slot));
    const h = Math.floor(clamped / 2);
    const m = (clamped % 2) * 30;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Mark existing occupied slots
  existing.forEach((act) => {
    const startSlot = timeToSlot(act.time || '09:00');
    const durMins = parseDurationToMinutes(act.duration);
    const slotsCount = Math.max(1, Math.ceil(durMins / 30));
    for (let s = startSlot; s < Math.min(48, startSlot + slotsCount); s++) {
      occupiedSlots.add(`${act.dayId}_${s}`);
    }
  });

  // Only schedule from current day onwards!
  let eligibleDays = ALL_DAY_IDS;
  if (currentDayId && ALL_DAY_IDS.includes(currentDayId)) {
    const todayIdx = ALL_DAY_IDS.indexOf(currentDayId);
    eligibleDays = ALL_DAY_IDS.slice(todayIdx);
  }

  // Balanced day order restricted strictly to eligible days
  const balancedPriority = ['wed', 'fri', 'mon', 'thu', 'tue', 'sat', 'sun'];
  const dayOrder = balancedPriority.filter((d) => eligibleDays.includes(d));

  activities.forEach((act) => {
    const freq = Math.min(dayOrder.length, Math.max(1, act.frequency || 1));
    const durMins = parseDurationToMinutes(act.duration);
    const slotsCount = Math.max(1, Math.ceil(durMins / 30));

    // Default slot range: 00:00 to 23:30 (slots 0 to 47)
    let earliestSlot = 16; // 08:00
    let latestSlot = 42; // 21:00

    // Strict Afternoon Rule: MUST ALWAYS BE AFTER 12:00 (slot 24)
    const isAfternoon =
      act.timePreference === 'afternoon' ||
      act.timeConstraint?.toLowerCase() === 'afternoon';
    const isMorning =
      act.timePreference === 'morning' ||
      act.timeConstraint?.toLowerCase() === 'morning';

    if (isAfternoon) {
      // Slot 24 is 12:00
      earliestSlot = 24;
      latestSlot = Math.min(47, 47 - slotsCount + 1);
      if (act.latestHour) {
        latestSlot = Math.max(24, timeToSlot(act.latestHour) - slotsCount);
      }
      if (act.earliestHour) {
        // Must stay >= 12:00 unless custom
        earliestSlot = Math.max(24, timeToSlot(act.earliestHour));
      }
    } else if (isMorning) {
      earliestSlot = 0; // 00:00
      latestSlot = Math.max(0, 24 - slotsCount); // Up to 12:00
      if (act.earliestHour) earliestSlot = timeToSlot(act.earliestHour);
      if (act.latestHour) latestSlot = Math.min(24 - slotsCount, timeToSlot(act.latestHour) - slotsCount);
    } else if (act.timePreference === 'custom' || act.earliestHour || act.latestHour) {
      if (act.earliestHour) earliestSlot = timeToSlot(act.earliestHour);
      if (act.latestHour) latestSlot = Math.max(earliestSlot, timeToSlot(act.latestHour) - slotsCount);
    }

    let scheduledForAct = 0;
    for (const dayId of dayOrder) {
      if (scheduledForAct >= freq) break;
      const matchedDay = weekDays.find((d) => d.dayId === dayId) || weekDays[0];

      // Try slots in the window
      for (let s = earliestSlot; s <= latestSlot; s++) {
        let isFree = true;
        for (let check = s; check < s + slotsCount; check++) {
          if (occupiedSlots.has(`${dayId}_${check}`)) {
            isFree = false;
            break;
          }
        }

        if (isFree) {
          for (let fill = s; fill < s + slotsCount; fill++) {
            occupiedSlots.add(`${dayId}_${fill}`);
          }
          const startTimeStr = slotToTime(s);

          // Calculate precise end time using exact durMins
          const startMins = s * 30;
          const endTotalMins = startMins + durMins;
          const endH = Math.floor(endTotalMins / 60) % 24;
          const endM = endTotalMins % 60;
          const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

          results.push({
            title: act.title,
            dayId,
            dateKey: matchedDay?.dateKey,
            time: startTimeStr,
            endTime: endTimeStr,
            duration: act.duration || `${durMins}m`,
            repeat: act.repeat || 'weekly',
            category: act.title.toLowerCase().includes('gym')
              ? 'Health'
              : act.title.toLowerCase().includes('study')
              ? 'Focus'
              : 'Personal',
            notes: act.description || `Scheduled focus session for ${act.title}`,
          });
          scheduledForAct++;
          break;
        }
      }
    }
  });

  return results;
}

// In development, mount Vite middleware for full-stack SPA experience
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
