// Transitions de statuts autorisées pour les commandes
const ORDER_TRANSITIONS = {
  deposit_pending:         ['confirmed', 'annulee'],
  confirmed:               ['acceptee', 'annulee'],
  en_attente:              ['acceptee', 'annulee'],
  acceptee:                ['en_preparation', 'annulee'],
  en_preparation:          ['en_livraison', 'annulee'],
  en_livraison:            ['livree'],
  livree:                  ['attente_retour_materiel', 'terminee'],
  attente_retour_materiel: ['terminee'],
  terminee:                [],
  annulee:                 [],
};

// Transitions de statuts autorisées pour les devis
const QUOTE_TRANSITIONS = {
  draft:                ['sent', 'refuse'],
  sent:                 ['accepted', 'refuse', 'expire'],
  accepted:             ['acompte_paye', 'refuse'],
  acompte_paye:         ['converti_en_commande'],
  converti_en_commande: [],
  expire:               [],
  refuse:               [],
};

// Validité par défaut d'un devis (jours)
const QUOTE_VALIDITY_DAYS = 14;

module.exports = {
  ORDER_TRANSITIONS,
  QUOTE_TRANSITIONS,
  QUOTE_VALIDITY_DAYS,
};
