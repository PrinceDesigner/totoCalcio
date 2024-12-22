CREATE OR REPLACE FUNCTION leave_league(p_league_id text, p_userid text)
RETURNS json AS $$
BEGIN
  -- Verifica se la lega esiste
  IF NOT EXISTS (SELECT 1 FROM leagues WHERE id_league = p_league_id) THEN
    RETURN json_build_object('status', 'KO', 'error', 'League not found');
  END IF;

  -- Verifica se l'utente è membro della lega
  IF NOT EXISTS (SELECT 1 FROM members_info WHERE id_league = p_league_id AND userid = p_userid) THEN
    RETURN json_build_object('status', 'KO', 'error', 'User is not a member of the league');
  END IF;

  -- Rimuove l'utente dalla lega
  DELETE FROM members_info WHERE id_league = p_league_id AND userid = p_userid;

  -- Restituisce un messaggio di successo
  RETURN json_build_object('status', 'OK', 'message', 'Member removed successfully', 'userid', p_userid, 'id_league', p_league_id);

EXCEPTION
  WHEN OTHERS THEN
    -- Gestione errori
    RETURN json_build_object('status', 'KO', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
