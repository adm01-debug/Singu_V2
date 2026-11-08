import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function areUuidsEqual(left: unknown, right: string): boolean {
  if (typeof left !== 'string') return false;
  return left.trim().replace(/[-{}]/g, '').toLowerCase()
    === right.trim().replace(/[-{}]/g, '').toLowerCase();
}

const SAFE_URL_RE = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

/** Sanitize a user-supplied URL before setting as href. Returns '#' for unsafe protocols (e.g. javascript:).
 *  Same-origin relative paths (starting with /) are allowed; protocol-relative URLs (//) are not. */
export const safehref = (url: string | null | undefined): string =>
  url && SAFE_URL_RE.test(url) ? url : '#';
