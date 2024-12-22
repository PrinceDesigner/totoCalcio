CREATE OR REPLACE FUNCTION get_leagueUser(p_userid text) RETURNS TABLE (
  id_league_ret text,
  name_ret text,
  ownerid_ret text[],
  membri_count_ret bigint
) LANGUAGE plpgsql AS $$
DECLARE
  league_ids text[];
BEGIN
  -- Recupera tutte le leghe a cui l'utente partecipa
  SELECT
    ARRAY_AGG(l.id_league)
  INTO
    league_ids
  FROM
    leagues l
  WHERE
    l.id_league IN (
      SELECT
        id_league
      FROM
        members_info
      WHERE
        userid = p_userid
    );

  -- Restituisce le leghe utilizzando l'array `league_ids`
  RETURN QUERY
  SELECT
    l.id_league,
    l.name,
    l.ownerid,
    COUNT(*) AS membri_count
  FROM
    leagues l
  JOIN
    members_info mf ON l.id_league = mf.id_league
  WHERE
    l.id_league = ANY(league_ids)
  GROUP BY l.id_league, l.name, l.ownerid
  ORDER BY l.id_league;
END;
$$;

-- Esecuzione della funzione
DROP FUNCTION get_leagueuser(text)
SELECT * FROM get_leagueUser ('IkJzccYnwvYDP4dAhIZo4Rpu8Zj2');
