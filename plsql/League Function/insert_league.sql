
CREATE OR REPLACE FUNCTION insert_league(p_name text, p_ownerid text)
RETURNS TABLE (id_league_ret text, name_ret text, ownerid_ret text[],n_partecipanti_ret int) AS
$$
DECLARE
  new_league_id text; -- Variabile per memorizzare l'id della nuova lega
  v_num_partecipanti int;
BEGIN
  v_num_partecipanti = 1;
  -- Inserimento nella tabella leagues
  INSERT INTO leagues (id_league, name, ownerid, createdat)
  VALUES (gen_random_uuid(), p_name, ARRAY[p_ownerid], NOW())
  RETURNING id_league INTO new_league_id; -- Ottieni l'id della nuova lega

  INSERT INTO members_info (id_members,id_league,userid,punti)
  VALUES (gen_random_uuid(),new_league_id,p_ownerid,0);

  -- Recupero del record appena creato
  RETURN QUERY
  SELECT id_league AS id_league_ret, name AS name_ret, ownerid AS ownerid_ret,v_num_partecipanti
  FROM leagues
  WHERE id_league = new_league_id;
END;
$$ LANGUAGE plpgsql;

-- Esecuzione della funzione
DROP FUNCTION insert_league;
SELECT * FROM insert_league('1111111', 'IOO');