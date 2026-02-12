-- Verify lesson_states table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'lesson_states';

-- Check the columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lesson_states'
ORDER BY ordinal_position;

-- Verify the table is in the public schema and exposed to PostgREST
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'lesson_states';

-- Force PostgREST to reload the schema (this notifies it about new tables)
NOTIFY pgrst, 'reload schema';
