-- ============================================================
-- Vite & Gourmand - Migration : Paiement commandes
-- À exécuter APRÈS schema.sql + quotes_migration.sql
-- ============================================================

-- Ajout des colonnes paiement à la table orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method  VARCHAR(50)   NOT NULL DEFAULT 'sur_place',
  ADD COLUMN IF NOT EXISTS payment_status  VARCHAR(50)   NOT NULL DEFAULT 'non_paye',
  ADD COLUMN IF NOT EXISTS deposit_amount  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_id        UUID          REFERENCES quotes(id) ON DELETE SET NULL;

-- Index pour retrouver la commande liée à un devis
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
