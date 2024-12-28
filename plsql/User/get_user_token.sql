CREATE OR REPLACE FUNCTION get_user_token(p_uid text)
RETURNS json AS $$
DECLARE
  r_token text;
BEGIN
  -- Recupera il valore della colonna tokenNotification
  SELECT users."tokenNotification"
  INTO r_token
  FROM users
  WHERE userid = p_uid;

  -- Controlla se è stato trovato un valore
  IF r_token IS NOT NULL THEN
    RETURN json_build_object(
      'tokenNotification', r_token
    );
  ELSE
    RETURN json_build_object(
      'tokenNotification', ''
    );
  END IF;

END;
$$ LANGUAGE plpgsql;


SELECT * FROM get_user_token('3aLwrVwDRGXV21YzG0BuW2vF05x1');