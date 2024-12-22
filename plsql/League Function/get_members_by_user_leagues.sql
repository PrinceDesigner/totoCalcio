
CREATE OR REPLACE FUNCTION get_members_by_user_leagues (p_userid text) RETURNS TABLE (
  id_league text,
  name text,
  punti integer,
  membro_info text -- informazioni aggiuntive del membro, come ad esempio altri dettagli
) LANGUAGE plpgsql AS $$
BEGIN
  -- Recupera tutti gli id delle leghe a cui l'utente partecipa
  RETURN QUERY
  SELECT
    mf.userid,
    mf.punti,
    mf.membro_info
  FROM
    members_info mf
  WHERE
    mf.id_league IN (
      SELECT
        league_id
      FROM
        leagues l
      JOIN
        members_info mi ON l.id = mi.id_league
      WHERE
        mi.userid = p_userid
    )
  ORDER BY
    mf.punti DESC;

END;
$$;


SELECT
  *
FROM
  get_members_by_userid ('IkJzccYnwvYDP4dAhIZo4Rpu8Zj2');

DROP FUNCTION get_members_by_userid (text)
