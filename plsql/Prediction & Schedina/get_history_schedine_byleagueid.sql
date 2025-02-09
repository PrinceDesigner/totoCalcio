CREATE OR REPLACE FUNCTION get_history_schedine_byleagueid(p_league_id text, p_user_id text)
RETURNS TABLE(
    "predictionId" UUID,
    "daysId" text,
    "leagueId" text,
    punti integer,
    schedina json
)
LANGUAGE plpgsql AS
$$
BEGIN
-- Restituzione della tabella combinata con JSON array per schedine
RETURN QUERY
SELECT
    p.predictionid ,
    p.dayid ,
    p.id_league ,
    p.punti,
    json_agg(jsonb_build_object(
    'esitoGiocato', s.esitogiocato,
    'result', s.result,
    'matchId', s.matchid,
    'startTime', m.starttime,
    'awayTeam', m.awayteam,
    'homeTeam', m.hometeam,
    'correct',
        CASE
        WHEN s.esitogiocato IS NOT NULL AND s.esitogiocato <> ''
                AND m.result IS NOT NULL AND m.result <> ''
                AND s.esitogiocato = m.result
        THEN true
        ELSE false
        END
    )) AS schedina
FROM
    predictions p
LEFT JOIN
    schedina s ON s.prediction_id = p.predictionid
LEFT JOIN
    matches m on s.matchid = m.matchid
WHERE
    p.id_league = p_league_id AND
    p.userid = p_user_id
GROUP BY
    p.predictionid, p.dayid, p.id_league, p.punti
ORDER BY
    p.dayid;  -- ordinare i risultati per dayid
END;
$$;