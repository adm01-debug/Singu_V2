CREATE TABLE IF NOT EXISTS coop003_pending (id uuid PRIMARY KEY, cnpj text NOT NULL, metodo text NOT NULL);
GRANT ALL ON coop003_pending TO anon, authenticated;
