import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface IPInfo {
  ip: string;
  country: string;
  city: string;
  region: string;
}

export function useIPValidation() {
  const { data: ipInfo, isLoading } = useQuery<IPInfo | null>({
    queryKey: ['current-ip-info'],
    queryFn: async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const json = await res.json();
        return {
          ip: json.ip ?? '',
          country: json.country_code ?? '',
          city: json.city ?? '',
          region: json.region ?? '',
        };
      } catch (err) {
        logger.warn('[IPValidation] Falha ao obter IP:', err);
        return null;
      }
    },
    staleTime: 10 * 60_000,
    retry: false,
  });

  return { ipInfo, isLoading };
}
