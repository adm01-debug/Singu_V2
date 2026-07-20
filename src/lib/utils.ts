import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SAFE_URL_RE = /^(https?|mailto|tel):\/?\/?/i;

/** Sanitize a user-supplied URL before setting as href. Returns '#' for unsafe protocols (e.g. javascript:). */
export const safehref = (url: string | null | undefined): string =>
  url && SAFE_URL_RE.test(url) ? url : '#';
