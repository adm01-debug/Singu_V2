ALTER TABLE public.sales DROP CONSTRAINT sales_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_status_check CHECK (status = ANY (ARRAY['completed','pending','cancelled','negotiation','proposal','qualification','discovery','lead']));
