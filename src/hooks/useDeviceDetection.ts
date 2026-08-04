import { useMemo } from 'react';

interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  deviceName: string;
  isMobile: boolean;
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Outro';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Outro';
}

function generateFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() ?? '0',
  ];
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function useDeviceDetection(): DeviceInfo {
  return useMemo(() => ({
    fingerprint: generateFingerprint(),
    browser: getBrowser(),
    os: getOS(),
    deviceName: `${getBrowser()} em ${getOS()}`,
    isMobile: /Android|iPhone|iPad/i.test(navigator.userAgent),
  }), []);
}
