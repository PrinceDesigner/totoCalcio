CREATE OR REPLACE FUNCTION update_calcolata_flag(id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE giornatecalcolate
    SET calcolate = true
    WHERE idgiornatecalcolate = id;
END;
$$ LANGUAGE plpgsql;
