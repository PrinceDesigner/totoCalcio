CREATE OR REPLACE FUNCTION get_giornate_calcolate_byleagueid(p_leagueid TEXT) RETURNS TABLE (
    league_id TEXT,
    dayid_ret TEXT,
    calcolate_ret BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        id_league AS league_id,
        dayid::TEXT AS dayid_ret,
        calcolate::BOOLEAN AS calcolate_ret
    FROM
        giornatecalcolate
    WHERE
        id_league = p_leagueid;
END;
$$;
