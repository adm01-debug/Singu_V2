import { useEffect } from 'react';
import type { Metric } from 'web-vitals';
import { logger } from '@/lib/logger';
import { captureError } from '@/lib/errorReporting';

/** Thresholds (Google "good" → "poor" boundary). */
const THRESHOLDS: Record<string, number> = {
  LCP: 2500,
  CLS: 0.1,
  INP: 200,
  FCP: 1800,
  TTFB: 800,
};

/**
 * Hook para monitorar Core Web Vitals em produção.
 * Reporta LCP, INP, CLS, FCP e TTFB. Quando o sample excede o threshold "good",
 * envia para o pipeline central de errorReporting com metadata `source: 'web-vitals'`.
 */
export function useWebVitals() {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const reportMetric = (metric: Metric) => {
      const value = metric.value;
      const entry = {
        name: metric.name,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        rating: metric.rating,
        delta: Math.round(metric.delta),
        id: metric.id,
        navigationType: metric.navigationType,
      };

      // sessionStorage rolling buffer
      try {
        const existing = JSON.parse(sessionStorage.getItem('web-vitals') || '[]');
        existing.push(entry);
        sessionStorage.setItem('web-vitals', JSON.stringify(existing.slice(-20)));
      } catch {
        // noop
      }

      // Threshold breach → captureError pipeline
      const threshold = THRESHOLDS[metric.name];
      if (threshold !== undefined && value > threshold) {
        const err = new Error(`[Web Vital] ${metric.name} above threshold: ${entry.value} > ${threshold}`);
        captureError(err, undefined, {
          source: 'web-vitals',
          metric: metric.name,
          value: entry.value,
          rating: metric.rating,
          threshold,
          route: typeof window !== 'undefined' ? window.location.pathname : undefined,
        });
      }

      if (import.meta.env.DEV) {
        logger.info(`[Web Vital] ${metric.name}: ${entry.value} (${metric.rating})`);
      }
    };

    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      onCLS(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onFCP(reportMetric);
      onTTFB(reportMetric);
    }).catch(() => {});
  }, []);
}

