-- Drop the existing index on lower(email) as it doesn't match the UPSERT conflict specification
DROP INDEX IF EXISTS ux_asistentes_email_lower;

-- Add a direct unique constraint on email column to support UPSERT with onConflict: 'email'
ALTER TABLE asistentes 
ADD CONSTRAINT ux_asistentes_email UNIQUE (email);