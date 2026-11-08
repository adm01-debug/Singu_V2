import { useEffect, useState } from 'react';
import { startOfDay } from 'date-fns';

export function useLocalDay(): number {
  const [day, setDay] = useState(() => startOfDay(new Date()).getTime());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = new Date();
      setDay(startOfDay(now).getTime());
      const nextDay = new Date(now);
      nextDay.setHours(24, 0, 0, 0);
      timer = setTimeout(refresh, nextDay.getTime() - now.getTime());
    };
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return day;
}
