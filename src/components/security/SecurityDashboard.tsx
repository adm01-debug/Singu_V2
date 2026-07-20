import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useAccessSecurity } from '@/hooks/useAccessSecurity';
import { use2FA } from '@/hooks/use2FA';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAllowedIPs } from '@/hooks/useAllowedIPs';
import { useGeoBlocking } from '@/hooks/useGeoBlocking';
import { useEffect } from 'react';

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
      <span className="text-sm">{label}</span>
      <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
        {active ? 'Ativo' : 'Inativo'}
      </Badge>
    </div>
  );
}

export function SecurityDashboard() {
  const { settings } = useAccessSecurity();
  const twoFA = use2FA();
  const { credentials } = useWebAuthn();
  const { ips } = useAllowedIPs();
  const { countries } = useGeoBlocking();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { twoFA.checkStatus(); }, [twoFA.checkStatus]);

  const activeCount = [
    twoFA.isEnabled,
    credentials.length > 0,
    settings.enable_ip_restriction && ips.length > 0,
    settings.enable_geo_blocking && countries.length > 0,
    settings.enable_device_detection,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Visão Geral de Segurança
          <Badge variant={activeCount >= 3 ? 'default' : 'secondary'} className="text-[10px] ml-auto">
            {activeCount}/5 camadas ativas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <StatusBadge active={twoFA.isEnabled} label="2FA (TOTP)" />
        <StatusBadge active={credentials.length > 0} label={`Passkeys (${credentials.length})`} />
        <StatusBadge active={settings.enable_ip_restriction && ips.length > 0} label={`IPs permitidos (${ips.length})`} />
        <StatusBadge active={settings.enable_geo_blocking && countries.length > 0} label={`Geo-blocking (${countries.length} países)`} />
        <StatusBadge active={settings.enable_device_detection} label="Detecção de dispositivos" />
      </CardContent>
    </Card>
  );
}
