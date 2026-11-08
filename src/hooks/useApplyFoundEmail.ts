import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertExternalData, queryExternalData } from "@/lib/externalData";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { parseApiError } from '@/lib/errorMessages';

interface ApplyEmailVars {
  contactId: string;
  email: string;
  score?: number;
  source?: string;
}

interface ExistingEmailRow {
  id: string;
  is_primary: boolean | null;
}

/**
 * Aplica um email encontrado pelo EmailFinder a um contato.
 * Cria entry em `contact_emails` (tabela relacional externa).
 * Marca como `is_primary=true` se o contato ainda não possuir email principal.
 */
export function useApplyFoundEmail() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, email, score, source }: ApplyEmailVars) => {
      // 1) Verifica se já existe um email primário
      const { data: existing } = await queryExternalData<ExistingEmailRow>({
        table: "contact_emails",
        filters: [{ type: "eq", column: "contact_id", value: contactId }],
        range: { from: 0, to: 49 },
      });

      const hasPrimary = (existing ?? []).some((e) => e.is_primary === true);
      const alreadyExists = (existing ?? []).some(
        (e) => (e as unknown as { email?: string }).email?.toLowerCase() === email.toLowerCase()
      );

      if (alreadyExists) {
        throw new Error("Este email já está cadastrado no contato");
      }

      // 2) Insere novo registro em contact_emails
      const { error } = await insertExternalData("contact_emails", {
        contact_id: contactId,
        email,
        email_type: "corporativo",
        is_primary: !hasPrimary,
        is_verified: !!(score && score >= 70),
        confiabilidade: score ?? null,
        fonte: source ?? "email_finder",
        contexto: "Encontrado via EmailFinder",
      });

      if (error) throw error;
      return { email, isPrimary: !hasPrimary };
    },
    onSuccess: ({ email, isPrimary }, vars) => {
      qc.invalidateQueries({ queryKey: ["contact-relational-data", vars.contactId] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["email-verifications"] });
      toast.success(
        isPrimary
          ? `✉️ Email ${email} aplicado como principal`
          : `✉️ Email ${email} adicionado ao contato`
      );
    },
    onError: (err: Error) => {
      logger.error("apply-found-email error", err);
      toast.error(parseApiError(err, "Erro ao aplicar email no contato"));
    },
  });
}
