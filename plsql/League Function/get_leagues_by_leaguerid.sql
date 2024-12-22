
CREATE OR REPLACE FUNCTION get_leagues_by_leaguerid(p_league_id text) RETURNS TABLE (
  id_league_ret text,
  name text,
  owneridret text[], -- Puoi aggiungere altri campi di interesse
  membri_count bigint -- Contatore dei partecipanti per la lega
) LANGUAGE plpgsql AS $$

BEGIN
  -- Restituisce le leghe utilizzando l'array `league_ids`
  RETURN QUERY
  SELECT
    mf.id_league,
    l.name,
    l.ownerid,
    --mf.userid,
    --mf.punti,
    COUNT(mf.userid) OVER (PARTITION BY mf.id_league) AS membri_count
  FROM
    members_info mf
  JOIN
    leagues l ON mf.id_league = l.id_league
  WHERE
    mf.id_league = p_league_id
  GROUP BY mf.id_league, l.name, l.ownerid, mf.userid, mf.punti
  ORDER BY mf.id_league,mf.punti DESC;
END;
$$;

SELECT * FROM get_leagues_by_leaguerid ('sMpDmETOUzzpAsMFjApF');

DROP FUNCTION get_leagues_by_leaguerid (text)
