import { teacherApi } from '../api/teacherApi';
import type { AppDispatch } from '../app/store';
import type { AttendanceSubmit, TeacherDashboard } from '../types';

/**
 * Weak connection support (T4 / T3):
 * - attendance that fails to send is kept on the device and sent again when back online;
 * - the last timetable is cached so the dashboard still shows periods offline.
 * The server stores one record per student per date, so sending twice is harmless.
 */
const QUEUE_KEY = 'teacher-attendance-queue';
const DASH_KEY = 'teacher-dashboard-cache';

export interface QueuedAttendance extends AttendanceSubmit {
  clientSubmissionId: string;
  className: string;
  savedAt: string;
}

export function readQueue(): QueuedAttendance[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedAttendance[];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedAttendance[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('attendance-queue-changed'));
}

export function enqueueAttendance(item: QueuedAttendance) {
  // Keep only the latest submission per class and date
  writeQueue([...readQueue().filter((q) => !(q.classId === item.classId && q.date === item.date)), item]);
}

let syncing = false;

/** Sends queued attendance; stops at the first network error and keeps the rest. */
export async function syncAttendanceQueue(dispatch: AppDispatch): Promise<number> {
  if (syncing || !navigator.onLine) return 0;
  syncing = true;
  let sent = 0;
  try {
    for (const item of readQueue()) {
      const { className: _c, savedAt: _s, ...body } = item;
      void _c;
      void _s;
      const result = await dispatch(teacherApi.endpoints.submitAttendance.initiate(body));
      if ('error' in result && result.error) {
        const status = (result.error as { status?: unknown }).status;
        if (status === 'FETCH_ERROR') break; // still offline
        // A real rejection (e.g. edit window closed): drop it so it does not block the rest
      }
      writeQueue(readQueue().filter((q) => q.clientSubmissionId !== item.clientSubmissionId));
      sent++;
    }
  } finally {
    syncing = false;
  }
  return sent;
}

export function cacheDashboard(d: TeacherDashboard) {
  try {
    localStorage.setItem(DASH_KEY, JSON.stringify(d));
  } catch {
    /* storage full */
  }
}

export function cachedDashboard(): TeacherDashboard | null {
  try {
    const raw = localStorage.getItem(DASH_KEY);
    return raw ? (JSON.parse(raw) as TeacherDashboard) : null;
  } catch {
    return null;
  }
}

export const newSubmissionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
