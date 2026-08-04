/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API (navigator.vibrate) with graceful fallback.
 */

const supportsVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

/** Light tap — confirmations, toggles */
export function hapticLight() {
  if (supportsVibration) navigator.vibrate(10);
}

/** Medium tap — successful actions */
export function hapticMedium() {
  if (supportsVibration) navigator.vibrate(25);
}

/** Heavy tap — destructive actions, errors */
export function hapticHeavy() {
  if (supportsVibration) navigator.vibrate([30, 50, 30]);
}

/** Success pattern — milestone completed */
export function hapticSuccess() {
  if (supportsVibration) navigator.vibrate([10, 30, 10, 30, 10]);
}

/** Warning pattern — attention needed */
export function hapticWarning() {
  if (supportsVibration) navigator.vibrate([50, 100, 50]);
}
