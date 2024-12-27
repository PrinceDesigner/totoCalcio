CREATE OR REPLACE FUNCTION delete_league(p_league_id text)
RETURNS json AS
$$
BEGIN
  -- Verifica se la lega esiste
  IF NOT EXISTS (SELECT 1 FROM leagues WHERE id_league = p_league_id) THEN
    RETURN json_build_object('status', 'KO', 'error', 'League not found');
  END IF;

  -- Elimina la lega dalla tabella leagues
  DELETE FROM leagues WHERE id_league = p_league_id;

  -- Restituisce un messaggio di successo
  RETURN json_build_object(
    'status', 'OK',
    'message', 'League and related data removed successfully',
    'id_league', p_league_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Gestione errori
    RETURN json_build_object('status', 'KO', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

