CREATE OR REPLACE FUNCTION get_giornatecalcolate(p_id_league TEXT) RETURNS TABLE (
    id_giornata INTEGER,
    data_inizio DATE,
    data_fine DATE,
    risultato_totale INTEGER,
    punteggio_max INTEGER,
    punteggio_min INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        gc.id_giornata,
        gc.data_inizio,
        gc.data_fine,
        gc.risultato_totale,
        gc.punteggio_max,
        gc.punteggio_min
    FROM
        giornatecalcolate gc
    WHERE
        gc.id_league = p_id_league
    ORDER BY
        gc.id_giornata;
END;
$$;

