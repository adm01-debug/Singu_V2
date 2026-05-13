import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
 import { Download, CheckCircle2 } from 'lucide-react';
 import { OptimizedImage } from '@/components/ui/optimized-image';
import { toast } from 'sonner';
import type { LeadMagnet } from '@/hooks/useLeadMagnets';

export default function PublicLeadMagnet() {
  const { slug } = useParams<{ slug: string }>();
  const [magnet, setMagnet] = useState<LeadMagnet | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from('lead_magnets').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
      if (data) {
        setMagnet(data as unknown as LeadMagnet);
        await supabase.rpc('increment_magnet_view', { _slug: slug });
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const utms = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
      };
      const { data, error } = await supabase.rpc('track_magnet_download', {
        _slug: slug, _email: email, _name: name || null, _utms: utms,
      });
      if (error) throw error;
      const result = data as { external_url?: string; file_path?: string };
      const downloadUrl = result?.external_url || result?.file_path || '';
      setDownloaded(downloadUrl);
      if (downloadUrl) window.open(downloadUrl, '_blank');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando...</div>;
  if (!magnet) return <div className="min-h-screen grid place-items-center text-sm">Conteúdo não encontrado.</div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4 grid place-items-start md:place-items-center">
      <Helmet><title>{magnet.title}</title><meta name="description" content={magnet.description ?? magnet.title} /></Helmet>

      <Card className="w-full max-w-2xl">
         {magnet.thumbnail_url && (
           <OptimizedImage 
             src={magnet.thumbnail_url} 
             alt={magnet.title} 
             className="w-full h-48 object-cover rounded-t-lg" 
           />
         )}
        <CardHeader>
          <Badge variant="secondary" className="w-fit text-[10px] capitalize">{magnet.type}</Badge>
          <CardTitle className="text-2xl">{magnet.title}</CardTitle>
          {magnet.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{magnet.description}</p>}
        </CardHeader>
        <CardContent>
          {downloaded ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <p className="font-medium">Download iniciado!</p>
              {downloaded && (
                <Button asChild variant="outline" size="sm" className="gap-1">
                  <a href={downloaded} target="_blank" rel="noreferrer"><Download className="w-4 h-4" /> Baixar novamente</a>
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleDownload} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="lm-name" className="text-xs">Nome</Label>
                <Input id="lm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lm-email" className="text-xs">Email *</Label>
                <Input id="lm-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting || !email}>
                <Download className="w-4 h-4" /> {submitting ? 'Processando...' : 'Baixar agora'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
