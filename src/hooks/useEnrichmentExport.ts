import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export type EmailFilter = "any" | "valid" | "invalid";
export type PhoneFilter = "any" | "valid" | "invalid";

export interface ExportFilters {
  emailFilter: EmailFilter;
  phoneFilter: PhoneFilter;
  intelOnly: boolean;
  limit: 1000 | 5000 | 10000;
}

export interface ExportRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email_status: string;
  email_score: string;
  email_verified_at: string;
  phone: string;
  phone_status: string;
  phone_e164: string;
  phone_line_type: string;
  phone_country: string;
  has_intel_event: string;
  last_intel_event_at: string;
  role_title: string;
  company_name: string;
  created_at: string;
}

interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  created_at: string;
  company_id: string | null;
}

function csvEscape(v: string): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows: ExportRow[]): string {
  const headers: (keyof ExportRow)[] = [
    "id", "first_name", "last_name", "email", "email_status", "email_score",
    "email_verified_at", "phone", "phone_status", "phone_e164", "phone_line_type",
    "phone_country", "has_intel_event", "last_intel_event_at", "role_title",
    "company_name", "created_at",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

function downloadBlob(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useEnrichmentExport() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (filters: ExportFilters) => {
      if (!user) throw new Error("Não autenticado");

      const [contactsRes, emailsRes, phonesRes, intelRes, companiesRes] = await Promise.all([
        supabase.from("contacts")
          .select("id, first_name, last_name, email, phone, role_title, created_at, company_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(filters.limit),
        supabase.from("email_verifications")
          .select("email, status, score, verified_at")
          .eq("user_id", user.id)
          .order("verified_at", { ascending: false })
          .limit(10000),
        supabase.from("phone_validations")
          .select("phone_e164, status, line_type, country, validated_at")
          .eq("user_id", user.id)
          .order("validated_at", { ascending: false })
          .limit(10000),
        supabase.from("people_intelligence_events")
          .select("contact_id, detected_at")
          .eq("user_id", user.id)
          .order("detected_at", { ascending: false })
          .limit(10000),
        supabase.from("companies")
          .select("id, name")
          .eq("user_id", user.id)
          .limit(10000),
      ]);

      if (contactsRes.error) throw contactsRes.error;
      const contacts = (contactsRes.data ?? []) as ContactRow[];

      const emailMap = new Map<string, { status: string; score: number; verified_at: string }>();
      for (const e of (emailsRes.data ?? [])) {
        const k = (e.email ?? "").toLowerCase().trim();
        if (k && !emailMap.has(k)) emailMap.set(k, { status: e.status ?? "", score: Number(e.score ?? 0), verified_at: e.verified_at ?? "" });
      }

      const phoneMap = new Map<string, { status: string; line_type: string; country: string; e164: string }>();
      for (const p of (phonesRes.data ?? [])) {
        const digits = (p.phone_e164 ?? "").replace(/\D/g, "");
        if (digits && !phoneMap.has(digits)) phoneMap.set(digits, {
          status: p.status ?? "", line_type: p.line_type ?? "", country: p.country ?? "", e164: p.phone_e164 ?? "",
        });
      }

      const intelMap = new Map<string, string>();
      for (const ev of (intelRes.data ?? [])) {
        const cid = ev.contact_id;
        if (cid && !intelMap.has(cid)) intelMap.set(cid, ev.detected_at ?? "");
      }

      const companyMap = new Map<string, string>();
      for (const c of (companiesRes.data ?? [])) {
        companyMap.set(c.id, c.name ?? "");
      }

      const findPhone = (phone: string | null) => {
        if (!phone) return undefined;
        const digits = phone.replace(/\D/g, "");
        if (phoneMap.has(digits)) return phoneMap.get(digits);
        for (const [k, v] of phoneMap) {
          if (k.endsWith(digits) || digits.endsWith(k)) return v;
        }
        return undefined;
      };

      const rows: ExportRow[] = [];
      for (const c of contacts) {
        const emailKey = (c.email ?? "").toLowerCase().trim();
        const ev = emailKey ? emailMap.get(emailKey) : undefined;
        const pv = findPhone(c.phone);
        const intelAt = intelMap.get(c.id);

        if (filters.emailFilter === "valid" && ev?.status !== "valid") continue;
        if (filters.emailFilter === "invalid" && ev?.status === "valid") continue;
        if (filters.phoneFilter === "valid" && pv?.status !== "valid") continue;
        if (filters.phoneFilter === "invalid" && pv?.status === "valid") continue;
        if (filters.intelOnly && !intelAt) continue;

        rows.push({
          id: c.id,
          first_name: c.first_name ?? "",
          last_name: c.last_name ?? "",
          email: c.email ?? "",
          email_status: ev?.status ?? "",
          email_score: ev ? String(ev.score) : "",
          email_verified_at: ev?.verified_at ?? "",
          phone: c.phone ?? "",
          phone_status: pv?.status ?? "",
          phone_e164: pv?.e164 ?? "",
          phone_line_type: pv?.line_type ?? "",
          phone_country: pv?.country ?? "",
          has_intel_event: intelAt ? "true" : "false",
          last_intel_event_at: intelAt ?? "",
          role_title: c.role_title ?? "",
          company_name: c.company_id ? (companyMap.get(c.company_id) ?? "") : "",
          created_at: c.created_at,
        });
      }

      const csv = toCSV(rows);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(`enriquecimento-${date}.csv`, csv);
      return rows.length;
    },
    onSuccess: (count) => toast.success(`📥 ${count} contatos exportados`),
    onError: (err) => { logger.error("enrichment-export error", err); toast.error("Erro ao exportar CSV"); },
  });
}
