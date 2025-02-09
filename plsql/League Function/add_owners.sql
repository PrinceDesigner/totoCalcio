CREATE
OR REPLACE FUNCTION add_owners (p_league_id text, p_ownerid text) RETURNS json AS $$
DECLARE
  updated_owners text[];
BEGIN
  -- Recupera l'array di ownerid esistente dalla tabella leagues
  SELECT ownerid
  INTO updated_owners
  FROM leagues
  WHERE id_league = p_league_id;

  -- Verifica che l'array non sia vuoto
  IF updated_owners IS NULL THEN
    RETURN json_build_object('status', 'KO', 'error', 'League not found');
  END IF;

  -- Aggiungi l'ownerId all'array degli owner, se non esiste già
  IF NOT p_ownerid = ANY(updated_owners) THEN
    -- Aggiungi l'ownerid all'array se non esiste già
    UPDATE leagues
    SET ownerid = array_append(ownerid, p_ownerid)
    WHERE id_league = p_league_id
    RETURNING ownerid INTO updated_owners;
  ELSE
    -- Se l'ownerId è già presente
    RETURN json_build_object('status', 'KO', 'message', 'OwnerId already exists');
  END IF;
  -- Restituisce l'array aggiornato
  RETURN json_build_object('status', 'OK', 'updated_owners', updated_owners);

EXCEPTION
  WHEN OTHERS THEN
    -- Gestione errori
    RETURN json_build_object('status', 'KO', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
