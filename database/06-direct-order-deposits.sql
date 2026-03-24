-- ============================================================
-- Vite & Gourmand - Migration : Acompte commandes directes
-- Ajoute les statuts deposit_pending et confirmed à order_status
-- ============================================================

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'deposit_pending';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'confirmed';
