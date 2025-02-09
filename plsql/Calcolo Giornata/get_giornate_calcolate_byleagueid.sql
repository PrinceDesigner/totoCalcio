CREATE OR REPLACE FUNCTION get_giornate_calcolate_byleagueid(p_leagueid TEXT)
RETURNS TABLE (league_id TEXT, dayId_ret TEXT,calcolate_ret boolean)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        id_league AS league_id,
        dayid ,
        calcolate
    FROM giornatecalcolate
    WHERE id_league = p_leagueid;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_giornate_calcolate_byleagueid('2c5rcWd9QYMSxGyt5a0Q');

DROP FUNCTION get_giornate_calcolate_byleagueid(text)