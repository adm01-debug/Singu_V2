import { Database, Building2, Phone, Mail, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactsCompletoView } from '@/hooks/useContactsCompletoView';
import { useContactsFullView } from '@/hooks/useContactsFullView';
import { useContactsContatoView } from '@/hooks/useContactsContatoView';

interface Props {
  contactId: string;
}

export function ContactEnrichedCard({ contactId }: Props) {
  const { data: completo, isLoading: l1, error: e1, refetch: r1 } = useContactsCompletoView(contactId);
  const { data: full, isLoading: l2, error: e2, refetch: r2 } = useContactsFullView(contactId);
  const { data: contato, isLoading: l3, error: e3, refetch: r3 } = useContactsContatoView(contactId);

  const isLoading = l1 || l2 || l3;
  const error = e1 || e2 || e3;
  const refetch = () => { r1(); r2(); r3(); };
  const hasData = !!completo || !!full || !!contato;

  const icon = <Database className="h-4 w-4 text-primary" />;

  return (
    <ExternalDataCard
      title="Dados Enriquecidos (Externo)"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      emptyMessage="Sem dados enriquecidos no banco externo"
      onRetry={refetch}
      skeletonHeight="h-36"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            Dados Enriquecidos (Externo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Identity fields from vw_contacts_completo */}
          {completo && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Identidade</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {completo.apelido && (
                  <div><span className="text-muted-foreground">Apelido:</span> <span className="font-medium text-foreground">{completo.apelido}</span></div>
                )}
                {completo.nome_tratamento && (
                  <div><span className="text-muted-foreground">Tratamento:</span> <span className="font-medium text-foreground">{completo.nome_tratamento}</span></div>
                )}
                {completo.assinatura_contato && (
                  <div><span className="text-muted-foreground">Assinatura:</span> <span className="font-medium text-foreground">{completo.assinatura_contato}</span></div>
                )}
                {completo.sexo && (
                  <div><span className="text-muted-foreground">Sexo:</span> <span className="font-medium text-foreground">{completo.sexo}</span></div>
                )}
                {completo.is_duplicate && <Badge variant="destructive" className="text-[10px] w-fit">Duplicado</Badge>}
              </div>
            </div>
          )}

          {/* Contact channels from vw_contacts_contato */}
          {contato && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Canais de Contato</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {contato.phone_normalizado && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground">{contato.phone_normalizado}</span>
                  </div>
                )}
                {contato.email_normalizado && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-foreground truncate">{contato.email_normalizado}</span>
                  </div>
                )}
                {contato.whatsapp && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-success" />
                    <span className="text-foreground">{contato.whatsapp}</span>
                    <Badge variant="secondary" className="text-[9px]">WhatsApp</Badge>
                  </div>
                )}
                {contato.total_telefones != null && (
                  <div className="text-muted-foreground">{contato.total_telefones} tel. | {contato.total_emails ?? 0} emails</div>
                )}
              </div>
            </div>
          )}

          {/* Company relationship from vw_contacts_full */}
          {full && full.empresa_nome && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Vínculo Empresarial</p>
              <div className="rounded-lg border p-2 text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{full.empresa_nome}</span>
                  {full.empresa_is_cliente && <Badge variant="default" className="text-[9px]">Cliente</Badge>}
                </div>
                {full.empresa_razao_social && (
                  <p className="text-muted-foreground pl-5">{full.empresa_razao_social}</p>
                )}
                {full.empresa_cnpj && (
                  <p className="text-muted-foreground pl-5">CNPJ: {full.empresa_cnpj}</p>
                )}
                {full.grupo_economico_nome && (
                  <div className="flex items-center gap-1 pl-5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Grupo: {full.grupo_economico_nome}</span>
                  </div>
                )}
                {full.empresa_status && (
                  <Badge variant="outline" className="text-[9px] ml-5 capitalize">{full.empresa_status}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Totals from vw_contacts_completo */}
          {completo && (completo.total_phones != null || completo.total_emails != null) && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t">
              {completo.total_phones != null && <span>{completo.total_phones} telefones registrados</span>}
              {completo.total_emails != null && <span>{completo.total_emails} emails registrados</span>}
              {completo.grupo_economico && <Badge variant="outline" className="text-[9px]">{completo.grupo_economico}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
