import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string | null;
  roles: string[];
}

/**
 * Hook para consumir uma feature flag.
 * Retorna `true` apenas se a flag existir e estiver ativa.
 */
export function useFeatureFlag(name: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flag", name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("name, enabled, description, roles")
        .eq("name", name)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as FeatureFlag | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    enabled: !!data?.enabled,
    flag: data,
    isLoading,
  };
}

/** Lista todas as feature flags (para painel admin). */
export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("name")
        .limit(100);
      if (error) throw error;
      return (data ?? []) as FeatureFlag[];
    },
    staleTime: 60 * 1000,
  });
}
