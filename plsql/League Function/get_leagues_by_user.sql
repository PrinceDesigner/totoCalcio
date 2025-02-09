CREATE OR REPLACE FUNCTION get_leagues_by_user(p_userid text) RETURNS TABLE (
  id_league_ret text,
  name text,
  owneridret text[], -- Puoi aggiungere altri campi di interesse
 -- user_ret text,
  --punti_user int,
  membri_count bigint -- Contatore dei partecipanti per la lega
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
    mf.id_league = ANY(league_ids)
  GROUP BY mf.id_league, l.name, l.ownerid, mf.userid, mf.punti
  ORDER BY mf.id_league,mf.punti DESC;
END;
$$;

SELECT * FROM get_leagues_by_user ('IkJzccYnwvYDP4dAhIZo4Rpu8Zj2');

DROP FUNCTION get_leagues_by_user (text)
