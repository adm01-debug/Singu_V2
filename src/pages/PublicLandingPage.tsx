import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { renderBlocksToHtml } from '@/lib/emailBuilderRenderer';
import type { EmailBlock } from '@/components/email-builder/types';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { safehref } from '@/lib/utils';

interface PublicPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  blocks: EmailBlock[];
  redirect_url: string | null;
  view_count: number;
}

export default function PublicLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const [page, setPage] = useState<PublicPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!slug) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('landing_pages')
        .select('id, user_id, slug, title, description, blocks, redirect_url, view_count, is_published')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPage(data as unknown as PublicPage);
      setLoading(false);
      // Increment view count via SECURITY DEFINER RPC (anon has no direct UPDATE policy)
      supabase.rpc('increment_landing_page_view', { page_id: data.id }).then(() => {}, () => {});
    })();
    return () => { alive = false; };
  }, [slug]);

  const html = useMemo(() => (page ? renderBlocksToHtml(page.blocks ?? []) : ''), [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;
    if (!email && !phone) {
      toast.error('Informe ao menos email ou telefone.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('landing_page_submissions').insert({
      landing_page_id: page.id,
      user_id: page.user_id,
      name: name || null,
      email: email || null,
      phone: phone || null,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      data: Object.fromEntries(params.entries()),
      user_agent: navigator.userAgent,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Não foi possível enviar. Tente novamente.');
      return;
    }
    setSubmitted(true);
    if (page.redirect_url) {
      setTimeout(() => { const safe = safehref(page.redirect_url!); if (safe !== '#') window.location.href = safe; }, 800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (notFound || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">Esta landing page não existe ou foi despublicada.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Helmet>
        <title>{page.title}</title>
        {page.description && <meta name="description" content={page.description} />}
      </Helmet>

      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-background rounded-lg shadow-sm overflow-hidden">
          <iframe
            title={page.title}
            srcDoc={html}
            className="w-full border-0"
            style={{ minHeight: '500px' }}
            sandbox=""
          />
        </div>

        <Card id="form" className="p-6 max-w-md mx-auto">
          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">Recebemos seus dados!</h2>
              <p className="text-sm text-muted-foreground">
                {page.redirect_url ? 'Redirecionando…' : 'Em breve entraremos em contato.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">{page.title}</h2>
                {page.description && <p className="text-xs text-muted-foreground mt-0.5">{page.description}</p>}
              </div>
              <div><Label className="text-xs">Nome</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-9" /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9" /></div>
              <div><Label className="text-xs">Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9" /></div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando…' : 'Quero saber mais'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
