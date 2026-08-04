import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { use2FA } from '@/hooks/use2FA';

export function TwoFactorSetup() {
  const { isEnabled, isEnrolling, isVerifying, qrUri, checkStatus, enroll, verify, unenroll } = use2FA();
  const [code, setCode] = useState('');

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleVerify = async () => {
    const ok = await verify(code);
    if (ok) setCode('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Autenticação de Dois Fatores (2FA)
        </CardTitle>
        <CardDescription className="text-xs">
          Adicione uma camada extra de segurança com TOTP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">2FA ativo</p>
                <p className="text-xs text-muted-foreground">Seu aplicativo autenticador está configurado</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={unenroll}>
              <ShieldOff className="h-3.5 w-3.5 mr-1" />Desativar
            </Button>
          </div>
        ) : qrUri ? (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={qrUri} size={180} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Escaneie o QR code com Google Authenticator ou similar
            </p>
            <div className="space-y-2">
              <Label>Código de verificação</Label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-center"
                />
                <Button onClick={handleVerify} disabled={code.length !== 6 || isVerifying}>
                  {isVerifying ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button onClick={enroll} disabled={isEnrolling} className="w-full">
            {isEnrolling ? 'Configurando...' : 'Ativar 2FA'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
