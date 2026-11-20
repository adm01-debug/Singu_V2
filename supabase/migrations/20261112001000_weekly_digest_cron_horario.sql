-- O weekly-digest escolhe quem recebe pela hora de Brasília configurada por usuário (send_day/send_time);
-- precisa rodar de hora em hora. A trava de 20 h no código e a Idempotency-Key do Resend evitam reenvio.
-- [singu-idem] cron job guardado por existencia
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'singu-edge-weekly-digest') THEN
        EXECUTE $sql$ SELECT cron.alter_job(jobid, schedule := '23 * * * *') FROM cron.job WHERE jobname = 'singu-edge-weekly-digest' $sql$;
    END IF;
END $$;