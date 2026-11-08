-- GAP 1: Bloquear pix_chave vazia
ALTER TABLE public.pix_accounts 
ADD CONSTRAINT chk_pix_chave_not_empty CHECK (pix_chave <> '');

-- GAP 2: Bloquear pix_favorecido vazio (mesma lógica — se preencheu, não pode ser '')
ALTER TABLE public.pix_accounts 
ADD CONSTRAINT chk_pix_favorecido_not_empty CHECK (pix_favorecido IS NULL OR pix_favorecido <> '');
