import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailFinderWidget } from "./EmailFinderWidget";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  prefillFirstName?: string;
  prefillLastName?: string;
  prefillDomain?: string;
}

/**
 * Wrapper modal reutilizável para o EmailFinder.
 * Pré-preenche nome/sobrenome/domínio quando aberto a partir do detalhe de um contato.
 */
export function EmailFinderDialog({
  open,
  onOpenChange,
  contactId,
  prefillFirstName,
  prefillLastName,
  prefillDomain,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Buscar email do contato</DialogTitle>
        </DialogHeader>
        <EmailFinderWidget
          contactId={contactId}
          prefillFirstName={prefillFirstName}
          prefillLastName={prefillLastName}
          prefillDomain={prefillDomain}
          onApplied={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
