import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 25, 25],
  error: [50, 25, 50, 25, 50],
  selection: 5,
};

export function useHapticFeedback() {
  const isSupported = 'vibrate' in navigator;

  const vibrate = useCallback((pattern: HapticPattern | number | number[]) => {
    if (!isSupported) return false;

    try {
      const vibrationPattern = typeof pattern === 'string' 
        ? hapticPatterns[pattern] 
        : pattern;
      
      return navigator.vibrate(vibrationPattern);
    } catch {
      return false;
    }
  }, [isSupported]);

  const light = useCallback(() => vibrate('light'), [vibrate]);
  const medium = useCallback(() => vibrate('medium'), [vibrate]);
  const heavy = useCallback(() => vibrate('heavy'), [vibrate]);
  const success = useCallback(() => vibrate('success'), [vibrate]);
  const warning = useCallback(() => vibrate('warning'), [vibrate]);
  const error = useCallback(() => vibrate('error'), [vibrate]);
  const selection = useCallback(() => vibrate('selection'), [vibrate]);

  const cancel = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(0);
    }
  }, [isSupported]);

  return {
    isSupported,
    vibrate,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    cancel,
  };
}

// Hook for button press haptic feedback
export function useButtonHaptic() {
  const haptic = useHapticFeedback();

  const onPress = useCallback(() => {
    haptic.light();
  }, [haptic]);

  const onLongPress = useCallback(() => {
    haptic.medium();
  }, [haptic]);

  return { onPress, onLongPress };
}
