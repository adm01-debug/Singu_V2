CREATE TRIGGER trg_contact_phones_normalizar
BEFORE INSERT OR UPDATE ON contact_phones
FOR EACH ROW EXECUTE FUNCTION trg_normalizar_telefone_contact();
