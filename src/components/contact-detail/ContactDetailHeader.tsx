import { useState, useCallback } from 'react';
import { DuplicateManagementPanel } from './DuplicateManagementPanel';
import { SoftDeletePanel } from './SoftDeletePanel';
import { motion } from 'framer-motion';
  import {
    Mail, Phone, MessageSquare, Linkedin, Instagram, Twitter,
    Building2, Briefcase, Calendar, Edit2, ExternalLink, Copy, Check,
    MapPin, Globe, AlertTriangle, Trash2, Brain, Target, Shield, Bell, FlaskConical
  } from 'lucide-react';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
 import { RelationshipFunnel, RelationshipStageBadge } from '@/components/ui/relationship-stage';
 import { NextBestActionCard } from './NextBestActionCard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, safehref } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { formatContactName, pluralize } from '@/lib/formatters';
import { useContactRelationalData } from '@/hooks/useContactRelationalData';
import { useContactView360 } from '@/hooks/useContactView360';
import { useContacts } from '@/hooks/useContacts';
import { toast } from 'sonner';
import type { Contact, Company } from '@/hooks/useContactDetail';
import type { RelationshipStage } from '@/types';

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  unknown: { label: 'Desconhecido', color: 'bg-muted text-muted-foreground' },
  prospect: { label: 'Prospect', color: 'bg-info text-info dark:bg-info/30 dark:text-info' },
  qualified_lead: { label: 'Lead Qualificado', color: 'bg-primary text-primary dark:bg-primary/30 dark:text-primary' },
  opportunity: { label: 'Oportunidade', color: 'bg-secondary text-secondary dark:bg-secondary/30 dark:text-secondary' },
  negotiation: { label: 'Negociação', color: 'bg-warning text-warning dark:bg-warning/30 dark:text-warning' },
  customer: { label: 'Cliente', color: 'bg-success text-success dark:bg-success/30 dark:text-success' },
  loyal_customer: { label: 'Cliente Fiel', color: 'bg-success text-success dark:bg-success/30 dark:text-success' },
  advocate: { label: 'Advogado', color: 'bg-accent/10 text-accent dark:bg-accent/30 dark:text-accent' },
  at_risk: { label: 'Em Risco', color: 'bg-accent text-accent dark:bg-accent/30 dark:text-accent' },
  lost: { label: 'Perdido', color: 'bg-destructive text-destructive dark:bg-destructive/30 dark:text-destructive' },
};

const ROLE_CONFIG: Record<string, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  buyer: 'Comprador',
  contact: 'Contato',
  decision_maker: 'Decisor',
  influencer: 'Influenciador',
};

const DISC_COLORS: Record<string, string> = {
  D: 'bg-destructive',
  I: 'bg-warning',
  S: 'bg-success',
  C: 'bg-info',
};

interface Props {
  contact: Contact;
  company: Company | null;
  interactionCount: number;
  onEdit?: () => void;
}

export function ContactDetailHeader({ contact, company, interactionCount, onEdit }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { updateContact } = useContacts();
  const [isChangingStage, setIsChangingStage] = useState(false);

  const handleStageChange = useCallback(async (newStage: RelationshipStage) => {
    if (newStage === contact.relationship_stage) return;
    
    setIsChangingStage(true);
    try {
      const updated = await updateContact(contact.id, { relationship_stage: newStage });
      if (!updated) return;
      toast.success(`Estágio atualizado para ${newStage}`);
    } catch {
      toast.error('Erro ao atualizar estágio');
    } finally {
      setIsChangingStage(false);
    }
  }, [contact.id, contact.relationship_stage, updateContact]);
  
  // Use shared React Query hook — eliminates duplicate fetches, leverages cache
  const { data: relData } = useContactRelationalData(contact.id);
  const { data: view360 } = useContactView360(contact.id);
  
  const extraPhones = relData?.phones || [];
  const extraEmails = relData?.emails || [];
  const addresses = relData?.addresses || [];
  const socialMedia = relData?.socials || [];

  // Duplicate & soft-delete flags from external DB
  const contactExt = contact as Record<string, unknown>;
  const isDuplicate = contactExt.is_duplicate === true;
  const isDeleted = !!contactExt.deleted_at;

   const fullName = formatContactName(contact.first_name, contact.last_name);
  const behavior = contact.behavior as Record<string, unknown> | null;
  const discProfile = behavior?.discProfile as string | null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
      .then(() => { setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); })
      .catch(() => {});
  };

  // Build channels from contact fields + normalized external tables
  const baseChannels = [
    { icon: Mail, value: contact.email, label: 'Email', href: `mailto:${contact.email}` },
    { icon: Phone, value: contact.phone, label: 'Telefone', href: `tel:${contact.phone}` },
    { icon: MessageSquare, value: contact.whatsapp, label: 'WhatsApp', href: `https://wa.me/${contact.whatsapp?.replace(/\D/g, '')}` },
    { icon: Linkedin, value: contact.linkedin, label: 'LinkedIn', href: safehref(contact.linkedin) },
    { icon: Instagram, value: contact.instagram, label: 'Instagram', href: `https://instagram.com/${contact.instagram?.replace('@', '')}` },
    { icon: Twitter, value: contact.twitter, label: 'Twitter', href: `https://twitter.com/${contact.twitter?.replace('@', '')}` },
  ].filter(c => c.value);

  // Add extra phones/emails not already shown
  const existingPhones = new Set([contact.phone, contact.whatsapp].filter(Boolean).map(p => p!.replace(/\D/g, '')));
  const existingEmails = new Set([contact.email].filter(Boolean).map(e => e!.toLowerCase()));

  const extraPhoneChannels = extraPhones
    .filter(p => !existingPhones.has((p.numero || '').replace(/\D/g, '')))
    .slice(0, 3)
    .map((p, i) => ({ icon: Phone, value: p.numero, label: `Tel ${i + 2}`, href: `tel:${p.numero}` }));

  const extraEmailChannels = extraEmails
    .filter(e => !existingEmails.has((e.email || '').toLowerCase()))
    .slice(0, 3)
    .map((e, i) => ({ icon: Mail, value: e.email, label: `Email ${i + 2}`, href: `mailto:${e.email}` }));

  // Add social media from external table
  const platformIconMap: Record<string, typeof Globe> = {
    linkedin: Linkedin, instagram: Instagram, twitter: Twitter, x: Twitter,
  };
  const existingSocials = new Set([contact.linkedin, contact.instagram, contact.twitter].filter(Boolean));
  const extraSocialChannels = socialMedia
    .filter(s => s.url && !existingSocials.has(s.url))
    .map(s => ({
      icon: platformIconMap[s.plataforma] || Globe,
      value: s.handle || s.url || s.plataforma,
      label: s.plataforma.charAt(0).toUpperCase() + s.plataforma.slice(1),
      href: safehref(s.url) || '#',
    }));

  const contactChannels = [...baseChannels, ...extraPhoneChannels, ...extraEmailChannels, ...extraSocialChannels];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Avatar + DISC indicator */}
        <div className="relative flex-shrink-0">
          <OptimizedAvatar
            src={contact.avatar_url}
            alt={fullName}
            fallback={`${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`}
            className="h-20 w-20 text-2xl"
          />
          {discProfile && (
            <div className={cn(
              'absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ring-2 ring-card',
              DISC_COLORS[discProfile] || 'bg-muted'
            )}>
              {discProfile}
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {fullName}
                {contactExt.apelido && (
                  <span className="ml-2 text-lg font-normal text-muted-foreground">
                    ({contactExt.apelido as string})
                  </span>
                )}
                {isDuplicate && (
                  <Badge variant="destructive" className="ml-2 text-[10px] align-middle">
                    <AlertTriangle className="h-3 w-3 mr-0.5" /> Duplicado
                  </Badge>
                )}
                {isDeleted && (
                  <Badge variant="destructive" className="ml-2 text-[10px] align-middle bg-destructive/20 text-destructive">
                    <Trash2 className="h-3 w-3 mr-0.5" /> Excluído
                  </Badge>
                )}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {(contact.role_title || contactExt.cargo) && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {contact.role_title || contactExt.cargo as string}
                  </span>
                )}
                {contactExt.departamento && (
                  <Badge variant="outline" className="text-xs">
                    {contactExt.departamento as string}
                  </Badge>
                )}
                {company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {company.nome_fantasia || company.nome_crm}
                  </span>
                )}
                {contact.role && ROLE_CONFIG[contact.role] && (
                  <Badge variant="outline" className="text-xs">
                    {ROLE_CONFIG[contact.role]}
                  </Badge>
                )}
                {contactExt.source && (
                  <Badge variant="secondary" className="text-xs">
                    Fonte: {contactExt.source as string}
                  </Badge>
                )}
              </div>
            </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <DuplicateManagementPanel
                  contactId={contact.id}
                  contactName={fullName}
                  isDuplicate={isDuplicate}
                  duplicateOfId={contactExt.duplicate_of as string | null}
                />
                <SoftDeletePanel
                  contactId={contact.id}
                  contactName={fullName}
                  deletedAt={contactExt.deleted_at as string | null}
                />
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
              </div>
          </div>

          {/* Metrics row */}
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
              <div className="flex items-center gap-1.5">
                <RelationshipScore score={contact.relationship_score || 0} size="sm" showMilestone />
              </div>
              <SentimentIndicator sentiment={(contact.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral'} size="sm" />
              <span className="text-xs text-muted-foreground">
                {pluralize(interactionCount, 'interação', 'interações')}
              </span>
              {contact.birthday && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(contact.birthday), "dd/MM/yyyy")}
                </span>
              )}
            </div>

            {/* Interactive Relationship Funnel */}
            <div className={cn("p-3 rounded-lg bg-muted/30 border border-border/50", isChangingStage && "opacity-60 pointer-events-none animate-pulse")}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Funil de Relacionamento (Clique para alterar)
                </span>
               <Badge variant="outline" className="text-[9px] h-4">
                 {contact.relationship_stage || 'unknown'}
               </Badge>
             </div>
             <RelationshipFunnel 
               currentStage={(contact.relationship_stage as RelationshipStage) || 'unknown'} 
               onStageChange={handleStageChange}
               isEditable
             />
           </div>
 
           {/* Next Best Action Dashboard Integration */}
           <NextBestActionCard 
             contactId={contact.id} 
             contactName={fullName} 
           />
         </div>
 
          {/* 360° Intelligence Strip */}
          {view360 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {view360.disc_primary && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Brain className="h-3 w-3" />
                  DISC: {view360.disc_primary}{view360.disc_secondary ? `/${view360.disc_secondary}` : ''}
                  {view360.disc_confidence ? ` (${view360.disc_confidence}%)` : ''}
                </Badge>
              )}
              {view360.eq_score != null && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Target className="h-3 w-3" />
                  EQ: {view360.eq_score}{view360.eq_level ? ` (${view360.eq_level})` : ''}
                </Badge>
              )}
              {view360.interaction_count != null && view360.interaction_count > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {view360.interaction_count} interações
                </Badge>
              )}
              {view360.open_objections != null && view360.open_objections > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 border-warning text-warning">
                  <Shield className="h-3 w-3" />
                  {view360.open_objections} objeções abertas
                </Badge>
              )}
              {view360.pending_health_alerts != null && view360.pending_health_alerts > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 border-destructive text-destructive">
                  <Bell className="h-3 w-3" />
                  {view360.pending_health_alerts} alertas
                </Badge>
              )}
              {view360.cadence_days != null && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Calendar className="h-3 w-3" />
                  Cadência: {view360.cadence_days}d
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] gap-1 bg-purple-500/10 text-purple-600 border-purple-200">
                <FlaskConical className="h-3 w-3" />
                Neuromarketing: Límbico Dominante
              </Badge>
            </div>
          )}


          {contactChannels.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <TooltipProvider>
                {contactChannels.map(({ icon: Icon, value, label, href }) => (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <a
                          href={href}
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="max-w-[120px] truncate">{value}</span>
                          {href?.startsWith('http') && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                        </a>
                        <button
                          aria-label={`Copiar ${label}`}
                          onClick={() => copyToClipboard(value!, label)}
                          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {copiedField === label ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}

          {/* Addresses from external DB */}
          {addresses.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {addresses.map((addr, i) => {
                const parts = [addr.logradouro, addr.numero, addr.bairro, addr.cidade, addr.estado].filter(Boolean).join(', ');
                return parts ? (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[250px]">{parts}</span>
                    {addr.cep && <span className="text-muted-foreground/70">CEP {addr.cep}</span>}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Tags */}
          {(() => {
            const tags = contact.tags || contactExt.tags_array as string[] | undefined;
            return tags && tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </motion.div>
  );
}
