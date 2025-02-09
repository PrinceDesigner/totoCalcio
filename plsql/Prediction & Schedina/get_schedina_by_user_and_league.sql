CREATE OR REPLACE FUNCTION get_schedina_by_user_and_league (
  p_userid text,
  p_league_id text,
  p_day_id text
) RETURNS JSONB AS $$
DECLARE
  v_prediction_id uuid;
  v_schedina JSONB;
BEGIN
  -- Recupera la predictionId dalla tabella predictions per l'userid e id_league
  SELECT p.predictionid
  INTO v_prediction_id
  FROM predictions p
  WHERE p.userid = p_userid
    AND p.id_league = p_league_id
    AND dayid = p_day_id -- RegularSeason-17

  LIMIT 1;  -- Limita a una sola predizione, assumendo che ci sia solo una predizione per il dato userid e lega

  -- Se la predictionId esiste, recupera le righe dalla tabella schedina
  IF v_prediction_id IS NOT NULL THEN
    SELECT
      jsonb_build_object('schedina',jsonb_agg(
        jsonb_build_object(
          'result', s.result,
          'matchId', s.matchid,
          'esitoGiocato', s.esitogiocato
        )
      )
    ) INTO v_schedina
    FROM schedina s
    WHERE s.prediction_id = v_prediction_id;
  ELSE
    -- Se non viene trovata la predictionId, restituisce un array vuoto
    v_schedina := '[]'::JSONB;
  END IF;

  -- Restituisce il risultato
  RETURN v_schedina;
END;
$$ LANGUAGE plpgsql;

--DROP FUNCTION get_schedina_by_user_and_league(text,text,text)