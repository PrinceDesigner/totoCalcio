CREATE OR REPLACE FUNCTION user_notify(p_tokenNotify text, p_uid text)
RETURNS json AS $$
DECLARE
  r_rows_updated int;
BEGIN
  -- Esegui l'update e conta le righe aggiornate
  UPDATE users
  SET "tokenNotification" = p_tokenNotify
  WHERE userid = p_uid
  RETURNING 1 INTO r_rows_updated;

  -- Restituisci lo stato dell'operazione
  IF r_rows_updated = 1 THEN
    RETURN json_build_object(
      'status', 'OK',
      'message', 'Token notification updated successfully'
    );
  ELSE
    RETURN json_build_object(
      'status', 'ERROR',
      'message', 'User not found or token not updated'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
