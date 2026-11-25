import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

type ApiErrorBody = { error?: { message?: string; details?: unknown } };

/** Turns any API or network error into a sentence for the user. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return '';
  if (typeof err === 'object' && 'status' in (err as object)) {
    const e = err as FetchBaseQueryError;
    if (e.status === 'FETCH_ERROR') return 'Cannot reach the server. Check your internet connection.';
    const body = e.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
  }
  const se = err as SerializedError;
  if (se?.message) return se.message;
  return fallback;
}

export function errorDetails<T = unknown>(err: unknown): T | undefined {
  if (typeof err === 'object' && err && 'data' in err) {
    return ((err as { data?: ApiErrorBody }).data?.error?.details as T) ?? undefined;
  }
  return undefined;
}

export const isNetworkError = (err: unknown) =>
  typeof err === 'object' && !!err && (err as FetchBaseQueryError).status === 'FETCH_ERROR';

export const rupees = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}`;

/** Today as YYYY-MM-DD in the browser's local time (the school's time zone in practice). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Downloads a file from an authenticated endpoint (Excel template, exports). */
export async function downloadWithAuth(path: string, filename: string, token: string | null): Promise<void> {
  const res = await fetch(`/api/v1${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    let message = 'Download failed';
    try {
      message = ((await res.json()) as ApiErrorBody).error?.message ?? message;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
