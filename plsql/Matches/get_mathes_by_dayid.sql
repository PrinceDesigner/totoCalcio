CREATE
OR REPLACE FUNCTION get_mathes_by_dayid (p_dayid TEXT) RETURNS JSONB AS $$
declare
 v_matches JSONB;
BEGIN
    SELECT
        jsonb_build_object(
            'dayId',p_dayid,
            'startDate',COALESCE(MIN(m.starttime), '1970-01-01 00:00:00'),  -- Data di inizio
            'endDate',COALESCE(MAX(m.starttime), '1970-01-01 00:00:00'),    -- Data di fine
            'matches',jsonb_agg(
            jsonb_build_object(
                'result', m.result,
                'matchId', m.matchid,
                'esitoGiocato', m.starttime,
                'startTime',m.starttime,
                'awayLogo',m.awaylogo,
                'awayTeam',m.awayteam,
                'homeLogo',m.homelogo,
                'homeTeam',m.hometeam,
                'result',m.result,
                'stadio',m.stadio,
                'status',m.status
            )
        )
    ) INTO v_matches
    FROM  matches m
    WHERE  m.dayid = p_dayid;
    -- Restituisce il risultato
    RETURN v_matches;
END;
$$ LANGUAGE plpgsql;


SELECT * FROM get_mathes_by_dayid('RegularSeason-1')