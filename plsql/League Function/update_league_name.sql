
CREATE OR REPLACE FUNCTION update_league_name(p_league_id text, p_new_name text)
RETURNS json AS $$
BEGIN
  -- Verifica se la lega esiste
  IF NOT EXISTS (SELECT 1 FROM leagues WHERE id_league = p_league_id) THEN
    RETURN json_build_object('status', 'KO', 'error', 'League not found');
  END IF;

  -- Aggiorna il nome della lega
  UPDATE leagues
  SET name = p_new_name
  WHERE id_league = p_league_id;

  -- Restituisce un messaggio di successo con il nuovo nome
  RETURN json_build_object('status', 'OK', 'message', 'League name updated successfully', 'new_name', p_new_name);

EXCEPTION
  WHEN OTHERS THEN
    -- Gestione errori
    RETURN json_build_object('status', 'KO', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
