import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type EmailVerifyResult = {
  email: string;
  status: "valid" | "invalid" | "risky" | "unknown" | "catchall";
  score: number;
  mx_found: boolean;
  disposable: boolean;
  role_account: boolean;
  free_provider: boolean;
  reasons: string[];
};

type PhoneValidateResult = {
  status: "valid" | "invalid" | "unreachable" | "unknown";
  line_type: string | null;
  country: string | null;
  country_code: string | null;
  phone_e164: string | null;
  reasons: string[];
};

export function useEmailVerifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { email: string; contactId?: string | null }) => {
      const { data, error } = await supabase.functions.invoke<EmailVerifyResult>("email-verifier", { body: vars });
      if (error) throw error;
      return data!;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["email-verifications"] });
      toast.success(`✉️ Email ${data.status} (score ${data.score})`);
    },
    onError: (err) => { logger.error("email-verifier error", err); toast.error("Erro ao verificar email"); },
  });
}

export function useEmailFinder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { firstName: string; lastName: string; domain: string; contactId?: string | null }) => {
      const { data, error } = await supabase.functions.invoke("email-finder", { body: vars });
      if (error) throw error;
      return data as { best: EmailVerifyResult; candidates: EmailVerifyResult[] };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["email-finder-results"] });
      toast.success(`🔎 Melhor email: ${data.best?.email ?? "n/d"}`);
    },
    onError: (err) => { logger.error("email-finder error", err); toast.error("Erro ao buscar email"); },
  });
}

export function usePhoneValidator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { phone: string; defaultCountry?: string; contactId?: string | null }) => {
      const { data, error } = await supabase.functions.invoke<PhoneValidateResult>("phone-validator", { body: vars });
      if (error) throw error;
      return data!;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["phone-validations"] });
      toast.success(`📞 Telefone ${data.status} (${data.line_type ?? "?"})`);
    },
    onError: (err) => { logger.error("phone-validator error", err); toast.error("Erro ao validar telefone"); },
  });
}

export function useEmailVerifications(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email-verifications", user?.id, contactId],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("email_verifications").select("*").eq("user_id", user!.id).order("verified_at", { ascending: false }).limit(50);
      if (contactId) q = q.eq("contact_id", contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePhoneValidations(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["phone-validations", user?.id, contactId],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("phone_validations").select("*").eq("user_id", user!.id).order("validated_at", { ascending: false }).limit(50);
      if (contactId) q = q.eq("contact_id", contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEmailFinderResults() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["email-finder-results", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("email_finder_results").select("*").eq("user_id", user!.id).order("found_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePeopleIntelligenceEvents(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["people-intel-events", user?.id, contactId],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("people_intelligence_events").select("*").eq("user_id", user!.id).order("detected_at", { ascending: false }).limit(50);
      if (contactId) q = q.eq("contact_id", contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
