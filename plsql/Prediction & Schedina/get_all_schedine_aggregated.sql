CREATE OR REPLACE FUNCTION get_all_schedine_aggregated() RETURNS TABLE (
  displayname_ret text,
  schedine jsonb  -- JSONB aggregato per ogni displayName
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.userid,
    jsonb_agg(
      jsonb_build_object(
        'displayName', u.displayname,
        'esito_giocato', s.esitogiocato,
        'match_id', m.matchid,
        'away_team', m.awayteam,
        'home_team', m.hometeam,
        'result', m.result
      )
    ) AS schedine
  FROM
    schedina s
  JOIN
    predictions p ON s.prediction_id = p.predictionid  -- Join con la tabella predictions
  JOIN
    matches m ON s.matchid = m.matchid  -- Join con la tabella matches
  JOIN
    leagues l ON p.id_league = l.id_league  -- Join con la tabella leagues
  JOIN
    users u ON p.userid = u.userid  -- Join con la tabella users
  GROUP BY
    u.userid  -- Raggruppa per displayname
  ORDER BY
    u.displayname;  -- Ordina per displayname
END;
$$;

-- Esecuzione della funzione
SELECT * FROM get_all_schedine_aggregated();
