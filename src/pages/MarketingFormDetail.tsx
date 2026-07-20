import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Copy, ExternalLink } from 'lucide-react';
import { useForm, useFormSubmissions, type MarketingForm } from '@/hooks/useForms';
import { FormBuilder } from '@/components/marketing/FormBuilder';
import { PublicFormRenderer } from '@/components/marketing/PublicFormRenderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function MarketingFormDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: form, isLoading } = useForm(id);
  const { data: submissions = [] } = useFormSubmissions(id);
  const qc = useQueryClient();

  const [draft, setDraft] = useState<MarketingForm | null>(null);

  useEffect(() => {
    if (form) setDraft(form);
  }, [form]);

  if (isLoading || !draft) return <div className="container py-8 text-sm text-muted-foreground">Carregando...</div>;

  const save = async () => {
    const { error } = await supabase.from('forms').update({
      name: draft.name,
      description: draft.description,
      fields: draft.fields,
      redirect_url: draft.redirect_url,
      success_message: draft.success_message,
    } as never).eq('id', draft.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Salvo!');
      qc.invalidateQueries({ queryKey: ['marketing-form', id] });
      qc.invalidateQueries({ queryKey: ['marketing-forms'] });
    }
  };

  const url = `${window.location.origin}/f/${draft.slug}`;

  return (
    <div className="container max-w-6xl py-6 space-y-4">
      <Helmet><title>{draft.name} — Form</title></Helmet>

      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/marketing"><ArrowLeft className="w-4 h-4" /> Marketing</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => { navigator.clipboard.writeText(url).then(() => toast.success('URL copiada')).catch(() => toast.error('Não foi possível copiar')); }}>
            <Copy className="w-4 h-4" /> Copiar URL
          </Button>
          {draft.is_published && (
            <Button asChild size="sm" variant="outline" className="gap-1">
              <a href={`/f/${draft.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /> Abrir público</a>
            </Button>
          )}
          <Button size="sm" variant="default" className="gap-1" onClick={save}>
            <Save className="w-4 h-4" /> Salvar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Configurações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL pública</Label>
                <p className="text-xs font-mono text-muted-foreground break-all">{url}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mensagem de sucesso</Label>
                <Input value={draft.success_message ?? ''} onChange={(e) => setDraft({ ...draft, success_message: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Redirect URL (opcional)</Label>
                <Input placeholder="https://..." value={draft.redirect_url ?? ''} onChange={(e) => setDraft({ ...draft, redirect_url: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Campos</CardTitle></CardHeader>
            <CardContent>
              <FormBuilder fields={draft.fields} onChange={(fields) => setDraft({ ...draft, fields })} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
            <CardContent>
              <PublicFormRenderer fields={draft.fields} onSubmit={async () => { toast.info('Preview — submissão desativada aqui'); }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Últimas submissões</span>
                <span className="text-xs text-muted-foreground font-normal">{submissions.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto space-y-2">
              {submissions.length === 0 && <p className="text-xs text-muted-foreground italic">Sem submissões ainda.</p>}
              {submissions.map((s) => (
                <div key={s.id} className="text-xs p-2 rounded border border-border/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{new Date(s.created_at).toLocaleString('pt-BR')}</span>
                    {s.utm_source && <span className="font-mono">{s.utm_source}</span>}
                  </div>
                  <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">{JSON.stringify(s.data, null, 2)}</pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
