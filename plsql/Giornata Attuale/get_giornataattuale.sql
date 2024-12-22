CREATE
OR REPLACE FUNCTION get_giornataattuale () RETURNS text AS $$
BEGIN
    RETURN replace(replace((SELECT giornataattuale FROM giornataattuale LIMIT 1)::text, '(', ''), ')', '');
END;
$$ LANGUAGE plpgsql;

--drop function get_giornateattuale();
SELECT
  *
FROM
  get_giornataattuale ();
