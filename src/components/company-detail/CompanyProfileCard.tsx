import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyHealthBadge } from '@/components/ui/company-health-score';
import { 
  Phone, Mail, Globe, MapPin, ExternalLink,
  Instagram, Linkedin, Facebook, Youtube, MessageCircle
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { FiscalDataCard } from './profile/FiscalDataCard';
import { BusinessInfoCard } from './profile/BusinessInfoCard';
import { motion } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';
import type { CompanyPhone, CompanyEmail, CompanyAddress, CompanySocialMedia } from '@/hooks/useCompanyRelatedData';
import { toTitleCase } from '@/lib/formatters';

type Company = Tables<'companies'>;
type HealthStatus = 'growing' | 'stable' | 'cutting' | 'unknown';

/** Strip leading numeric prefix like "05 - " and return first letter */
const safeInitial = (value: unknown, fallback = '?') => {
  const cleaned = String(value ?? fallback).replace(/^\d+\s*[-–—]\s*/, '');
  return (cleaned || fallback).charAt(0).toUpperCase();
};

export interface CompanyProfileCardProps {
  company: Company;
  contactCount: number;
  totalInteractions: number;
  avgRelationshipScore: number;
  phones?: CompanyPhone[];
  emails?: CompanyEmail[];
  addresses?: CompanyAddress[];
  socialMedia?: CompanySocialMedia[];
}

const platformIcon: Record<string, typeof Globe> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  website: Globe,
};

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
}

function formatPhone(num: string): string {
  const d = num.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return num;
}

export function CompanyProfileCard({ 
  company, contactCount, totalInteractions, avgRelationshipScore,
  phones = [], emails = [], addresses = [], socialMedia = [],
}: CompanyProfileCardProps) {
  const healthStatus = (company.financial_health as HealthStatus) || 'unknown';
  const c = company as Record<string, unknown>;

  const primaryPhone = phones.find(p => p.is_primary) || phones[0];
  const primaryEmail = emails.find(e => e.is_primary) || emails[0];
  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
  const websiteEntry = socialMedia.find(s => s.plataforma === 'website');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ─── Main Profile Card ─── */}
      <Card className="overflow-visible">
        <CardContent className="pt-0">
          <div className="flex flex-col items-center -mt-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-strong border-4 border-card">
              {company.logo_url ? (
                <OptimizedImage 
                  src={company.logo_url} 
                  alt={company.name} 
                  className="w-full h-full object-cover rounded-xl" 
                  containerClassName="w-full h-full"
                />
              ) : (
                safeInitial(company.name, 'E')
              )}
            </div>
            
            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold text-foreground">{toTitleCase(company.name)}</h1>
              {c.nome_fantasia && c.nome_fantasia !== company.name && (
                <p className="text-sm text-muted-foreground">{String(c.nome_fantasia)}</p>
              )}
              <p className="text-muted-foreground">{String(c.ramo_atividade || c.nicho_cliente || company.industry || '')}</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <CompanyHealthBadge financialHealth={healthStatus} />
                {c.status && (
                  <Badge variant={c.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                    {String(c.status).charAt(0).toUpperCase() + String(c.status).slice(1)}
                  </Badge>
                )}
                {c.is_customer 
                  ? <Badge variant="outline" className="text-xs border-success/40 text-success bg-success/10">Cliente</Badge>
                  : <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/10">Prospect</Badge>
                }
                {c.is_supplier && <Badge variant="outline" className="text-xs">Fornecedor</Badge>}
                {c.is_carrier && <Badge variant="outline" className="text-xs">Transportadora</Badge>}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{contactCount}</div>
                <div className="text-xs text-muted-foreground">Contatos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalInteractions}</div>
                <div className="text-xs text-muted-foreground">Interações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{avgRelationshipScore}%</div>
                <div className="text-xs text-muted-foreground">Score Médio</div>
              </div>
            </div>

            {/* ─── Contact Info (from normalized tables) ─── */}
            <div className="w-full space-y-3 mt-6 pt-6 border-t border-border">
              {primaryPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{formatPhone(primaryPhone.numero)}</span>
                  {primaryPhone.is_whatsapp && (
                    <Badge variant="outline" className="text-xs py-0">WhatsApp</Badge>
                  )}
                </div>
              )}
              {phones.length > 1 && (
                <div className="ml-7 space-y-1">
                  {phones.slice(1, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatPhone(p.numero)}</span>
                      <span className="text-muted-foreground/70">({p.phone_type?.replace('_', ' ')})</span>
                    </div>
                  ))}
                  {phones.length > 4 && (
                    <span className="text-xs text-muted-foreground/70">+{phones.length - 4} mais</span>
                  )}
                </div>
              )}

              {primaryEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{primaryEmail.email}</span>
                </div>
              )}
              {emails.length > 1 && (
                <div className="ml-7 space-y-1">
                  {emails.slice(1, 3).map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{e.email}</span>
                      <span className="text-muted-foreground/70">({e.email_type})</span>
                    </div>
                  ))}
                </div>
              )}

              {websiteEntry?.url && (
                <a 
                  href={websiteEntry.url.startsWith('http') ? websiteEntry.url : `https://${websiteEntry.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate">{websiteEntry.url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              )}

              {primaryAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {[
                      primaryAddress.logradouro,
                      primaryAddress.numero,
                      primaryAddress.bairro,
                      primaryAddress.cidade,
                      primaryAddress.estado,
                    ].filter(Boolean).join(', ')}
                    {primaryAddress.cep && ` - CEP ${primaryAddress.cep}`}
                  </span>
                </div>
              )}
            </div>

            {/* ─── Social Media ─── */}
            {socialMedia.filter(s => s.plataforma !== 'website').length > 0 && (
              <div className="w-full mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {socialMedia.filter(s => s.plataforma !== 'website').map(s => {
                    const Icon = platformIcon[s.plataforma] || Globe;
                    return (
                      <a
                        key={s.id}
                        href={s.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-md px-2 py-1"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {s.handle || s.plataforma}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="w-full mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {company.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <FiscalDataCard data={c} />
      <BusinessInfoCard company={company} />

      {/* ─── Endereços extras ─── */}
      {addresses.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Endereços ({addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addresses.map((addr, idx) => (
                <div key={addr.id || idx} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">
                    {addr.tipo || 'comercial'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {[addr.logradouro, addr.numero, addr.bairro, addr.cidade, addr.estado]
                      .filter(Boolean).join(', ')}
                    {addr.cep && ` - ${addr.cep}`}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
