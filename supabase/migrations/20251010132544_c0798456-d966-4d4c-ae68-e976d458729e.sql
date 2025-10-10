-- Add canjes_habilitados column to eventos table
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS canjes_habilitados BOOLEAN DEFAULT false;

-- Create index for better performance when filtering by canjes_habilitados
CREATE INDEX IF NOT EXISTS idx_eventos_canjes_habilitados ON eventos(canjes_habilitados);