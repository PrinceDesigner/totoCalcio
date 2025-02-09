CREATE OR REPLACE FUNCTION get_members_by_league (p_league_id text) RETURNS TABLE (
  id_user_ret text,
  displayname_ret text,
  punti_ret integer,
  ownerid_ret text[]
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.userid AS id_user,
    u.displayname,
    m.punti,
    l.ownerid
  FROM
    members_info m
  JOIN
    users u ON m.userid = u.userid  -- Join con la tabella users
  JOIN
  leagues l ON m.id_league = l.id_league
  WHERE
    m.id_league = p_league_id
  ORDER BY
    m.punti DESC;  -- Ordina per il punteggio, dal maggiore al minore
END;
$$;

-- Esecuzione della funzione
SELECT * FROM get_members_by_league('dHbc7owQOynDc1p9nSH9');
DROP FUNCTION get_members_by_league(text)
