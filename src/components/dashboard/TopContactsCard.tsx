import { Users, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MotionStyle, Transition, TargetAndTransition } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { RoleBadge } from '@/components/ui/role-badge';
import { Surface } from '@/components/ui/surface';
import { Typography } from '@/components/ui/typography';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pluralize } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ContactRole } from '@/types';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface StaggerAnimation {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
  style: MotionStyle;
}

interface TopContactsCardProps {
  contacts: DashboardStats['topContacts'];
  animations: StaggerAnimation[];
}

/** Semantic score colors and labels */
function getScoreVisual(score: number) {
  if (score >= 80) return { bg: 'bg-success/15 border-success/30', text: 'text-success', label: 'Excelente', ring: 'ring-success/30' };
  if (score >= 60) return { bg: 'bg-primary/15 border-primary/30', text: 'text-primary', label: 'Bom', ring: 'ring-primary/30' };
  if (score >= 40) return { bg: 'bg-warning/15 border-warning/30', text: 'text-warning', label: 'Regular', ring: 'ring-warning/30' };
  return { bg: 'bg-destructive/15 border-destructive/30', text: 'text-destructive', label: 'Baixo', ring: 'ring-destructive/30' };
}

/** Get avatar ring color based on score */
function getAvatarRing(score: number) {
  if (score >= 80) return 'border-success/40';
  if (score >= 60) return 'border-primary/40';
  if (score >= 40) return 'border-warning/40';
  return 'border-destructive/30';
}

/** Contextual insight when all scores are low */
function LowScoreHint() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/5 border border-warning/15 mt-2">
      <TrendingUp className="w-3.5 h-3.5 text-warning shrink-0" />
      <p className="text-[11px] text-muted-foreground">
        <span className="text-warning font-medium">Dica:</span> Registre interações para elevar os scores de relacionamento.
      </p>
    </div>
  );
}

export function TopContactsCard({ contacts, animations }: TopContactsCardProps) {
  const allLowScores = contacts.length > 0 && contacts.every(c => c.relationshipScore < 40);

  return (
    <Card className="h-full border-border/60 hover:border-border transition-colors overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-success to-primary/60 rounded-t-xl" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-success/15 to-primary/10 ring-1 ring-success/20">
            <Users className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          </div>
          Melhores Relacionamentos
        </CardTitle>
        <Link to="/contatos">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Ver todos <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-2 pr-2">
            {contacts.length === 0 ? (
              <EmptyState
                illustration="contacts"
                title="Nenhum contato"
                description="Adicione contatos para ver seus melhores relacionamentos."
                actions={[
                  { label: 'Adicionar contato', onClick: () => {}, variant: 'default' }
                ]}
              />
            ) : (
              <>
                {contacts.map((contact, index) => {
                  const animation = animations[index];
                  const scoreVisual = getScoreVisual(contact.relationshipScore);
                  const avatarRing = getAvatarRing(contact.relationshipScore);
                  
                  return (
                    <motion.div
                      key={contact.id}
                      initial={animation?.initial}
                      animate={animation?.animate}
                      transition={animation?.transition}
                      style={animation?.style}
                    >
                      <Link to={`/contatos/${contact.id}`} className="block">
                        <Surface
                          level={1}
                          hoverable
                          rounded="lg"
                          className="flex items-center justify-between p-3 group cursor-pointer hover:border-primary/15"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <OptimizedAvatar
                                src={contact.avatar || undefined}
                                alt={`${contact.firstName} ${contact.lastName}`}
                                fallback={`${contact.firstName?.[0] || 'C'}${contact.lastName?.[0] || 'N'}`}
                                size="md"
                                className={cn("w-10 h-10 border-2 transition-colors", avatarRing, "group-hover:border-primary/50")}
                              />
                              {/* Position indicator dot */}
                              <span className="absolute -top-0.5 -right-0.5 text-[10px] font-bold text-muted-foreground/60">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {contact.firstName} {contact.lastName}
                              </p>
                              {contact.companyName && (
                                <Typography variant="small" as="p">
                                  {contact.companyName}
                                </Typography>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <RoleBadge role={contact.role as ContactRole} />
                                {contact.interactionCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    {pluralize(contact.interactionCount, 'interação', 'interações')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.lastInteraction && (
                              <span className="text-[10px] text-muted-foreground hidden sm:block">
                                {formatDistanceToNow(contact.lastInteraction, { locale: ptBR, addSuffix: true })}
                              </span>
                            )}
                            {/* Semantic score badge */}
                            <div 
                              className={cn(
                                "flex flex-col items-center px-2.5 py-1.5 rounded-lg border min-w-[52px]",
                                scoreVisual.bg
                              )}
                              role="meter" 
                              aria-valuenow={contact.relationshipScore} 
                              aria-valuemin={0} 
                              aria-valuemax={100}
                              aria-label={`Score: ${contact.relationshipScore}`}
                            >
                              <span className={cn("text-sm font-bold tabular-nums leading-none", scoreVisual.text)}>
                                {contact.relationshipScore}
                              </span>
                              <span className={cn("text-[9px] font-medium leading-tight mt-0.5", scoreVisual.text)}>
                                {scoreVisual.label}
                              </span>
                            </div>
                          </div>
                        </Surface>
                      </Link>
                    </motion.div>
                  );
                })}
                {allLowScores && <LowScoreHint />}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
