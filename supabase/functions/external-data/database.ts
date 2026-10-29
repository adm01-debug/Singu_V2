import { createClient } from "npm:@supabase/supabase-js@2";
import type { RelationScope } from "../_shared/tenant-guard.ts";
import type { AllowedTable } from "./tables.ts";

export function getExternalClient() {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const key = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('External database credentials not configured');
  return createClient(url, key, {
    db: { schema: 'public' },
    global: { headers: { 'x-statement-timeout': '15000' } },
  });
}

// Por que o cliente de usuário não pode ser criado. O JWT do usuário só vale
// no projeto que o emitiu (SUPABASE_URL); mandar para outro projeto não aplica
// RLS por auth.uid(). Não há fallback para o service role: isso pularia a RLS.
export type UserScopedUnavailableReason = 'missing_env' | 'invalid_url' | 'origin_mismatch';

export function userScopedUnavailableReason(): UserScopedUnavailableReason | null {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const ownUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !ownUrl || !anonKey) return 'missing_env';
  try {
    return new URL(url).origin === new URL(ownUrl).origin ? null : 'origin_mismatch';
  } catch {
    return 'invalid_url';
  }
}

// Leituras, escritas e RPCs de usuário respeitam auth.uid() e RLS.
export function getUserScopedClient(authHeader: string) {
  if (userScopedUnavailableReason() !== null) return null;
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(url, anonKey, {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: authHeader, 'x-statement-timeout': '15000' },
    },
  });
}

export async function hasRelationAccess(
  client: ReturnType<typeof getExternalClient>,
  scope: RelationScope,
  relationId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from(scope.parentTable)
    .select('id')
    .eq('id', relationId)
    .eq('user_id', userId)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function getRelationIdForRecord(
  client: ReturnType<typeof getExternalClient>,
  table: AllowedTable,
  recordId: string,
  scope: RelationScope,
): Promise<string | null> {
  const { data, error } = await client
    .from(table)
    .select(scope.foreignKey)
    .eq('id', recordId)
    .maybeSingle();
  if (error || !data) return null;
  const relationId = (data as Record<string, unknown>)[scope.foreignKey];
  return typeof relationId === 'string' ? relationId : null;
}

export async function hasAdminRole(userId: string): Promise<boolean> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await admin.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });
  return !error && data === true;
}
