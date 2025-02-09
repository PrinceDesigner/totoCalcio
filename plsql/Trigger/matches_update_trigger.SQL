-- NON TOCCARE FUNZIONA 21/12/2024
CREATE OR REPLACE FUNCTION matches_update_trigger() RETURNS trigger AS $$
declare
    url text;
    request_id bigint;
BEGIN
    -- Controlla se sia startTime che endTime sono stati aggiornati e sono diversi dai valori precedenti
    IF NEW.starttime <> OLD.starttime AND NEW.status = 'PST' THEN
        -- Imposta il valore dell'URL
        url := 'https://us-central1-totocalcioreact.cloudfunctions.net/scheduleJobOnUpdateSupa';

        -- Invoca la funzione personalizzata per chiamare l'API esterna
        SELECT net.http_post(
            url  := url::text,
            body := json_build_object('dayId', NEW.dayid,'startTime',new.starttime,'matchId',old.matchid)::jsonb,  -- Assicurati che NEW.dayid sia del tipo appropriato
            params := '{}'::jsonb,  -- Parametri vuoti
            timeout_milliseconds := 5000::integer  -- Assicurati che il timeout sia di tipo integer
        ) INTO request_id;  -- Cattura il valore restituito dalla funzione

    END IF;
    RETURN NEW;  -- Restituisce l'evento aggiornato
END;
$$ LANGUAGE plpgsql;

-- Applicazione del trigger alla tabella matches
CREATE TRIGGER matches_update_trigger
AFTER UPDATE OF starttime ON matches
FOR EACH ROW
EXECUTE FUNCTION matches_update_trigger();

