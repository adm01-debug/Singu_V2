-- ============================================================================
-- MELHORIA 13: Trigger AFTER INSERT em media/audio/links → atualiza messages
-- Mantém messages.has_media/has_audio/has_links sempre coerente
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.trg_set_has_media()
RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE zapp_history.messages SET has_media = TRUE WHERE id = NEW.message_id;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION zapp_history.trg_set_has_audio()
RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE zapp_history.messages SET has_audio = TRUE WHERE id = NEW.message_id;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION zapp_history.trg_increment_link_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE zapp_history.messages
  SET has_links = TRUE,
      link_count = link_count + 1
  WHERE id = NEW.message_id;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_mm_set_flag ON zapp_history.message_media;
CREATE TRIGGER trg_mm_set_flag
  AFTER INSERT ON zapp_history.message_media
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_set_has_media();

DROP TRIGGER IF EXISTS trg_ma_set_flag ON zapp_history.message_audio;
CREATE TRIGGER trg_ma_set_flag
  AFTER INSERT ON zapp_history.message_audio
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_set_has_audio();

DROP TRIGGER IF EXISTS trg_ml_increment ON zapp_history.message_links;
CREATE TRIGGER trg_ml_increment
  AFTER INSERT ON zapp_history.message_links
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_increment_link_count();
