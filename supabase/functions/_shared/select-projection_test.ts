import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isAllowedSelectProjection } from "./select-projection.ts";

const allowed = new Set(['companies', 'contacts', 'company_addresses', 'company_emails', 'company_phones']);
const canEmbed = (table: string) => allowed.has(table);

Deno.test('preserva as projeções usadas no Pipeline e nos detalhes da empresa', () => {
  for (const projection of [
    '*',
    'id, nome:nome_crm, email:metadata->>email, first_name::text',
    '*, company:companies(nome_crm), contact:contacts(first_name, last_name)',
    '*,company_addresses(id,is_primary,logradouro,numero,cidade,estado,latitude,longitude),company_emails(id,is_primary,email),company_phones(id,is_primary,numero)',
    'company:companies!deals_company_id_fkey!inner(id,phones:company_phones!left(numero))',
  ]) assertEquals(isAllowedSelectProjection(projection, canEmbed), true, projection);
});

Deno.test('verifica o nome real de cada relação mesmo com alias, hint e aninhamento', () => {
  for (const projection of [
    'contacts(id),leak:user_roles(*)',
    'companies(id,allowed:profiles(*))',
    'company:companies!inner(id,phones:company_phones!left(leak:secrets!owner_id(*)))',
    'company:companies(id,leak: user_roles ! inner (*))',
    'contacts:service_tokens(*)',
    'companies!inner(*),ai_gateway_metrics(*)',
  ]) assertEquals(isAllowedSelectProjection(projection, canEmbed), false, projection);
});

Deno.test('rejeita nomes qualificados, relações entre aspas e sintaxe não analisada', () => {
  for (const projection of [
    'auth.users(*)', 'companies(id),public.user_roles(*)',
    '"user_roles"(*)', 'leak:"user_roles"(*)', 'companies(id,"secrets"(*))',
    'companies(id)(user_roles(*))', 'companies(id)user_roles(*)',
    'companies()', 'companies(id,)', 'companies(id', 'id)', ',id',
    'companies(*);user_roles(*)', '',
  ]) assertEquals(isAllowedSelectProjection(projection, canEmbed), false, projection);
});

Deno.test('restringe complexidade antes de encaminhar a projeção ao banco', () => {
  assertEquals(isAllowedSelectProjection('companies('.repeat(9) + '*' + ')'.repeat(9), canEmbed), false);
  assertEquals(isAllowedSelectProjection('id,'.repeat(2048) + '*', canEmbed), false);
});

Deno.test('permite colunas planas e recusa embeddings quando a origem exige service-role', () => {
  assertEquals(isAllowedSelectProjection('id,metric:duration_ms::text', () => false), true);
  assertEquals(isAllowedSelectProjection('id,company:companies(*)', () => false), false);
});
