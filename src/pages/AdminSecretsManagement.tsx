import { useState, useCallback } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useSecretRotation, KNOWN_SECRETS } from '@/hooks/useSecretRotation';
import { generateSecureSecret, hashForAudit, daysSince, getSecretHealth } from '@/lib/secretRotation';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Shield, Key, RefreshCw, Clock, Copy, Check, AlertTriangle, History,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

function SecretHealthBadge({ daysSinceRotation }: { daysSinceRotation: number | null }) {
  if (daysSinceRotation === null) {
    return <Badge variant="outline" className="text-muted-foreground">Sem registro</Badge>;
  }
  const health = getSecretHealth(daysSinceRotation);
  const map = {
    healthy: { label: `${daysSinceRotation}d`, variant: 'default' as const },
    warning: { label: `${daysSinceRotation}d ⚠️`, variant: 'secondary' as const },
    critical: { label: `${daysSinceRotation}d 🔴`, variant: 'destructive' as const },
  };
  const { label, variant } = map[health];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function AdminSecretsManagement() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { rotationLogs, isLoading, logRotation, getLastRotation, getHistory } = useSecretRotation();
  const [rotateDialog, setRotateDialog] = useState<string | null>(null);
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [reason, setReason] = useState('Rotação periódica');
  const [copied, setCopied] = useState(false);
  const [historyDialog, setHistoryDialog] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    setGeneratedSecret(generateSecureSecret(48, true));
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(generatedSecret);
    setCopied(true);
    toast.success('Secret copiado para a área de transferência');
    setTimeout(() => setCopied(false), 3000);
  }, [generatedSecret]);

  const handleConfirmRotation = useCallback(async () => {
    if (!rotateDialog || !generatedSecret) return;
    const hash = await hashForAudit(generatedSecret);
    await logRotation.mutateAsync({
      secretName: rotateDialog,
      newHash: hash,
      reason,
    });
    setRotateDialog(null);
    setGeneratedSecret('');
    setReason('Rotação periódica');
  }, [rotateDialog, generatedSecret, reason, logRotation]);

  if (adminLoading || isLoading) return <div className="p-8">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-secondary" />
        <div>
          <h1 className="text-2xl font-bold">Gestão de Secrets</h1>
          <p className="text-sm text-muted-foreground">
            Monitore a idade e rotacione secrets do sistema
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {KNOWN_SECRETS.map(secret => {
          const lastRotation = getLastRotation(secret.name);
          const age = lastRotation ? daysSince(lastRotation.rotated_at) : null;
          const health = age !== null ? getSecretHealth(age) : null;

          return (
            <Card key={secret.name} className={health === 'critical' ? 'border-destructive/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm font-medium">{secret.name}</p>
                      <p className="text-xs text-muted-foreground">{secret.description}</p>
                    </div>
                  </div>
                  <SecretHealthBadge daysSinceRotation={age} />
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  {lastRotation ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Última rotação: {formatDistanceToNow(new Date(lastRotation.rotated_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Nenhuma rotação registrada
                    </span>
                  )}
                </div>

                {health === 'critical' && (
                  <div className="text-xs text-destructive mb-3 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Secret com mais de 90 dias — rotação recomendada
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setRotateDialog(secret.name);
                    handleGenerate();
                  }}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Rotacionar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setHistoryDialog(secret.name)}>
                    <History className="w-3 h-3 mr-1" />
                    Histórico
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Rotação */}
      <Dialog open={!!rotateDialog} onOpenChange={() => setRotateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotacionar Secret</DialogTitle>
            <DialogDescription>
              Gere um novo valor para <code className="font-mono bg-muted px-1 rounded">{rotateDialog}</code>.
              Após copiar, atualize manualmente nas configurações do Lovable Cloud.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo Secret Gerado</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={generatedSecret}
                  className="font-mono text-xs"
                />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={handleGenerate}>
                <RefreshCw className="w-3 h-3 mr-1" /> Gerar outro
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Motivo da Rotação</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} />
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-muted-foreground">
              <p className="font-medium mb-1">⚠️ Passos após registrar:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Copie o secret gerado acima</li>
                <li>Acesse Lovable Cloud → Secrets</li>
                <li>Atualize o valor de <code>{rotateDialog}</code></li>
                <li>Verifique que os serviços continuam funcionando</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateDialog(null)}>Cancelar</Button>
            <Button onClick={handleConfirmRotation} disabled={logRotation.isPending || !generatedSecret}>
              Registrar Rotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog open={!!historyDialog} onOpenChange={() => setHistoryDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico — {historyDialog}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {historyDialog && getHistory(historyDialog).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma rotação registrada.</p>
            )}
            {historyDialog && getHistory(historyDialog).map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">
                    {formatDistanceToNow(new Date(entry.rotated_at), { locale: ptBR, addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.reason || 'Sem motivo'}</p>
                  {entry.new_hash && (
                    <p className="text-xs font-mono text-muted-foreground">Hash: {entry.new_hash}</p>
                  )}
                </div>
                <Badge variant={entry.is_automatic ? 'secondary' : 'outline'}>
                  {entry.is_automatic ? 'Auto' : 'Manual'}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
