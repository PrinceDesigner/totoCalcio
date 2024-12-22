CREATE OR REPLACE FUNCTION get_all_schedine() RETURNS TABLE (
  user_id_ret text,
  esito_giocato_ret text,
  match_id_ret text,
  away_team_ret text,
  home_team_ret text,
  result_ret text,
  displayname_ret text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.userid,
    s.esitogiocato,
    m.matchid,
    m.awayteam,
    m.hometeam,
    m.result,
    u.displayname
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
  ORDER BY
    u.displayname DESC;  -- Ordina per ID della schedina
END;
$$;

-- Esecuzione della funzione
SELECT * FROM get_all_schedine();
