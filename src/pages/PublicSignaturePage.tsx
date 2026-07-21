import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, XCircle, Loader2, FileText, Clock } from 'lucide-react';
import { sanitizeDocumentHtml } from '@/lib/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

type Signature = {
  id: string;
  signer_name: string;
  signer_email: string;
  rendered_html: string;
  status: 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export default function PublicSignaturePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { submitControllerRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const currentToken = token;
    (async () => {
      try {
        const res = await fetch(`${FN_BASE}/get-signature?token=${encodeURIComponent(currentToken)}`, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? 'Erro');
        setSignature(data);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        setError(parseApiError(e, 'Erro ao carregar'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => { controller.abort(); };
  }, [token]);

  const submit = async (action: 'sign' | 'decline') => {
    if (!token) return;
    if (action === 'sign' && !typedSignature.trim()) {
      toast.error('Digite seu nome para assinar');
      return;
    }
    setSubmitting(true);
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;
    try {
      const res = await fetch(`${FN_BASE}/submit-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          token,
          action,
          signature_typed: action === 'sign' ? typedSignature : undefined,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erro');
      toast.success(action === 'sign' ? 'Documento assinado!' : 'Documento recusado');
      setSignature((prev) => (prev ? { ...prev, status: action === 'sign' ? 'signed' : 'declined' } : prev));
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      toast.error(parseApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !signature) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-3">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="font-medium">{error ?? 'Documento não encontrado'}</p>
            <p className="text-sm text-muted-foreground">
              Verifique se o link está correto e não expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFinal = ['signed', 'declined', 'expired'].includes(signature.status);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <Helmet>
        <title>Assinar documento | SINGU</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documento para assinatura
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Para: <strong>{signature.signer_name}</strong> ({signature.signer_email})
                </p>
              </div>
              <StatusBadge status={signature.status} />
            </div>
            {signature.expires_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3" />
                Expira em: {new Date(signature.expires_at).toLocaleString('pt-BR')}
              </p>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert" 
              dangerouslySetInnerHTML={{ __html: sanitizeDocumentHtml(signature.rendered_html) }} 
            />
          </CardContent>
        </Card>

        {!isFinal ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sua assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Digite seu nome completo para assinar *</Label>
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder={signature.signer_name}
                  className="font-serif text-lg italic"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sua assinatura digital tem o mesmo valor jurídico de uma assinatura manuscrita conforme a MP 2.200-2/2001.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => submit('sign')}
                  disabled={submitting || !typedSignature.trim()}
                  className="flex-1"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aceitar e assinar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja recusar?')) submit('decline');
                  }}
                  disabled={submitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              {signature.status === 'signed' && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
                  <p className="font-medium">Documento assinado com sucesso</p>
                  {signature.signed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Em {new Date(signature.signed_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </>
              )}
              {signature.status === 'declined' && (
                <>
                  <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                  <p className="font-medium">Documento recusado</p>
                </>
              )}
              {signature.status === 'expired' && (
                <>
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium">Documento expirado</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Signature['status'] }) {
  const cfg = {
    pending: { label: 'Pendente', variant: 'secondary' as const },
    viewed: { label: 'Visualizado', variant: 'default' as const },
    signed: { label: 'Assinado', variant: 'default' as const },
    declined: { label: 'Recusado', variant: 'destructive' as const },
    expired: { label: 'Expirado', variant: 'outline' as const },
  }[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
