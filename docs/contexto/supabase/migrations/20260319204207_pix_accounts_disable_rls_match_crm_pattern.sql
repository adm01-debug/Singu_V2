-- Desabilitar RLS para manter consistência com o padrão do CRM
-- (companies, suppliers, carriers, company_social_media — nenhuma tem RLS)
ALTER TABLE public.pix_accounts DISABLE ROW LEVEL SECURITY;
