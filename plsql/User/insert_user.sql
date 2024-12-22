CREATE OR REPLACE FUNCTION insert_user(p_uid text, p_displayname text, p_email text)
RETURNS void AS
$$
BEGIN
  INSERT INTO users (userid, displayname, email)
  VALUES (p_uid, p_displayname, p_email);
END;
$$ LANGUAGE plpgsql;
DROP FUNCTION insert_user(text,text,text)