import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, MessageSquare, Phone, Mail, Globe, Users, Edit, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { useInteractions } from '@/hooks/useInteractions';
import type { SentimentType } from '@/types';

const interactionIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Globe,
};

const interactionColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success',
  call: 'bg-info/10 text-info',
  email: 'bg-primary/10 text-primary',
  meeting: 'bg-warning/10 text-warning',
  note: 'bg-muted text-muted-foreground',
  social: 'bg-accent text-accent-foreground',
};

interface CompanyInteractionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

/**
 * Modal lightweight com a lista de interações da empresa.
 * Permite "Abrir página completa" (/interacoes?company=ID) preservando a página de origem.
 */
export function CompanyInteractionsModal({
  open,
  onOpenChange,
  companyId,
  companyName,
}: CompanyInteractionsModalProps) {
  const { interactions, loading } = useInteractions(undefined, companyId, { enabled: open });

  const sorted = useMemo(
    () =>
      [...interactions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [interactions],
  );

  const fullPagePath = `/interacoes?company=${encodeURIComponent(companyId)}`;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Interações de {companyName}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {loading
              ? 'Carregando…'
              : sorted.length === 0
                ? 'Nenhuma interação registrada.'
                : `${sorted.length} interaç${sorted.length === 1 ? 'ão' : 'ões'} mais recente${sorted.length === 1 ? '' : 's'}.`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ScrollArea className="flex-1 -mx-2 px-2">
          {loading ? (
            <div className="space-y-2 py-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-60" />
              <p className="text-sm text-muted-foreground">
                Esta empresa ainda não tem interações registradas.
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {sorted.slice(0, 30).map((interaction, index) => {
                const Icon = interactionIcons[interaction.type] || MessageSquare;
                const colorClass = interactionColors[interaction.type] || interactionColors.note;
                return (
                  <motion.div
                    key={interaction.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                    className="flex items-start gap-3 p-3 rounded-md border border-border/40 hover:border-border/70 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm truncate">
                          {interaction.title || 'Sem título'}
                        </h4>
                        <SentimentIndicator
                          sentiment={(interaction.sentiment as SentimentType) || 'neutral'}
                          size="sm"
                        />
                        {interaction.follow_up_required && (
                          <Badge variant="outline" className="text-warning border-warning text-[10px]">
                            Follow-up
                          </Badge>
                        )}
                      </div>
                      {interaction.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {interaction.content}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                        {format(new Date(interaction.created_at), "dd MMM yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {sorted.length > 30 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Mostrando as 30 mais recentes. Abra a página completa para ver todas.
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={fullPagePath}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir interações de ${companyName} em nova aba`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Nova aba
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link to={fullPagePath} onClick={() => onOpenChange(false)}>
                Página completa
              </Link>
            </Button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
