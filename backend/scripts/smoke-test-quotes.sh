#!/usr/bin/env bash
# ============================================================
# Smoke tests — module Devis (Quotes)
# Usage : bash scripts/smoke-test-quotes.sh
# Prérequis : jq, curl, serveur API sur http://localhost:3000
# ============================================================

set -euo pipefail

BASE="http://localhost:3000/api"

echo ""
echo "=================================================="
echo "  SMOKE TESTS — Module Devis"
echo "=================================================="

# ── 1. Authentification ──────────────────────────────────
echo ""
echo "[1/8] Authentification client..."
USER_RESP=$(curl -sf -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"TestPass1!"}')
USER_TOKEN=$(echo "$USER_RESP" | jq -r '.token')
echo "     token client : ${USER_TOKEN:0:30}..."

echo ""
echo "[2/8] Authentification employé..."
EMP_RESP=$(curl -sf -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"employe@test.com","password":"TestPass1!"}')
EMP_TOKEN=$(echo "$EMP_RESP" | jq -r '.token')
echo "     token employé : ${EMP_TOKEN:0:30}..."

# ── 2. Création d'un brouillon de devis ──────────────────
echo ""
echo "[3/8] Création d'un brouillon de devis (client)..."
# Récupérer d'abord un menu existant
MENU_RESP=$(curl -sf "$BASE/menus" -H "Authorization: Bearer $USER_TOKEN")
MENU_ID=$(echo "$MENU_RESP" | jq -r '.[0].id')
MENU_PRICE=$(echo "$MENU_RESP" | jq -r '.[0].min_price')
echo "     menu_id : $MENU_ID, prix : $MENU_PRICE €/pers."

# Date future dans 30 jours
EVENT_DATE=$(date -d "+30 days" +%Y-%m-%d 2>/dev/null || date -v+30d +%Y-%m-%d)

DRAFT_RESP=$(curl -sf -X POST "$BASE/quotes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"event_type\": \"Mariage\",
    \"event_date\": \"$EVENT_DATE\",
    \"event_time\": \"18:00\",
    \"event_address\": \"12 rue de la Paix\",
    \"event_city\": \"Paris\",
    \"guest_count\": 50,
    \"dietary_notes\": \"3 végétariens\",
    \"items\": [
      {
        \"item_type\": \"menu\",
        \"menu_id\": \"$MENU_ID\",
        \"label\": \"Menu Mariage\",
        \"unit_price\": $MENU_PRICE,
        \"unit\": \"par_personne\",
        \"quantity\": 1
      }
    ]
  }")
QUOTE_ID=$(echo "$DRAFT_RESP" | jq -r '.id')
QUOTE_STATUS=$(echo "$DRAFT_RESP" | jq -r '.status')
QUOTE_TOTAL=$(echo "$DRAFT_RESP" | jq -r '.total')
echo "     quote_id  : $QUOTE_ID"
echo "     statut    : $QUOTE_STATUS (attendu: draft)"
echo "     total     : $QUOTE_TOTAL €"

[ "$QUOTE_STATUS" = "draft" ] || { echo "ERREUR: statut attendu 'draft'" >&2; exit 1; }

# ── 3. Envoi du devis (employé → client) ─────────────────
echo ""
echo "[4/8] Envoi du devis (employé)..."
SEND_RESP=$(curl -sf -X POST "$BASE/quotes/$QUOTE_ID/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN")
SEND_STATUS=$(echo "$SEND_RESP" | jq -r '.status')
echo "     statut : $SEND_STATUS (attendu: sent)"
[ "$SEND_STATUS" = "sent" ] || { echo "ERREUR: statut attendu 'sent'" >&2; exit 1; }

# ── 4. Acceptation (client) ──────────────────────────────
echo ""
echo "[5/8] Acceptation du devis (client)..."
ACCEPT_RESP=$(curl -sf -X POST "$BASE/quotes/$QUOTE_ID/accept" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN")
ACCEPT_STATUS=$(echo "$ACCEPT_RESP" | jq -r '.status')
echo "     statut : $ACCEPT_STATUS (attendu: accepted)"
[ "$ACCEPT_STATUS" = "accepted" ] || { echo "ERREUR: statut attendu 'accepted'" >&2; exit 1; }

# ── 5. Enregistrement de l'acompte (employé) ─────────────
echo ""
echo "[6/8] Enregistrement de l'acompte (employé)..."
DEPOSIT_RESP=$(curl -sf -X POST "$BASE/quotes/$QUOTE_ID/deposit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -d '{"deposit_ref":"VIR-2024-SMOKE-001"}')
DEPOSIT_STATUS=$(echo "$DEPOSIT_RESP" | jq -r '.status')
DEPOSIT_REF=$(echo "$DEPOSIT_RESP" | jq -r '.deposit_ref')
echo "     statut   : $DEPOSIT_STATUS (attendu: acompte_paye)"
echo "     dépôt ref: $DEPOSIT_REF"
[ "$DEPOSIT_STATUS" = "acompte_paye" ] || { echo "ERREUR: statut attendu 'acompte_paye'" >&2; exit 1; }

# ── 6. Conversion en commande (employé) ──────────────────
echo ""
echo "[7/8] Conversion en commande (employé)..."
CONV_RESP=$(curl -sf -X POST "$BASE/quotes/$QUOTE_ID/convert" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN")
ORDER_ID=$(echo "$CONV_RESP" | jq -r '.order_id')
echo "     order_id : $ORDER_ID"
[ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ] || { echo "ERREUR: order_id manquant" >&2; exit 1; }

# Vérifier statut final du devis
FINAL_QUOTE=$(curl -sf "$BASE/quotes/$QUOTE_ID" \
  -H "Authorization: Bearer $EMP_TOKEN")
FINAL_STATUS=$(echo "$FINAL_QUOTE" | jq -r '.status')
echo "     statut devis final : $FINAL_STATUS (attendu: converti_en_commande)"
[ "$FINAL_STATUS" = "converti_en_commande" ] || { echo "ERREUR: statut attendu 'converti_en_commande'" >&2; exit 1; }

# ── 7. Endpoint expiration (admin) ───────────────────────
echo ""
echo "[8/8] Endpoint expiration des devis périmés (employé)..."
EXPIRE_RESP=$(curl -sf -X POST "$BASE/quotes/expire" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EMP_TOKEN")
EXPIRED_COUNT=$(echo "$EXPIRE_RESP" | jq -r '.expired')
echo "     devis expirés : $EXPIRED_COUNT"

# ── Récapitulatif ─────────────────────────────────────────
echo ""
echo "=================================================="
echo "  RÉSULTATS : TOUS LES TESTS ONT RÉUSSI ✓"
echo "=================================================="
echo ""
echo "  Flux complet validé :"
echo "    client  → POST /api/quotes          (brouillon)"
echo "    employé → POST /api/quotes/:id/send  (envoi)"
echo "    client  → POST /api/quotes/:id/accept (acceptation)"
echo "    employé → POST /api/quotes/:id/deposit (acompte)"
echo "    employé → POST /api/quotes/:id/convert (→ commande $ORDER_ID)"
echo "    employé → POST /api/quotes/expire   (cron manuel)"
echo ""
