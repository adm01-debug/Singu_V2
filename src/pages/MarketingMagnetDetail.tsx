import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useMagnetDownloads, type LeadMagnet } from '@/hooks/useLeadMagnets';
import { useAuth } from '@/hooks/useAuth';
import { parseApiError } from '@/lib/errorMessages';

export default function MarketingMagnetDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: magnet, isLoading } = useQuery({
    queryKey: ['lead-magnet', id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('lead_magnets').select('id, user_id, title, slug, description, type, file_path, external_url, thumbnail_url, gated, form_id, download_count, view_count, is_published, created_at, updated_at').eq('id', id!).eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data as unknown as LeadMagnet | null;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const { data: downloads = [] } = useMagnetDownloads(id);

  const [draft, setDraft] = useState<LeadMagnet | null>(null);
  useEffect(() => { if (magnet) setDraft(magnet); }, [magnet]);

  if (isLoading || !draft) return <div className="container py-8 text-sm text-muted-foreground">Carregando...</div>;

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from('lead_magnets').update({
      title: draft.title,
      description: draft.description,
      type: draft.type,
      file_path: draft.file_path,
      external_url: draft.external_url,
      thumbnail_url: draft.thumbnail_url,
      gated: draft.gated,
    } as TablesUpdate<'lead_magnets'>).eq('user_id', user.id).eq('id', draft.id);
    if (error) toast.error(parseApiError(error));
    else {
      toast.success('Salvo!');
      qc.invalidateQueries({ queryKey: ['lead-magnet', id] });
      qc.invalidateQueries({ queryKey: ['lead-magnets'] });
    }
  };

  const url = `${window.location.origin}/lm/${draft.slug}`;

  return (
    <div className="container max-w-5xl py-6 space-y-4">
      <Helmet><title>{draft.title} — Lead magnet</title></Helmet>

      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1"><Link to="/marketing"><ArrowLeft className="w-4 h-4" /> Marketing</Link></Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => { navigator.clipboard.writeText(url).then(() => toast.success('URL copiada')).catch(() => toast.error('Não foi possível copiar')); }}>
            <Copy className="w-4 h-4" /> URL
          </Button>
          {draft.is_published && (
            <Button asChild size="sm" variant="outline" className="gap-1">
              <a href={`/lm/${draft.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> Abrir</a>
            </Button>
          )}
          <Button size="sm" variant="default" className="gap-1" onClick={save}><Save className="w-4 h-4" /> Salvar</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Configuração</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Título</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-1"><Label className="text-xs">Descrição</Label>
              <Textarea value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1"><Label className="text-xs">Tipo</Label>
              <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as LeadMagnet['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['ebook','webinar','whitepaper','template','video','checklist','other'] as const).map((t) =>
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">URL do arquivo (externa)</Label>
              <Input placeholder="https://..." value={draft.external_url ?? ''} onChange={(e) => setDraft({ ...draft, external_url: e.target.value })} />
            </div>
            <div className="space-y-1"><Label className="text-xs">Thumbnail URL</Label>
              <Input placeholder="https://..." value={draft.thumbnail_url ?? ''} onChange={(e) => setDraft({ ...draft, thumbnail_url: e.target.value })} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/60">
              <p>👁️ {draft.view_count} views · ⬇️ {draft.download_count} downloads</p>
              <p className="font-mono break-all">{url}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Downloads recentes</CardTitle></CardHeader>
          <CardContent className="max-h-[500px] overflow-auto space-y-2">
            {downloads.length === 0 && <p className="text-xs text-muted-foreground italic">Sem downloads ainda.</p>}
            {downloads.map((d) => (
              <div key={d.id} className="p-2 rounded border border-border/60 text-xs space-y-0.5">
                <div className="flex justify-between"><span className="font-medium">{d.email ?? 'sem email'}</span>
                  <span className="text-muted-foreground">{new Date(d.downloaded_at).toLocaleString('pt-BR')}</span></div>
                {d.utm_source && <div className="text-[10px] text-muted-foreground font-mono">utm: {d.utm_source}</div>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
