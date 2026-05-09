import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface BattleCardItem { title: string; detail: string }
export interface ProofPoint { client: string; result: string }

export interface BattleCard {
  id: string;
  user_id: string;
  competitor_name: string;
  competitor_logo_url: string | null;
  summary: string | null;
  our_strengths: BattleCardItem[];
  their_strengths: BattleCardItem[];
  weaknesses: BattleCardItem[];
  pricing_comparison: string | null;
  win_themes: string[];
  landmines: string[];
  proof_points: ProofPoint[];
  version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBattleCards(search?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["battle-cards", user?.id, search],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("battle_cards").select("*").eq("active", true).order("competitor_name");
      if (search) q = q.ilike("competitor_name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as BattleCard[];
    },
  });
}

export function useBattleCard(id?: string) {
  return useQuery({
    queryKey: ["battle-card", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("battle_cards").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as unknown as BattleCard | null;
    },
  });
}

export function useUpsertBattleCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<BattleCard> & { id?: string }) => {
      if (!user) throw new Error("not authenticated");
      const payload: any = { ...input, user_id: user.id, last_updated_by: user.id };
      if (input.id) {
        const { data, error } = await supabase.from("battle_cards").update(payload).eq("id", input.id).select().maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Battle card não encontrado");
        return data;
      }
      const { data, error } = await supabase.from("battle_cards").insert(payload).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar battle card");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["battle-cards"] });
      qc.invalidateQueries({ queryKey: ["battle-card"] });
      toast.success("Battle card salvo");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar battle card"),
  });
}

export function useDeleteBattleCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("battle_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["battle-cards"] });
      toast.success("Battle card removido");
    },
  });
}
