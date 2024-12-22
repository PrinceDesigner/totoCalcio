CREATE
OR REPLACE FUNCTION update_user (p_uid text, p_displayname text, p_email text) RETURNS json AS $$
DECLARE
  v_updated_count int;
  r_userid text;
  r_displayname text;
  r_email text;
BEGIN
  -- Log iniziale
  PERFORM log_message('Function called for userid: ' || p_uid || ', displayname: ' || p_displayname || ', email: ' || p_email);

  -- Esegui l'update
  UPDATE users
  SET displayname = p_displayname, email = p_email
  WHERE userid = p_uid
  RETURNING userid, displayname, email INTO r_userid, r_displayname, r_email;

  -- Log del risultato
  IF r_userid IS NULL THEN
    PERFORM log_message('Nessun User trovato con ID: ' || p_uid);
    RETURN json_build_object(
      'userId',null,
      'displayName',null,
      'email',null);
  ELSE
    PERFORM log_message('Aggiornamento effettuato per ID: ' || r_userid);
    -- Restituisci i dettagli dell'utente aggiornato
    RETURN json_build_object(
      'userId', r_userid,
      'displayName', r_displayname,
      'email', r_email
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

--DROP FUNCTION update_user (text, text, text)

