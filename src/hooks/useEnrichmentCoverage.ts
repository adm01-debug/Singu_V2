import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type EnrichmentCoverage = {
  totalContacts: number;
  emailsValid: number;
  emailsValidPct: number;
  phonesValid: number;
  phonesValidPct: number;
  withIntel: number;
  withIntelPct: number;
  withEmail: number;
  withEmailPct: number;
};

export function useEnrichmentCoverage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["enrichment-coverage", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<EnrichmentCoverage> => {
      if (!user) throw new Error('Usuário não autenticado');
      const uid = user.id;

      const [contactsRes, withEmailRes, emailsValidRes, phonesValidRes, intelRes] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("user_id", uid).not("email", "is", null),
        supabase.from("email_verifications").select("contact_id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "valid").not("contact_id", "is", null),
        supabase.from("phone_validations").select("contact_id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "valid").not("contact_id", "is", null),
        supabase.from("people_intelligence_events").select("contact_id", { count: "exact", head: true }).eq("user_id", uid).not("contact_id", "is", null),
      ]);

      const total = contactsRes.count ?? 0;
      const withEmail = withEmailRes.count ?? 0;
      const emailsValid = emailsValidRes.count ?? 0;
      const phonesValid = phonesValidRes.count ?? 0;
      const withIntel = intelRes.count ?? 0;

      const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

      return {
        totalContacts: total,
        withEmail,
        withEmailPct: pct(withEmail),
        emailsValid,
        emailsValidPct: pct(emailsValid),
        phonesValid,
        phonesValidPct: pct(phonesValid),
        withIntel,
        withIntelPct: pct(withIntel),
      };
    },
  });
}
