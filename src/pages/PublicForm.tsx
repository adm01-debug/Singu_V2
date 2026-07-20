import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { PublicFormRenderer } from '@/components/marketing/PublicFormRenderer';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FormField, MarketingForm } from '@/hooks/useForms';

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<MarketingForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const currentSlug = slug;
    (async () => {
      const { data } = await supabase.from('forms').select('*').eq('slug', currentSlug).eq('is_published', true).maybeSingle();
      if (cancelled) return;
      if (data) {
        setForm({ ...data, fields: Array.isArray(data.fields) ? data.fields : [] } as unknown as MarketingForm);
        void supabase.rpc('increment_form_view', { _slug: currentSlug });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!form || !slug) return;
    const params = new URLSearchParams(window.location.search);
    const utms = {
      utm_source: params.get('utm_source'), utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'), utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
    };
    const { data, error } = await supabase.functions.invoke('form-submit-handler', {
      body: { slug, data: values, utms, page_url: window.location.href, user_agent: navigator.userAgent },
    });
    if (error || !data?.ok) {
      toast.error('Erro ao enviar. Tente novamente.');
      return;
    }
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      setSubmitted(true);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando...</div>;
  if (!form) return <div className="min-h-screen grid place-items-center text-sm">Formulário não encontrado.</div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4 grid place-items-start md:place-items-center">
      <Helmet><title>{form.name}</title><meta name="description" content={form.description ?? form.name} /></Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{form.name}</CardTitle>
          {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <p className="font-medium">{form.success_message ?? 'Obrigado!'}</p>
            </div>
          ) : (
            <PublicFormRenderer fields={form.fields as FormField[]} onSubmit={handleSubmit} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
