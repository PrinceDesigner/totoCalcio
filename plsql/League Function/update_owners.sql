CREATE OR REPLACE FUNCTION update_owners(p_league_id text, p_ownerid text, p_action text)
RETURNS json AS $$
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

  -- Controllo dell'azione (aggiungi o rimuovi)
  IF p_action = 'ADD' THEN
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

  ELSIF p_action = 'REMOVE' THEN
    -- Rimuovi l'ownerId dall'array degli owner, se esiste
    IF p_ownerid = ANY(updated_owners) THEN
      UPDATE leagues
      SET ownerid = array_remove(ownerid, p_ownerid)
      WHERE id_league = p_league_id
      RETURNING ownerid INTO updated_owners;
    ELSE
      -- Se l'ownerId non esiste nell'array
      RETURN json_build_object('status', 'KO', 'message', 'OwnerId not found');
    END IF;

  ELSE
    -- Se l'azione non è riconosciuta
    RETURN json_build_object('status', 'KO', 'error', 'Invalid action');
  END IF;

  -- Restituisce l'array aggiornato
  RETURN json_build_object('status', 'OK', 'updated_owners', updated_owners);

EXCEPTION
  WHEN OTHERS THEN
    -- Gestione errori
    RETURN json_build_object('status', 'KO', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

