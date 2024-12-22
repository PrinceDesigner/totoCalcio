
CREATE OR REPLACE FUNCTION join_league(
    p_league_id TEXT,
    p_userid TEXT
)
RETURNS TABLE (
    id_league_ret TEXT,
    name_ret TEXT,
    ownerid_ret TEXT[],
    n_partecipanti_ret INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT;
    v_n_partecipanti INT;
    v_count_league INT;
BEGIN
    -- Controlla se l'utente è già nella lega
    SELECT COUNT(*) INTO v_count_league
    FROM leagues
    WHERE id_league = p_league_id;
    IF v_count_league = 0 THEN
        RAISE EXCEPTION 'Lega non trovata';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM members_info
    WHERE userid = p_userid AND id_league = p_league_id;

    IF v_count > 0 THEN
        RAISE EXCEPTION 'Utente già presente nella lega';
    END IF;

    -- Inserisci l'utente nella lega
    INSERT INTO members_info (userid, punti, id_league)
    VALUES (p_userid, 0, p_league_id);

    -- Calcola il numero di partecipanti
    SELECT COUNT(*) INTO v_n_partecipanti
    FROM members_info
    WHERE id_league = p_league_id;

    -- Restituisci i dati richiesti
    RETURN QUERY
    SELECT
        l.id_league,
        l.name,
        l.ownerid,
        v_n_partecipanti
    FROM leagues l
    WHERE l.id_league = p_league_id;
END;
$$;