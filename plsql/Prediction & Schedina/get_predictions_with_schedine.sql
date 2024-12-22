CREATE OR REPLACE FUNCTION get_predictions_with_schedine(p_league_id text, p_user_id text)
RETURNS TABLE(
  schedina_id UUID,
  esitogiocato text,
  result text,
  matchid text,
  prediction_id UUID,
  dayid text  -- aggiungere altre colonne di prediction
)
LANGUAGE plpgsql AS
$$
BEGIN
  -- Restituzione della tabella combinata con filtri
  RETURN QUERY
    SELECT
      s.schedina_id AS schedina_id,
      s.esitogiocato,
      s.result,
      s.matchid,
      p.predictionid AS prediction_id,  -- corretto riferimento al campo predictionid in prediction
      p.dayid  -- aggiungere altre colonne di prediction
    FROM
      schedina s
    JOIN
      predictions p ON s.prediction_id = p.predictionid
    WHERE
      p.id_league = p_league_id AND
      p.userid = p_user_id
    GROUP BY
      s.schedina_id, s.esitogiocato, s.result, s.matchid, p.predictionid, p.dayid
    ORDER BY
      p.dayid;  -- ordinare i risultati per dayid
END;
$$;



SELECT * FROM get_predictions_with_schedine('sMpDmETOUzzpAsMFjApF', 'IkJzccYnwvYDP4dAhIZo4Rpu8Zj2');
