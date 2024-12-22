CREATE OR REPLACE FUNCTION get_leagues_by_leagueid(
    p_league_id text  -- ID dell'utente
) RETURNS TABLE (league_id text, league_name TEXT) AS $$
BEGIN
    -- Eseguiamo una query che recupera tutte le leghe associate all'utente
    RETURN QUERY
    SELECT l.id_league, l.name
    FROM leagues l
    WHERE l.id_league = p_league_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_leagues_by_leagueid('1f8GWAQIj473MlSkXbfk')