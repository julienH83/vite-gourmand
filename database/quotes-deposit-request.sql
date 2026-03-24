-- Ajout des colonnes pour tracer l'envoi des instructions d'acompte
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS deposit_instructions_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_instructions_sent_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index pour filtrer/chercher facilement
CREATE INDEX IF NOT EXISTS idx_quotes_deposit_instructions_sent_at
  ON quotes(deposit_instructions_sent_at);