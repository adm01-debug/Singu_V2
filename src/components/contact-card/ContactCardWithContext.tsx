import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RelationshipScore } from '@/components/ui/relationship-score';
import { RelationshipStageBadge } from '@/components/ui/relationship-stage';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DISCBadge } from '@/components/ui/disc-badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickActionsMenu } from '@/components/context-menu/QuickActionsMenu';
import { InlineEdit } from '@/components/inline-edit/InlineEdit';
import { usePrefetch, usePrefetchOnHover } from '@/hooks/usePrefetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contact } from '@/hooks/useContacts';
import type { RelationshipStage, DISCProfile } from '@/types';
import { cn } from '@/lib/utils';
import { formatContactName, toTitleCase } from '@/lib/formatters';

interface ContactCardWithContextProps {
  contact: Contact;
  companyName: string | null;
  lastInteraction: string | null;
  index: number;
  isSelected: boolean;
  isHighlighted: boolean;
  selectionMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdate: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
  viewMode: 'grid' | 'list';
}

function ContactDropdownActions({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="opacity-0 group-hover:opacity-100 transition-opacity h-11 w-11 md:h-7 md:w-7" // 44px em mobile para touch target (WCAG)
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TimeAgo({ date }: { date: string }) {
  const daysSince = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  const color = daysSince <= 7 ? 'text-muted-foreground' : daysSince <= 14 ? 'text-warning' : 'text-destructive';
  return (
    <span className={cn('text-[11px] tabular-nums', color)}>
      {formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true })}
    </span>
  );
}

function ContactCardWithContextImpl({
  contact,
  companyName,
  lastInteraction,
  index,
  isSelected,
  isHighlighted,
  selectionMode,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  viewMode,
}: ContactCardWithContextProps) {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  
  const { prefetchContact, prefetchInteractions } = usePrefetch();
  const prefetchFn = useCallback(() => {
    prefetchContact(contact.id);
    prefetchInteractions(contact.id);
  }, [contact.id, prefetchContact, prefetchInteractions]);
  
  const hoverProps = usePrefetchOnHover(prefetchFn, 150);

  const handleInlineSave = async (field: string, value: string): Promise<boolean> => {
    try {
      if (field === 'name') {
        const parts = value.split(' ');
        await onUpdate(contact.id, { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' });
      }
      return true;
    } catch {
      return false;
    }
  };

  const displayName = formatContactName(contact.first_name, contact.last_name);
  const isGenericName = displayName === 'Contato';
  const cargoOrTitle = contact.role_title || (contact as Record<string, unknown>).cargo as string | undefined;
  const subtitle = cargoOrTitle && companyName 
    ? `${cargoOrTitle} · ${toTitleCase(companyName)}`
    : cargoOrTitle || (companyName ? toTitleCase(companyName) : null);

  const quickActionsWrapper = (children: React.ReactNode) => (
    <QuickActionsMenu
      entityType="contact"
      entityId={contact.id}
      entityName={`${contact.first_name} ${contact.last_name}`}
      email={contact.email}
      phone={contact.phone}
      whatsapp={contact.whatsapp}
      linkedin={contact.linkedin}
      onEdit={() => onEdit(contact)}
      onDelete={() => onDelete(contact)}
    >
      {children}
    </QuickActionsMenu>
  );

  // ─── GRID VIEW ───
  if (viewMode === 'grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
        {...hoverProps}
      >
        {quickActionsWrapper(
          <Card className={cn(
            "h-full group cursor-pointer overflow-hidden transition-colors duration-150",
            "border border-border/30 hover:border-border/50",
            isHighlighted && "ring-1 ring-primary/50",
            isSelected && "bg-primary/5 border-primary/30"
          )}>
            {selectionMode && (
              <div className="absolute top-3 left-3 z-20">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(contact.id, checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-11 w-11 md:h-4 md:w-4" // 44px em mobile para touch target
                />
              </div>
            )}

            <ContactDropdownActions
              contact={contact}
              onEdit={() => onEdit(contact)}
              onDelete={() => onDelete(contact)}
            />

            <Link to={`/contatos/${contact.id}`}>
              <CardContent className="p-4">
                {/* Header: Avatar + Name + Score */}
                <div className="flex items-center gap-3">
                  <OptimizedAvatar 
                    src={contact.avatar_url || undefined}
                    alt="" // Decorativo aqui pois o nome vem logo ao lado
                    aria-hidden="true"
                    fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`}
                    size="md"
                    className="w-10 h-10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    {isInlineEditing ? (
                      <InlineEdit
                        value={`${contact.first_name} ${contact.last_name}`}
                        onSave={(v) => handleInlineSave('name', v)}
                        className="font-semibold text-sm"
                      />
                    ) : isGenericName ? (
                      <span 
                        className="text-sm text-muted-foreground/60 italic cursor-pointer hover:text-primary/70 transition-colors"
                        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsInlineEditing(true); }}
                      >
                        Adicionar nome
                      </span>
                    ) : (
                      <h3 
                        className="font-semibold text-sm leading-tight truncate text-foreground"
                        onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsInlineEditing(true); }}
                      >
                        {displayName}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  <RelationshipScore score={contact.relationship_score || 0} size="sm" />
                </div>

                {/* Badges row: Sentiment + DISC + Role */}
                <AnimatePresence>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {contact.sentiment && (
                      <SentimentIndicator sentiment={contact.sentiment as 'positive' | 'neutral' | 'negative'} size="sm" />
                    )}
                    {(contact.behavior as Record<string, unknown>)?.discProfile && (
                      <DISCBadge profile={(contact.behavior as Record<string, unknown>).discProfile as DISCProfile} size="sm" showLabel={false} />
                    )}
                    {contact.role && (
                      <RoleBadge role={contact.role as 'contact' | 'owner' | 'manager' | 'buyer' | 'decision_maker' | 'influencer'} />
                    )}
                  </div>
                </AnimatePresence>

                {/* Footer: Stage + Time */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                  <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                  <TimeAgo date={contact.updated_at} />
                </div>

                {/* Quick actions on hover */}
                {(contact.email || contact.phone || contact.whatsapp) && (
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="p-3 md:p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0" title={contact.email} aria-label={`Enviar email para ${displayName}`}>
                        <Mail className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()} className="p-3 md:p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0" title={contact.phone} aria-label={`Ligar para ${displayName}`}>
                        <Phone className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-3 md:p-1.5 rounded-md hover:bg-success/10 text-muted-foreground hover:text-success transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0" title={contact.whatsapp} aria-label={`WhatsApp para ${displayName}`}>
                        <MessageCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Link>
          </Card>
        )}
      </motion.div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      {...hoverProps}
    >
      {quickActionsWrapper(
        <Card className={cn(
          "cursor-pointer group overflow-hidden transition-colors duration-150",
          "border border-border/30 hover:border-border/50",
          isHighlighted && "ring-1 ring-primary/50",
          isSelected && "bg-primary/5 border-primary/30"
        )}>
          <Link to={`/contatos/${contact.id}`}>
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-4">
                {selectionMode && (
                  <div className="shrink-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(contact.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-11 w-11 md:h-4 md:w-4" // 44px em mobile para touch target (WCAG)
                    />
                  </div>
                )}

                <OptimizedAvatar 
                  src={contact.avatar_url || undefined}
                  alt=""
                  aria-hidden="true"
                  fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`}
                  size="md"
                  className="w-10 h-10 shrink-0"
                />

                {/* Name + subtitle */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate text-foreground">
                    {isGenericName ? <span className="text-muted-foreground/60 italic">Adicionar nome</span> : displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RelationshipStageBadge stage={(contact.relationship_stage as RelationshipStage) || 'unknown'} />
                    {subtitle && (
                      <>
                        <span className="text-muted-foreground/30 hidden sm:inline">·</span>
                        <span className="text-xs text-muted-foreground truncate hidden sm:inline">{subtitle}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score */}
                <RelationshipScore score={contact.relationship_score || 0} size="sm" />

                {/* Time */}
                <div className="hidden sm:block w-20 text-right shrink-0">
                  <TimeAgo date={contact.updated_at} />
                </div>

                <ContactDropdownActions
                  contact={contact}
                  onEdit={() => onEdit(contact)}
                  onDelete={() => onDelete(contact)}
                />
              </div>
            </CardContent>
          </Link>
        </Card>
      )}
    </motion.div>
  );
}

export const ContactCardWithContext = memo(ContactCardWithContextImpl);
