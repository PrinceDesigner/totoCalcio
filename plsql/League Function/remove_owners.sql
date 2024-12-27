CREATE OR REPLACE FUNCTION remove_owners(p_league_id text, p_ownerid text)
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
    -- Restituisce l'array aggiornato
RETURN json_build_object('status', 'OK', 'updated_owners', updated_owners);

EXCEPTION
    WHEN OTHERS THEN
    -- Gestione errori
    RETURN json_build_object('status', 'KO', 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
