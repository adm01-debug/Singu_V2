import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { ExternalSocialMedia } from '@/hooks/useContactRelationalData';

type Platform = 'linkedin' | 'twitter' | 'instagram';

function normalizePlatform(p: string): Platform | null {
  const v = p.toLowerCase();
  if (v === 'linkedin') return 'linkedin';
  if (v === 'twitter' || v === 'x') return 'twitter';
  if (v === 'instagram') return 'instagram';
  return null;
}

function buildUrl(s: ExternalSocialMedia, platform: Platform): string | null {
  if (s.url?.startsWith('http')) return s.url;
  const handle = s.handle?.replace(/^@/, '').trim();
  if (!handle) return null;
  if (platform === 'linkedin') return `https://www.linkedin.com/in/${handle}`;
  if (platform === 'twitter') return `https://x.com/${handle}`;
  if (platform === 'instagram') return `https://instagram.com/${handle}`;
  return null;
}

export interface EnrichResult {
  platform: Platform;
  url: string;
  ok: boolean;
  error?: string;
}

export function useEnrichSocialProfiles(contactId: string, socials: ExternalSocialMedia[]) {
  const queryClient = useQueryClient();

  const targets = socials
    .map((s) => {
      const platform = normalizePlatform(s.plataforma);
      if (!platform) return null;
      const url = buildUrl(s, platform);
      if (!url) return null;
      return { platform, url };
    })
    .filter((v): v is { platform: Platform; url: string } => v !== null);

  const mutation = useMutation({
    mutationFn: async (): Promise<EnrichResult[]> => {
      if (targets.length === 0) throw new Error('Nenhum perfil social cadastrado para enriquecer.');

      const results: EnrichResult[] = [];

      for (const t of targets) {
        try {
          const { error } = await supabase.functions.invoke('social-profile-scraper', {
            body: { contactId, platform: t.platform, profileUrl: t.url },
          });
          if (error) throw error;

          if (t.platform === 'linkedin') {
            const { error: elErr } = await supabase.functions.invoke('enrichlayer-linkedin', {
              body: { contactId, linkedinUrl: t.url },
            });
            if (elErr) logger.warn('enrichlayer-linkedin failed', { error: elErr.message });
          }

          results.push({ platform: t.platform, url: t.url, ok: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.warn('social scrape failed', { platform: t.platform, error: message });
          results.push({ platform: t.platform, url: t.url, ok: false, error: message });
        }
      }

      // Detectar eventos de vida (mudança de cargo etc.) após o refresh dos perfis
      try {
        await supabase.functions.invoke('social-events-detector', { body: { contactId } });
      } catch (err) {
        logger.warn('social-events-detector failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      return results;
    },
    onSuccess: (results) => {
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      const failSuffix = fail > 0 ? ` · ${fail} falha(s)` : '';
      if (ok > 0) toast.success(`${ok} perfil(is) sincronizado(s)${failSuffix}`);
      else toast.error('Nenhum perfil pôde ser sincronizado.');
      queryClient.invalidateQueries({ queryKey: ['social-intelligence', contactId] });
      queryClient.invalidateQueries({ queryKey: ['social-insights-history', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
      queryClient.invalidateQueries({ queryKey: ['behavioral-profile', contactId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao enriquecer perfis sociais.');
    },
  });

  return {
    targets,
    enrich: () => mutation.mutate(),
    isEnriching: mutation.isPending,
  };
}