/**
 * Shared formatting utilities for Ficha 360 filter labels.
 */

/** Returns a compact period label: 7→'7d', 30→'30d', 365→'1a', default→'90d'. */
export function periodLabelShort(days: number): string {
  return days === 7 ? '7d' : days === 30 ? '30d' : days === 365 ? '1a' : '90d';
}
