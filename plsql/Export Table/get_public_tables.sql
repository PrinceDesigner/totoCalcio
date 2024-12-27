CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name text) AS $$
BEGIN
    RETURN QUERY SELECT tablename::text AS table_name
                FROM pg_tables
                WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql;
