/**
 * Client-side rate limiter and brute force protection for authentication.
 * Works per-email to prevent targeted attacks.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATIONS_MS = [
  1 * 60 * 1000,   // 1 min after 5 failures
  5 * 60 * 1000,   // 5 min after 10 failures
  15 * 60 * 1000,  // 15 min after 15 failures
  60 * 60 * 1000,  // 1 hour after 20+ failures
];

const attempts = new Map<string, AttemptRecord>();

function getRecord(key: string): AttemptRecord {
  const record = attempts.get(key);
  if (!record) {
    return { count: 0, firstAttempt: Date.now(), lockedUntil: null };
  }
  // Reset window if expired
  if (Date.now() - record.firstAttempt > WINDOW_MS && !record.lockedUntil) {
    return { count: 0, firstAttempt: Date.now(), lockedUntil: null };
  }
  return record;
}

function getLockoutDuration(totalFailures: number): number {
  const tier = Math.floor((totalFailures - 1) / MAX_ATTEMPTS);
  const idx = Math.min(tier, LOCKOUT_DURATIONS_MS.length - 1);
  return LOCKOUT_DURATIONS_MS[idx];
}

export function checkRateLimit(email: string): { allowed: boolean; retryAfterSeconds?: number } {
  const key = email.toLowerCase().trim();
  const record = getRecord(key);

  if (record.lockedUntil) {
    const remaining = record.lockedUntil - Date.now();
    if (remaining > 0) {
      return { allowed: false, retryAfterSeconds: Math.ceil(remaining / 1000) };
    }
    // Lockout expired, keep count but allow retry
    record.lockedUntil = null;
    attempts.set(key, record);
  }

  return { allowed: true };
}

export function recordFailedAttempt(email: string): { lockedOut: boolean; retryAfterSeconds?: number } {
  const key = email.toLowerCase().trim();
  const record = getRecord(key);

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS && record.count % MAX_ATTEMPTS === 0) {
    const duration = getLockoutDuration(record.count);
    record.lockedUntil = Date.now() + duration;
    attempts.set(key, record);
    return { lockedOut: true, retryAfterSeconds: Math.ceil(duration / 1000) };
  }

  attempts.set(key, record);
  return { lockedOut: false };
}

export function recordSuccessfulAttempt(email: string): void {
  attempts.delete(email.toLowerCase().trim());
}

export function getRemainingAttempts(email: string): number {
  const key = email.toLowerCase().trim();
  const record = getRecord(key);
  const used = record.count % MAX_ATTEMPTS;
  return MAX_ATTEMPTS - used;
}

export function formatRetryTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    return `${h} hora${h > 1 ? 's' : ''}`;
  }
  if (seconds >= 60) {
    const m = Math.ceil(seconds / 60);
    return `${m} minuto${m > 1 ? 's' : ''}`;
  }
  return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
}
