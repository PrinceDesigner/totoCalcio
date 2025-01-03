CREATE OR REPLACE FUNCTION insert_prediction_schedina (
  p_id_league TEXT[], -- Array di leghe
  p_dayid TEXT,       -- ID della giornata
  p_userid TEXT,      -- ID dell'utente
  p_schedina JSONB,   -- JSON array con i dettagli della schedina
  p_selectleague TEXT
) RETURNS JSONB AS $$
DECLARE
    v_predictionid UUID;
    v_predictions JSONB := '[]'::JSONB; -- Array JSON vuoto per raccogliere i risultati
    v_id_league TEXT; -- Variabile temporanea per iterare su ogni lega
    v_earliest_starttime TEXT; -- Variabile per la data di inizio più vicina

BEGIN
    -- Recupera la starttime più vicina per la giornata indicata
    SELECT starttime
    INTO v_earliest_starttime
    FROM matches
    WHERE dayid = p_dayid
    ORDER BY starttime::timestamptz ASC
    LIMIT 1;

    -- Se non ci sono risultati, restituisci un messaggio in JSON
    IF v_earliest_starttime IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Errore imprevisto'
        );
    END IF;

    -- Confronta la starttime più vicina con la data attuale
    IF CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Rome' > v_earliest_starttime::timestamptz THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Giornata gia iniziata'
        );
    END IF;

    -- Itera sull'array delle leghe
    FOREACH v_id_league IN ARRAY p_id_league LOOP
        -- Controlla se esiste già una prediction per la tripletta userid-leagueId-dayId
        SELECT predictionid
        INTO v_predictionid
        FROM predictions
        WHERE id_league = v_id_league
          AND dayid = p_dayid
          AND userid = p_userid
        LIMIT 1;

        -- Se esiste, aggiorna schedina per prediction_id
        IF FOUND THEN
            -- Aggiorna i dettagli della schedina solo per i dati forniti
            UPDATE schedina
            SET
                matchid = schedina_update.value->>'matchId',
                esitogiocato = schedina_update.value->>'esitoGiocato',
                result = NULL
            FROM JSONB_ARRAY_ELEMENTS(p_schedina) AS schedina_update(value)
            WHERE schedina_update.value->>'matchId' IS NOT NULL
            AND schedina_update.value->>'esitoGiocato' IS NOT NULL
            AND schedina.prediction_id = v_predictionid
            AND schedina.matchid = schedina_update.value->>'matchId';

        ELSE
            -- Se non esiste, crea una nuova predizione
            INSERT INTO predictions (predictionid, id_league, dayid, userid, punti)
            VALUES (gen_random_uuid(), v_id_league, p_dayid, p_userid, 0)
            RETURNING predictionid INTO v_predictionid;

            -- Inserisci nella tabella 'schedina' se ci sono schedine
            IF p_schedina IS NOT NULL THEN
                INSERT INTO schedina (prediction_id, matchid, esitogiocato, result)
                SELECT
                    v_predictionid,
                    schedina_Insert.value->>'matchId' AS matchid,
                    schedina_Insert.value->>'esitoGiocato' AS esitogiocato,
                    NULL AS result
                FROM JSONB_ARRAY_ELEMENTS(p_schedina) AS schedina_Insert(value)
                WHERE schedina_Insert.value->>'matchId' IS NOT NULL
                  AND schedina_Insert.value->>'esitoGiocato' IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM schedina s
                      WHERE s.prediction_id = v_predictionid
                        AND s.matchid = schedina_Insert.value->>'matchId'
                  );
            END IF;
        END IF;
    END LOOP;

    -- Recupera prediction e schedine per il campo specifico `p_selectleague`
    IF p_selectleague IS NOT NULL THEN
        SELECT jsonb_build_object(
            'prediction_id', (SELECT predictionid::TEXT FROM predictions WHERE id_league = p_selectleague AND userid = p_userid AND dayid = p_dayid LIMIT 1),
            'schedina', jsonb_agg(
                jsonb_build_object(
                    'matchId', schedina.matchid,
                    'esitoGiocato', schedina.esitogiocato,
                    'result', schedina.result
                )
            )
        ) INTO v_predictions
        FROM schedina
        WHERE prediction_id = (SELECT predictionid FROM predictions WHERE id_league = p_selectleague AND userid = p_userid  AND dayid = p_dayid LIMIT 1);
    END IF;

    -- Ritorna il risultato finale
    RETURN v_predictions;
END;
$$ LANGUAGE plpgsql;


SELECT * FROM insert_prediction_schedina