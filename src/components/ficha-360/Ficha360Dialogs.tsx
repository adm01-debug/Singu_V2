import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ResumoConversaIADialog } from './ResumoConversaIADialog';

interface Ficha360DialogsProps {
  id: string | undefined;
  resumoIAOpen: boolean;
  onResumoIAOpenChange: (open: boolean) => void;
  confirmClearOpen: boolean;
  onConfirmClearOpenChange: (open: boolean) => void;
  performClearAll: () => void;
  sortedInteractions: any[];
  fullName: string;
  profile: any;
  filters: {
    days: number;
    channels: string[];
    tags: string[];
    q: string;
  };
}

export function Ficha360Dialogs({
  id,
  resumoIAOpen,
  onResumoIAOpenChange,
  confirmClearOpen,
  onConfirmClearOpenChange,
  performClearAll,
  sortedInteractions,
  fullName,
  profile,
  filters
}: Ficha360DialogsProps) {
  return (
    <>
      {id && (
        <ResumoConversaIADialog
          open={resumoIAOpen}
          onOpenChange={onResumoIAOpenChange}
          contactId={id}
          interactions={sortedInteractions.map((it) => ({
            id: it.id,
            channel: it.channel ?? null,
            direction: it.direction ?? null,
            data_interacao: it.data_interacao ?? null,
            assunto: it.assunto ?? null,
            resumo: it.resumo ?? null,
          }))}
          contactSnapshot={{
            full_name: fullName,
            role_title: profile?.cargo ?? null,
            company_name: profile?.company_name ?? null,
            disc_profile: null,
            hobbies: [],
            interests: [],
          }}
          filtersSummary={{
            period_days: filters.days,
            channels: filters.channels,
            tags: filters.tags,
            query: filters.q,
          }}
        />
      )}

      <AlertDialog open={confirmClearOpen} onOpenChange={onConfirmClearOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os filtros?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai desativar {filters.channels.length > 0 ? `${filters.channels.length} canal${filters.channels.length === 1 ? '' : 'is'}` : 'os canais'}
              {filters.tags.length > 0 ? `, remover ${filters.tags.length} tag${filters.tags.length === 1 ? '' : 's'}` : ''}
              {filters.q ? ', limpar a busca' : ''}
              {filters.days !== 90 ? ' e voltar o período para 90 dias' : ''}.
              Os parâmetros serão removidos da URL — links já compartilhados continuam funcionando.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performClearAll}>Limpar tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}