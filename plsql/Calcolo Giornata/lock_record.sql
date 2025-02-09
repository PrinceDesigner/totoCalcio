CREATE
OR REPLACE FUNCTION lock_record (id TEXT) RETURNS JSON AS $$
BEGIN
    -- Blocca il record per aggiornamento
    PERFORM *
    FROM giornatecalcolate
    WHERE idgiornatecalcolate = id
    FOR UPDATE;

    -- Imposta il timeout locale per il lock
    SET LOCAL lock_timeout = 15;
    -- Verifica finale del flag calcolate
    IF EXISTS (
        SELECT 1
        FROM giornatecalcolate
        WHERE idgiornatecalcolate = id AND calcolate = TRUE
    ) THEN
        RETURN json_build_object('status', 'completed', 'message', 'Giornata già calcolata');
    ELSE
        -- Altrimenti, il record è bloccato ma non è calcolato
        RETURN json_build_object('status', 'locked', 'message', 'Record bloccato, calcolo non ancora effettuato');
    END IF;
END;
$$ LANGUAGE plpgsql;
