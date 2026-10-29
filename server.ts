import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

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
  duration: string; // e.g. "1h" or "45m"
  timeConstraint?: string; // e.g. "08:00 - 18:30" or "Morning"
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

// AI Endpoint to smartly arrange multiple activities
app.post('/api/gemini/schedule-activities', async (req, res) => {
  try {
    const {
      activities,
      existingActivities,
      weekDays,
      refinementFeedback,
      previousProposal,
    }: {
      activities: BatchActivityRequest[];
      existingActivities: ExistingActivitySummary[];
      weekDays: WeekDaySummary[];
      refinementFeedback?: string;
      previousProposal?: any[];
    } = req.body;

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'No activities provided' });
    }

    const systemPrompt = `You are a calm, elite weekly scheduling architect.
Your job is to smartly and effectively place multiple requested recurring activities across the 7 days of the week (Monday through Sunday), seamlessly integrating with any existing activities already on the schedule.

CRITICAL SCHEDULING RULES:
1. NO OVERLAPPING: Never schedule a new activity to overlap with any existing activity or another newly scheduled activity.
2. 30-MINUTE INTERVALS: All activity start times must be aligned to 30-minute intervals (e.g. "08:00", "08:30", "09:00", "14:30", etc.).
3. MINIMUM DURATION: Every activity session is at least 30 minutes, or the specified custom duration.
4. RESPECT CONSTRAINTS:
   - If an activity has specific hour constraints (e.g., "only from 08:00 to 18:30"), it MUST start at or after the earliest hour and finish at or before the latest hour.
   - Frequency: Schedule exactly the requested number of occurrences per week (e.g. if frequency is 3, create 3 distinct sessions spread across different days).
   - Space recurring activities mindfully (e.g. gym on Mon/Wed/Fri rather than consecutive days if possible, or follow the user's description).
   - Incorporate the user's description instructions.
   - If user provided REFINEMENT FEEDBACK / REQUESTED CHANGES, prioritize fulfilling those adjustments explicitly.
5. VALID DAYS: dayId must be one of 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', and match the dateKey for that day from the weekDays list.
6. Return clean JSON matching the schema.`;

    const userPrompt = `Please arrange the following requested activities for the week:

REQUESTED ACTIVITIES TO SCHEDULE:
${JSON.stringify(activities, null, 2)}

WEEK DAYS CALENDAR (Use these exact dayIds and dateKeys):
${JSON.stringify(weekDays, null, 2)}

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
Produce a balanced, optimal weekly plan with start time ("HH:MM") and end time ("HH:MM") in 30-minute intervals.`;

    // Attempt Gemini call
    let scheduledResults: any[] = [];
    let reasoning = 'Activities balanced mindfully across the week with no overlapping blocks.';

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reasoning: {
                  type: Type.STRING,
                  description: 'Brief 1-2 sentence explanation of why the activities were arranged this way.',
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
                      duration: { type: Type.STRING, description: 'e.g. 1h, 45m, 1h 30m' },
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
          scheduledResults = parsed.scheduledActivities;
          if (parsed.reasoning) reasoning = parsed.reasoning;
        }
      } catch (geminiErr) {
        console.warn('Gemini call failed or timed out, using intelligent local scheduler:', geminiErr);
      }
    }

    // Fallback algorithmic scheduler if Gemini was not available or produced empty
    if (!scheduledResults || scheduledResults.length === 0) {
      scheduledResults = fallbackSmartScheduler(activities, existingActivities, weekDays);
      reasoning = 'Smart algorithmic scheduler optimized spacing and avoided busy hours.';
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
  return Math.max(30, total || 60);
}

// Algorithmic scheduler fallback to ensure 100% reliability
function fallbackSmartScheduler(
  activities: BatchActivityRequest[],
  existing: ExistingActivitySummary[],
  weekDays: WeekDaySummary[]
) {
  const results: any[] = [];
  const occupiedSlots = new Set<string>();

  // Helper to convert HH:MM to slot index (0 to 47)
  const timeToSlot = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 2 + (m >= 30 ? 1 : 0);
  };
  const slotToTime = (slot: number) => {
    const h = Math.floor(slot / 2);
    const m = (slot % 2) * 30;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Mark existing occupied slots
  existing.forEach((act) => {
    const startSlot = timeToSlot(act.time || '09:00');
    const durMins = parseDurationToMinutes(act.duration);
    const slotsCount = Math.max(1, Math.ceil(durMins / 30));
    for (let s = startSlot; s < startSlot + slotsCount; s++) {
      occupiedSlots.add(`${act.dayId}_${s}`);
    }
  });

  const dayOrder = ['mon', 'wed', 'fri', 'tue', 'thu', 'sat', 'sun'];

  activities.forEach((act) => {
    const freq = Math.min(7, Math.max(1, act.frequency || 1));
    const durMins = parseDurationToMinutes(act.duration);
    const slotsCount = Math.max(1, Math.ceil(durMins / 30));

    let earliestSlot = 16; // 08:00
    let latestSlot = 38; // 19:00
    if (act.earliestHour) earliestSlot = timeToSlot(act.earliestHour);
    if (act.latestHour) latestSlot = timeToSlot(act.latestHour) - slotsCount;

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
          const endTimeStr = slotToTime(s + slotsCount);
          results.push({
            title: act.title,
            dayId,
            dateKey: matchedDay?.dateKey,
            time: startTimeStr,
            endTime: endTimeStr,
            duration: act.duration || `${durMins / 60}h`,
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
