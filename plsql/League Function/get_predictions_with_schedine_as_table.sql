--Anche se un members_info non ara una predictions giocata allora veranno inseriti i dati già esistenti
-- prendo tutti gli user che sono su memers_info _await_response
--per quelli user vado su predictions se non c'è inserisco i dati  già esistenti
--il resto che hanno le prediction avranno il calcolo

CREATE OR REPLACE FUNCTION get_predictions_with_schedine_as_table(p_id_league TEXT, p_dayid TEXT) RETURNS TABLE (
    displayname_ret text,
    id_user_ret text,
    punti_ret INTEGER,
    schedine jsonb,
    count_equal_results integer,
    punti_live_ret integer
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(u.displayname, '') AS displayname_ret,  -- Valore vuoto per utenti senza predictions
        COALESCE(u.userid, '') AS id_user_ret,            -- Valore vuoto per utenti senza predictions
        COALESCE(mi.punti, 0) AS punti_ret,              -- Valore zero per membri senza punti
        jsonb_agg(
            jsonb_build_object(
                'matchid', s.matchid,
                'esitogiocato', s.esitogiocato,
                'result', COALESCE(m.result, '')  -- Usa un valore vuoto se m.result è NULL
            )
        )FILTER (WHERE m.result IS NOT NULL AND p.id_league = p_id_league AND p.dayid = p_dayid) AS schedine,
        COUNT(CASE WHEN COALESCE(m.result, '') = COALESCE(s.esitogiocato, '') AND COALESCE(m.result, '') <> '' THEN 1 END)::integer AS count_equal_results,
        (COALESCE(mi.punti, 0) + COUNT(CASE WHEN COALESCE(m.result, null) = COALESCE(s.esitogiocato, '') THEN 1 END))::integer AS punti_live_ret
    FROM
        users u
    LEFT JOIN
        members_info mi ON u.userid = mi.userid AND mi.id_league = p_id_league
    LEFT JOIN
        predictions p ON u.userid = p.userid
    LEFT JOIN
        schedina s ON p.predictionid = s.prediction_id AND p.id_league = p_id_league and p.dayid = p_dayid
    LEFT JOIN
        matches m ON s.matchid = m.matchid
    WHERE
        mi.id_league = p_id_league -- Assicurarsi che anche utenti senza predizioni siano inclusi
    GROUP BY
        COALESCE(u.userid, ''), COALESCE(mi.punti, 0), COALESCE(u.displayname, '')
    ORDER BY
        punti_live_ret DESC;

END;
$$;


DROP FUNCTION get_predictions_with_schedine_as_table(text,text)

SELECT * FROM get_predictions_with_schedine_as_table('dHbc7owQOynDc1p9nSH9','RegularSeason-17')

