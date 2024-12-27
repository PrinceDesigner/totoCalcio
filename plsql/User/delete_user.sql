CREATE OR REPLACE FUNCTION delete_user(p_uid text)
RETURNS void AS
$$
BEGIN
-- Elimina l'utente dalla tabella 'users'
DELETE FROM users WHERE userid = p_uid;

-- Se necessario, puoi aggiungere ulteriori logiche per la rimozione di dati collegati manualmente
-- ma idealmente tutte le relazioni dovrebbero essere gestite con ON DELETE CASCADE.
END;
$$ LANGUAGE plpgsql;
