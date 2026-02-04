-- ============================================================
-- Vite & Gourmand - Seed Data (Traiteur événementiel)
-- ============================================================

SET client_encoding = 'UTF8';

TRUNCATE TABLE
  employee_contact_logs,
  menu_images,
  menu_dishes,
  order_status_history,
  reviews,
  orders,
  menus,
  dishes,
  legal_pages,
  business_hours,
  contact_messages,
  users
RESTART IDENTITY CASCADE;

-- ============================================================
-- USERS (dev)
-- Mot de passe pour les 3 comptes: Admin123!@#
-- Hash bcrypt (10 rounds) : $2b$10$HGo7SODWBEQUcbuM1sjdvehPOy5dexZjfLkbkhG3kdqza4NMhx.E.
-- ============================================================
INSERT INTO users (id, first_name, last_name, phone, email, address, country, role, password_hash, status, rgpd_consent, rgpd_consent_date) VALUES
('a0000000-0000-0000-0000-000000000001', 'José',   'Durand',  '0600000001', 'admin@vitegourmand.fr',   '10 Place de la Bourse, 33000 Bordeaux',          'France', 'admin',    '$2b$10$HGo7SODWBEQUcbuM1sjdvehPOy5dexZjfLkbkhG3kdqza4NMhx.E.', 'active', true, '2024-01-01 10:00:00+01'),
('a0000000-0000-0000-0000-000000000002', 'Julie',  'Morel',   '0600000002', 'employe@vitegourmand.fr', '5 Rue Sainte-Catherine, 33000 Bordeaux',          'France', 'employee', '$2b$10$HGo7SODWBEQUcbuM1sjdvehPOy5dexZjfLkbkhG3kdqza4NMhx.E.', 'active', true, '2024-01-15 10:00:00+01'),
('a0000000-0000-0000-0000-000000000003', 'Camille','Bernard', '0600000003', 'user@vitegourmand.fr',    '15 Cours de l''Intendance, 33000 Bordeaux',        'France', 'user',     '$2b$10$HGo7SODWBEQUcbuM1sjdvehPOy5dexZjfLkbkhG3kdqza4NMhx.E.', 'active', true, '2024-02-01 10:00:00+01');

-- ============================================================
-- BUSINESS HOURS
-- ============================================================
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, '10:00', '14:00', false),
(1, '09:00', '18:00', false),
(2, '09:00', '18:00', false),
(3, '09:00', '18:00', false),
(4, '09:00', '18:00', false),
(5, '09:00', '19:00', false),
(6, '10:00', '19:00', false);

-- ============================================================
-- LEGAL PAGES
-- ============================================================
INSERT INTO legal_pages (type, title, content) VALUES
('mentions_legales', 'Mentions légales', 'Mentions légales - Contenu de démonstration.'),
('cgv', 'Conditions Générales de Vente', '# Conditions Générales de Vente

## 1. Objet
Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent l''ensemble des relations commerciales entre **Vite & Gourmand**, traiteur événementiel, et toute personne physique ou morale (ci-après « le Client ») passant commande ou demandant un devis via le site vitegourmand.fr.

Toute commande ou acceptation de devis implique l''adhésion pleine et entière du Client aux présentes CGV.

## 2. Prestations proposées
Vite & Gourmand propose des services de traiteur pour événements privés et professionnels :

- Mariages, anniversaires, baptêmes
- Séminaires et réunions d''entreprise
- Cocktails, galas et réceptions
- Tout autre événement sur mesure

Les prestations comprennent la préparation des repas, la livraison, la mise en place et la récupération du matériel, selon les modalités convenues.

## 3. Commandes et devis

### 3.1. Commande directe
Le Client peut passer commande directement en ligne en sélectionnant un menu, un nombre de convives (10 à 500 personnes), une date, un lieu et un créneau de livraison. La commande est validée après versement de l''acompte.

### 3.2. Demande de devis
Pour les événements sur mesure, le Client peut effectuer une demande de devis en ligne en précisant le type d''événement, le nombre de convives, la date, le lieu, les préférences alimentaires et les options souhaitées.

Le devis est établi gratuitement et transmis par email avec le détail des prestations, les tarifs et les conditions. Le devis est valable **14 jours** à compter de son envoi. Passé ce délai, il est automatiquement expiré.

L''acceptation du devis par le Client vaut engagement ferme, sous réserve du versement de l''acompte.

## 4. Tarifs
Les prix sont exprimés en euros TTC. Ils comprennent la préparation, la livraison dans Bordeaux et la mise en place.

- **Livraison dans Bordeaux** : gratuite
- **Livraison hors Bordeaux (Gironde et Sud-Ouest)** : supplément calculé en fonction de la distance (5 € + 0,59 € par kilomètre)
- **Remise groupe** : une réduction de 10 % est automatiquement appliquée à partir d''un certain nombre de convives

Les tarifs peuvent être modifiés à tout moment. Les prix applicables sont ceux en vigueur au moment de la validation de la commande ou de l''acceptation du devis.

## 5. Acompte et paiement

### 5.1. Acompte
Un acompte de **30 % du montant total** est exigé pour confirmer toute commande ou devis accepté. Cet acompte est à régler par **virement bancaire** aux coordonnées communiquées par email.

La commande n''est considérée comme confirmée qu''à réception effective de l''acompte sur notre compte bancaire.

### 5.2. Solde
Le solde restant (70 %) est dû au plus tard le jour de la prestation, sauf accord contraire mentionné dans le devis.

### 5.3. Moyens de paiement
Le paiement s''effectue exclusivement par **virement bancaire**. Les coordonnées bancaires (IBAN, BIC) sont communiquées par email après validation de la commande ou acceptation du devis.

## 6. Annulation et remboursement

### 6.1. Annulation par le Client
Le Client peut annuler sa commande dans les conditions suivantes :

- **Avant versement de l''acompte** (statut « Acompte en attente ») : annulation gratuite, sans frais
- **Après versement de l''acompte** (statut « Confirmée ») : l''acompte de 30 % est conservé à titre d''indemnité forfaitaire
- **Après acceptation par notre équipe** (statut « Acceptée ») : aucune annulation possible, le montant total reste dû

### 6.2. Annulation par Vite & Gourmand
En cas de force majeure (intempéries exceptionnelles, pandémie, interdiction administrative) rendant la prestation impossible, Vite & Gourmand procédera au remboursement intégral des sommes versées, sans indemnité supplémentaire.

## 7. Livraison et déroulement de la prestation

### 7.1. Livraison
La livraison est effectuée à l''adresse indiquée par le Client lors de la commande, à la date et au créneau horaire convenus. Le Client s''engage à être présent ou à désigner un représentant pour réceptionner la livraison.

### 7.2. Matériel
Certaines prestations incluent la mise à disposition de matériel (vaisselle, équipements de service). Le Client s''engage à restituer le matériel dans l''état dans lequel il lui a été remis.

Dès que la commande passe au statut « Attente de retour de matériel », le Client est notifié par email. **Le matériel doit être restitué dans un délai de 10 jours ouvrés.** Pour organiser la restitution, le Client doit prendre contact avec Vite & Gourmand par email ou par téléphone.

**En cas de non-restitution du matériel dans le délai de 10 jours ouvrés, des frais forfaitaires de 600 € seront facturés au Client.** Tout matériel restitué cassé, détérioré ou incomplet pourra également faire l''objet d''une facturation complémentaire.

### 7.3. Vérification
Le Client est invité à vérifier la conformité de la livraison dès réception et à signaler toute anomalie dans les 24 heures suivant la prestation à contact@vitegourmand.fr.

## 8. Allergies et restrictions alimentaires
Vite & Gourmand propose des menus adaptés (végétarien, végan, sans gluten, halal). Le Client est tenu de signaler toute allergie ou restriction alimentaire lors de la commande ou de la demande de devis.

Malgré toutes les précautions prises, Vite & Gourmand ne peut garantir l''absence totale de traces d''allergènes dans ses préparations. La responsabilité de Vite & Gourmand ne saurait être engagée en cas de réaction allergique non signalée préalablement.

## 9. Avis clients
Après réalisation de la prestation (commande au statut « Terminée »), le Client peut laisser un avis (note de 1 à 5 et commentaire facultatif). Les avis sont soumis à modération par notre équipe avant publication sur le site.

Vite & Gourmand se réserve le droit de refuser la publication d''avis injurieux, diffamatoires ou sans rapport avec la prestation.

## 10. Responsabilité
Vite & Gourmand s''engage à exécuter les prestations avec le plus grand soin et dans le respect des normes d''hygiène et de sécurité alimentaire.

La responsabilité de Vite & Gourmand est limitée au montant de la commande concernée. En aucun cas, Vite & Gourmand ne pourra être tenu responsable de dommages indirects (perte de chance, préjudice moral, trouble de jouissance).

## 11. Propriété intellectuelle
L''ensemble des contenus du site vitegourmand.fr (textes, photographies, logos, charte graphique) est la propriété exclusive de Vite & Gourmand. Toute reproduction ou utilisation sans autorisation écrite est interdite.

## 12. Protection des données personnelles
Les données personnelles collectées dans le cadre des commandes et devis sont traitées conformément à notre Politique de confidentialité, accessible sur le site. Le Client dispose de droits d''accès, de rectification et de suppression de ses données conformément au RGPD.

## 13. Droit applicable et litiges
Les présentes CGV sont soumises au droit français.

En cas de litige relatif à l''exécution des présentes, les parties s''efforceront de trouver une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents de Bordeaux (Gironde), sauf disposition légale impérative contraire.

## 14. Contact
Pour toute question relative aux présentes CGV :

- **Email** : contact@vitegourmand.fr
- **Téléphone** : 05 56 00 00 00
- **Adresse** : 10 Place de la Bourse, 33000 Bordeaux
- **Horaires** : Lundi au vendredi, 9h - 18h'),
('confidentialite', 'Politique de confidentialité', '# Politique de confidentialité

**Dernière mise à jour : mars 2026**

Vite & Gourmand s''engage à protéger la vie privée de ses utilisateurs. La présente politique de confidentialité décrit les données personnelles que nous collectons, comment nous les utilisons et les droits dont vous disposez, conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés.

## 1. Responsable du traitement
**Vite & Gourmand** — Traiteur événementiel
Adresse : 10 Place de la Bourse, 33000 Bordeaux
Email : contact@vitegourmand.fr
Téléphone : 05 56 00 00 00

## 2. Données personnelles collectées

### 2.1. Lors de la création de compte
- Prénom et nom
- Adresse email
- Numéro de téléphone
- Adresse postale
- Mot de passe (stocké sous forme chiffrée, jamais en clair)
- Consentement RGPD (date et heure de l''acceptation)

### 2.2. Lors d''une commande
- Menu sélectionné et nombre de convives
- Adresse et ville de livraison
- Date et créneau de livraison
- Distance de livraison (calculée automatiquement)
- Montant de la commande et de l''acompte

### 2.3. Lors d''une demande de devis
- Type d''événement (mariage, anniversaire, séminaire, cocktail, gala, autre)
- Nombre de convives
- Date, heure et lieu de l''événement
- Préférences alimentaires et allergies éventuelles
- Message complémentaire
- Menus et options sélectionnés

### 2.4. Lors de l''utilisation du formulaire de contact
- Objet du message
- Adresse email
- Contenu du message

### 2.5. Données techniques
- Adresse IP et informations de connexion (à des fins de sécurité uniquement)
- Jetons d''authentification (JWT) stockés côté navigateur pour maintenir votre session

## 3. Finalités du traitement
Vos données personnelles sont utilisées pour les finalités suivantes :

- **Gestion de votre compte** : création, authentification, modification et suppression de votre espace client
- **Traitement des commandes** : prise en charge, suivi, livraison, facturation
- **Traitement des devis** : établissement, envoi, suivi, relance en cas d''expiration
- **Communication transactionnelle** : emails de confirmation, de suivi de commande, d''instructions de paiement, de rappel
- **Gestion des avis** : modération et publication des avis clients après prestation
- **Réponse à vos demandes** : traitement des messages envoyés via le formulaire de contact
- **Sécurité** : prévention des accès non autorisés, détection des fraudes
- **Obligations légales** : conservation des données de facturation conformément au Code de commerce

## 4. Base légale du traitement
Chaque traitement repose sur une base légale spécifique :

- **Exécution du contrat** (art. 6.1.b RGPD) : traitement des commandes, devis, livraisons, gestion du compte client
- **Consentement** (art. 6.1.a RGPD) : collecte des données lors de l''inscription (case RGPD cochée obligatoirement)
- **Obligation légale** (art. 6.1.c RGPD) : conservation des données de facturation pendant 10 ans (art. L.123-22 du Code de commerce)
- **Intérêt légitime** (art. 6.1.f RGPD) : sécurité du site, prévention des fraudes, amélioration du service

## 5. Durée de conservation des données

- **Compte client actif** : vos données sont conservées pendant toute la durée de votre relation avec Vite & Gourmand
- **Compte inactif** : si aucune activité n''est constatée pendant 3 ans, nous vous contactons pour savoir si vous souhaitez conserver votre compte
- **Données de facturation** : conservées 10 ans conformément aux obligations comptables légales
- **Compte supprimé** : vos données personnelles sont anonymisées immédiatement. Les données de commandes sont conservées sous forme anonymisée pour nos obligations légales
- **Formulaire de contact** : les messages sont conservés 2 ans à compter de la réception
- **Données techniques (logs)** : conservées 12 mois maximum

## 6. Destinataires des données
Vos données sont accessibles uniquement :

- Au personnel habilité de Vite & Gourmand (employés et administrateurs)
- À nos sous-traitants techniques, strictement nécessaires au fonctionnement du service :
  - **Hébergeur** : pour le stockage sécurisé des données
  - **Service d''envoi d''emails** : pour les communications transactionnelles

Chaque sous-traitant est lié par un contrat conforme à l''article 28 du RGPD.

**Aucune donnée n''est cédée, vendue ou louée à des tiers à des fins commerciales ou publicitaires.**

## 7. Transferts de données hors UE
En principe, vos données sont hébergées et traitées au sein de l''Union européenne. Si un transfert hors UE devait être nécessaire, il serait encadré par les garanties prévues par le RGPD (clauses contractuelles types ou décision d''adéquation).

## 8. Sécurité des données
Nous mettons en oeuvre des mesures techniques et organisationnelles adaptées :

- **Chiffrement des mots de passe** : hachage bcrypt (jamais stockés en clair)
- **Authentification sécurisée** : jetons JWT avec expiration courte (15 minutes) et renouvellement automatique
- **Mot de passe robuste obligatoire** : minimum 10 caractères, majuscule, minuscule, chiffre et caractère spécial
- **Contrôle des accès** : système de rôles (client, employé, administrateur) limitant l''accès selon les fonctions
- **Communication chiffrée** : HTTPS sur l''ensemble du site
- **Journalisation** : logs de sécurité pour détecter les accès anormaux

## 9. Cookies et technologies similaires
Notre site utilise uniquement des **cookies strictement nécessaires** à son fonctionnement :

- **Jetons d''authentification (JWT)** : maintien de votre session de connexion
- **Préférences de session** : mémorisation de votre progression dans un formulaire

**Aucun cookie publicitaire, de tracking ou de mesure d''audience n''est déposé.**

Aucun consentement n''est requis pour ces cookies, conformément aux recommandations de la CNIL.

## 10. Vos droits (RGPD)
Conformément aux articles 15 à 22 du Règlement (UE) 2016/679, vous disposez des droits suivants :

- **Droit d''accès** (art. 15) : obtenir confirmation que vos données sont traitées et en recevoir une copie
- **Droit de rectification** (art. 16) : corriger vos données inexactes ou incomplètes
- **Droit à l''effacement** (art. 17) : demander la suppression de vos données. Votre compte sera anonymisé
- **Droit à la limitation** (art. 18) : suspendre temporairement un traitement
- **Droit à la portabilité** (art. 20) : recevoir vos données dans un format structuré et lisible
- **Droit d''opposition** (art. 21) : vous opposer à un traitement fondé sur l''intérêt légitime
- **Droit de retirer votre consentement** : à tout moment, sans affecter la licéité du traitement antérieur

### Comment exercer vos droits ?
- **Depuis votre espace client** : modification de vos informations et demande de suppression
- **Par email** : contact@vitegourmand.fr — réponse sous 30 jours maximum
- **Par courrier** : Vite & Gourmand — 10 Place de la Bourse, 33000 Bordeaux

## 11. Protection des mineurs
Le site vitegourmand.fr n''est pas destiné aux mineurs de moins de 16 ans. Nous ne collectons pas sciemment de données de mineurs.

## 12. Modification de la politique
Nous nous réservons le droit de modifier cette politique à tout moment. La date de mise à jour est indiquée en haut de page. En cas de modification substantielle, les utilisateurs seront informés par email.

## 13. Réclamation auprès de la CNIL
Si vous estimez que le traitement de vos données n''est pas conforme, vous pouvez introduire une réclamation auprès de la CNIL :

- **En ligne** : www.cnil.fr
- **Par courrier** : CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07

## 14. Contact
Pour toute question relative à la protection de vos données :

- **Email** : contact@vitegourmand.fr
- **Téléphone** : 05 56 00 00 00
- **Adresse** : 10 Place de la Bourse, 33000 Bordeaux');

-- ============================================================
-- DISHES (~40 plats de traiteur réalistes)
-- Chaque plat peut être partagé entre plusieurs menus.
-- ============================================================

-- ── ENTRÉES ─────────────────────────────────────────────────
INSERT INTO dishes (id, name, description, type, allergens) VALUES
('b0000000-0000-0000-0000-000000000101', 'Verrines avocat-crevettes',            'Verrine fraîche à l''avocat, crevettes décortiquées, citron vert et coriandre.',      'entree', ARRAY['crustaces']),
('b0000000-0000-0000-0000-000000000102', 'Foie gras mi-cuit & chutney de figues','Foie gras de canard mi-cuit, chutney maison et toasts briochés.',                     'entree', ARRAY['gluten']),
('b0000000-0000-0000-0000-000000000103', 'Tartare de tomates & basilic',          'Tartare de tomates anciennes, basilic frais, huile d''olive vierge extra. 100% vegan.','entree', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000104', 'Carpaccio de Saint-Jacques',            'Noix de Saint-Jacques crues marinées au citron vert et baies roses.',                 'entree', ARRAY['mollusques']),
('b0000000-0000-0000-0000-000000000105', 'Velouté de butternut au lait de coco',  'Velouté onctueux de courge butternut, lait de coco et graines torréfiées. Vegan.',    'entree', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000106', 'Tartare de saumon aux agrumes',         'Saumon frais en tartare, vinaigrette aux agrumes et aneth.',                           'entree', ARRAY['poisson']),
('b0000000-0000-0000-0000-000000000107', 'Bruschetta tomates confites & burrata', 'Pain grillé garni de tomates confites, burrata crémeuse et basilic.',                 'entree', ARRAY['gluten','lait']),
('b0000000-0000-0000-0000-000000000108', 'Salade de chèvre chaud & noix',         'Mesclun, toast de chèvre chaud, noix caramélisées et vinaigrette au miel.',           'entree', ARRAY['lait','fruits_a_coque']),
('b0000000-0000-0000-0000-000000000109', 'Gaspacho andalou glacé',                'Gaspacho de tomates et poivrons rouges, servi glacé avec croûtons. Vegan.',           'entree', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000110', 'Blinis au crabe & citron',              'Blinis moelleux garnis de crabe effiloché et zeste de citron.',                       'entree', ARRAY['gluten','crustaces']),
('b0000000-0000-0000-0000-000000000111', 'Verrine mousse de betterave',           'Mousse légère de betterave, crème de raifort et graines germées. Vegan.',             'entree', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000112', 'Terrine de campagne & cornichons',      'Terrine de porc fermier, cornichons et pain de campagne toasté.',                     'entree', ARRAY['gluten']),
('b0000000-0000-0000-0000-000000000113', 'Œuf cocotte aux cèpes',                 'Œuf cocotte crémeux aux cèpes et persil plat.',                                      'entree', ARRAY['oeufs','lait']),
('b0000000-0000-0000-0000-000000000114', 'Houmous maison & crudités',             'Houmous de pois chiches, bâtonnets de légumes croquants et pain pita. Vegan.',       'entree', ARRAY['sesame']);

-- ── PLATS ───────────────────────────────────────────────────
INSERT INTO dishes (id, name, description, type, allergens) VALUES
('b0000000-0000-0000-0000-000000000201', 'Suprême de volaille sauce forestière',  'Suprême de poulet fermier, sauce aux champignons des bois et légumes de saison.',    'plat', ARRAY['lait']),
('b0000000-0000-0000-0000-000000000202', 'Pavé de saumon sauce citronnée',        'Pavé de saumon Label Rouge, sauce beurre citronné et riz basmati.',                  'plat', ARRAY['poisson','lait']),
('b0000000-0000-0000-0000-000000000203', 'Filet de bœuf sauce au poivre',         'Filet de bœuf Angus grillé, sauce au poivre et gratin dauphinois.',                  'plat', ARRAY['lait']),
('b0000000-0000-0000-0000-000000000204', 'Magret de canard rôti au miel & thym',  'Magret de canard rôti, miel de lavande, thym frais et légumes racines.',             'plat', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000205', 'Risotto crémeux aux champignons',       'Risotto arborio aux champignons de saison et parmesan affiné. Végétarien.',          'plat', ARRAY['lait']),
('b0000000-0000-0000-0000-000000000206', 'Lotte rôtie au beurre blanc',           'Queue de lotte rôtie, beurre blanc à l''estragon et légumes primeurs.',               'plat', ARRAY['poisson','lait']),
('b0000000-0000-0000-0000-000000000207', 'Suprême de pintade aux morilles',       'Pintade fermière, sauce crémée aux morilles et purée truffée.',                      'plat', ARRAY['lait']),
('b0000000-0000-0000-0000-000000000208', 'Curry de légumes & lait de coco',       'Curry doux de légumes de saison, lait de coco et riz parfumé au jasmin. Vegan.',     'plat', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000209', 'Médaillons de veau aux girolles',       'Médaillons de veau, poêlée de girolles et écrasé de pommes de terre.',               'plat', ARRAY['lait']),
('b0000000-0000-0000-0000-000000000210', 'Dos de cabillaud en croûte d''herbes',   'Cabillaud en croûte de persil et chapelure dorée, légumes grillés.',                 'plat', ARRAY['poisson','gluten']),
('b0000000-0000-0000-0000-000000000211', 'Tajine de légumes & pois chiches',      'Tajine parfumé aux épices douces, légumes confits et pois chiches. Vegan.',          'plat', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000212', 'Ratatouille niçoise & polenta grillée', 'Ratatouille provençale, polenta croustillante et huile de basilic. Vegan.',          'plat', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000213', 'Tournedos Rossini',                     'Tournedos de bœuf, escalope de foie gras poêlée, sauce périgourdine.',               'plat', ARRAY['gluten','lait']),
('b0000000-0000-0000-0000-000000000214', 'Lasagnes aux légumes grillés',          'Lasagnes maison aux légumes grillés, béchamel légère et parmesan.',                  'plat', ARRAY['gluten','lait','oeufs']);

-- ── DESSERTS ────────────────────────────────────────────────
INSERT INTO dishes (id, name, description, type, allergens) VALUES
('b0000000-0000-0000-0000-000000000301', 'Assortiment de mini-pâtisseries',       'Sélection de mignardises sucrées : éclairs, tartelettes, macarons.',                 'dessert', ARRAY['gluten','oeufs','lait']),
('b0000000-0000-0000-0000-000000000302', 'Tiramisu en verrine',                   'Tiramisu crémeux au mascarpone, café et cacao. Servi en verrines individuelles.',     'dessert', ARRAY['gluten','oeufs','lait']),
('b0000000-0000-0000-0000-000000000303', 'Salade de fruits de saison',            'Assortiment de fruits frais de saison, menthe et sirop léger. Vegan.',               'dessert', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000304', 'Fondant au chocolat noir',              'Cœur coulant au chocolat noir 70%, crème anglaise à la vanille.',                    'dessert', ARRAY['gluten','oeufs','lait']),
('b0000000-0000-0000-0000-000000000305', 'Crème brûlée à la vanille',             'Crème brûlée classique à la vanille de Madagascar, caramélisée minute.',             'dessert', ARRAY['oeufs','lait']),
('b0000000-0000-0000-0000-000000000306', 'Tarte tatin aux pommes',                'Tarte tatin caramélisée aux pommes Golden, servie tiède avec crème fraîche.',        'dessert', ARRAY['gluten','oeufs','lait']),
('b0000000-0000-0000-0000-000000000307', 'Panna cotta aux fruits rouges',         'Panna cotta onctueuse, coulis de framboise et fruits rouges frais.',                 'dessert', ARRAY['lait']),
('b0000000-0000-0000-0000-000000000308', 'Mousse au chocolat & éclats de noisettes','Mousse aérienne au chocolat noir, éclats de noisettes torréfiées.',                 'dessert', ARRAY['oeufs','lait','fruits_a_coque']),
('b0000000-0000-0000-0000-000000000309', 'Sorbet artisanal trio de saveurs',      'Trio de sorbets : mangue, framboise et citron vert. 100% vegan.',                    'dessert', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000310', 'Charlotte aux fraises',                 'Charlotte aux fraises fraîches, biscuits cuillère et crème diplomate.',              'dessert', ARRAY['gluten','oeufs','lait']),
('b0000000-0000-0000-0000-000000000311', 'Carpaccio d''ananas & menthe fraîche',   'Fines tranches d''ananas Victoria, menthe fraîche et poivre de Timut. Vegan.',        'dessert', ARRAY[]::TEXT[]),
('b0000000-0000-0000-0000-000000000312', 'Bûche de Noël traditionnelle',          'Bûche roulée au chocolat et crème de marrons, décor festif.',                        'dessert', ARRAY['gluten','oeufs','lait']);

-- ============================================================
-- MENUS (8 prestations traiteur)
-- min_price = prix par personne
-- ============================================================
INSERT INTO menus (id, title, description, theme, diet, min_persons, min_price, stock, conditions, image_url, is_active) VALUES
(
  'c0000000-0000-0000-0000-000000000001',
  'Cocktail dînatoire - Classique',
  'Formule cocktail élégante avec pièces salées, plat au choix et desserts gourmands. Idéale pour vos soirées et réceptions.',
  'Évènement', 'standard', 20, 34.90, 12,
  'Commander 5 jours à l''avance. Prévoir table de service sur place.',
  '/images/menu-cocktail.png', true
),
(
  'c0000000-0000-0000-0000-000000000002',
  'Buffet froid - Entreprise',
  'Buffet complet prêt à servir, idéal pour séminaires et déjeuners professionnels. Produits frais et de saison.',
  'Classique', 'standard', 15, 29.90, 15,
  'Commander 72h à l''avance. Stockage au frais requis sur place.',
  '/images/menu-buffet-froid.png', true
),
(
  'c0000000-0000-0000-0000-000000000003',
  'Menu Mariage - Premium',
  'Notre formule prestige pour votre jour unique. Produits nobles, dressage soigné et service à table inclus.',
  'Évènement', 'standard', 50, 89.00, 4,
  'Commander 3 semaines à l''avance. Rendez-vous logistique obligatoire avec notre chef.',
  '/images/menu-mariage.png', true
),
(
  'c0000000-0000-0000-0000-000000000004',
  'Brunch - Vegan',
  'Brunch complet 100% végétal avec des produits frais, bio et de saison. Aucun produit d''origine animale.',
  'Évènement', 'vegan', 10, 26.90, 10,
  'Commander 4 jours à l''avance.',
  '/images/menu-vegan.png', true
),
(
  'c0000000-0000-0000-0000-000000000005',
  'Menu de Noël',
  'Formule festive pour les fêtes de fin d''année. Produits d''exception et saveurs traditionnelles revisitées.',
  'Noël', 'standard', 8, 59.90, 8,
  'Commander 2 semaines à l''avance. Disponible du 1er au 31 décembre.',
  '/images/table-dressee.jpg', true
),
(
  'c0000000-0000-0000-0000-000000000006',
  'Brunch de Pâques',
  'Brunch gourmand de saison pour célébrer Pâques en famille. Recettes printanières et gourmandises.',
  'Pâques', 'standard', 10, 35.90, 10,
  'Commander 1 semaine à l''avance. Disponible en mars et avril.',
  '/images/chef.jpg', true
),
(
  'c0000000-0000-0000-0000-000000000007',
  'Séminaire & Conférence',
  'Formule pratique et équilibrée pour vos événements professionnels. Service rapide et mise en place incluse.',
  'Séminaire', 'standard', 20, 32.90, 15,
  'Commander 72h à l''avance. Tables et nappes fournies sur demande.',
  '/images/sommelier.jpg', true
),
(
  'c0000000-0000-0000-0000-000000000008',
  'Anniversaire & Réception',
  'Formule festive et conviviale pour vos anniversaires et célébrations. Ambiance garantie, saveurs mémorables.',
  'Anniversaire', 'standard', 15, 44.90, 10,
  'Commander 1 semaine à l''avance. Animation pièce montée en option.',
  '/images/menu-cocktail.png', true
);

-- ============================================================
-- MENU_DISHES (associations menus ↔ plats)
-- Chaque menu propose 3-4 choix par type de plat.
-- Les plats sont réutilisés entre menus (relation N-N).
-- ============================================================

-- ── 1. Cocktail dînatoire - Classique ───────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix)
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000101'), -- Verrines avocat-crevettes
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000107'), -- Bruschetta burrata
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000110'), -- Blinis crabe
-- Plats (3 choix)
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000201'), -- Volaille forestière
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000202'), -- Saumon citronné
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000203'), -- Bœuf poivre
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000301'), -- Mini-pâtisseries
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000302'), -- Tiramisu
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000304'); -- Fondant chocolat

-- ── 2. Buffet froid - Entreprise ────────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix)
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000103'), -- Tartare tomates
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000112'), -- Terrine campagne
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000108'), -- Chèvre chaud
-- Plats (3 choix)
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000201'), -- Volaille forestière
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000202'), -- Saumon citronné
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000214'), -- Lasagnes légumes
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000302'), -- Tiramisu
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000303'), -- Salade de fruits
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000307'); -- Panna cotta

-- ── 3. Menu Mariage - Premium ───────────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix premium)
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000102'), -- Foie gras
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000104'), -- Carpaccio St-Jacques
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000106'), -- Tartare saumon
-- Plats (3 choix premium)
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000203'), -- Bœuf poivre
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000206'), -- Lotte beurre blanc
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000213'), -- Tournedos Rossini
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000304'), -- Fondant chocolat
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000310'), -- Charlotte fraises
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000305'); -- Crème brûlée

-- ── 4. Brunch - Vegan (100% végétal) ────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées vegan (4 choix)
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000103'), -- Tartare tomates
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000105'), -- Velouté butternut coco
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000109'), -- Gaspacho
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000114'), -- Houmous
-- Plats vegan (3 choix)
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000208'), -- Curry légumes coco
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000211'), -- Tajine légumes
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000212'), -- Ratatouille polenta
-- Desserts vegan (3 choix)
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000303'), -- Salade de fruits
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000309'), -- Sorbet trio
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000311'); -- Carpaccio ananas

-- ── 5. Menu de Noël ─────────────────────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix)
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000102'), -- Foie gras
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000105'), -- Velouté butternut
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000104'), -- Carpaccio St-Jacques
-- Plats (3 choix)
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000207'), -- Pintade morilles
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000204'), -- Magret canard
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000203'), -- Bœuf poivre
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000312'), -- Bûche de Noël
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000304'), -- Fondant chocolat
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000308'); -- Mousse chocolat noisettes

-- ── 6. Brunch de Pâques ─────────────────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix)
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000113'), -- Œuf cocotte
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000107'), -- Bruschetta burrata
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000111'), -- Mousse betterave
-- Plats (3 choix)
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000201'), -- Volaille forestière
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000209'), -- Veau girolles
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000205'), -- Risotto champignons
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000308'), -- Mousse chocolat
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000306'), -- Tarte tatin
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000307'); -- Panna cotta

-- ── 7. Séminaire & Conférence ───────────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix)
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000103'), -- Tartare tomates
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000112'), -- Terrine campagne
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000109'), -- Gaspacho
-- Plats (3 choix)
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000201'), -- Volaille forestière
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000210'), -- Cabillaud herbes
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000214'), -- Lasagnes légumes
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000303'), -- Salade de fruits
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000302'), -- Tiramisu
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000305'); -- Crème brûlée

-- ── 8. Anniversaire & Réception ─────────────────────────────
INSERT INTO menu_dishes (menu_id, dish_id) VALUES
-- Entrées (3 choix)
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000101'), -- Verrines crevettes
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000106'), -- Tartare saumon
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000107'), -- Bruschetta burrata
-- Plats (3 choix)
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000204'), -- Magret canard
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000202'), -- Saumon citronné
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000203'), -- Bœuf poivre
-- Desserts (3 choix)
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000301'), -- Mini-pâtisseries
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000310'), -- Charlotte fraises
('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000304'); -- Fondant chocolat

-- ============================================================
-- MENU_IMAGES (galerie : 3 images par menu)
-- Chemins vers /frontend/public/images/
-- ============================================================
INSERT INTO menu_images (menu_id, url, position) VALUES
-- Cocktail dînatoire
('c0000000-0000-0000-0000-000000000001', '/images/menu-cocktail.png',                  0),
('c0000000-0000-0000-0000-000000000001', '/images/Cocktail & apéritif dînatoire.jpg',  1),
('c0000000-0000-0000-0000-000000000001', '/images/table-dressee.jpg',                  2),
-- Buffet entreprise
('c0000000-0000-0000-0000-000000000002', '/images/menu-buffet-froid.png',              0),
('c0000000-0000-0000-0000-000000000002', '/images/Séminaire & entreprise.jpg',         1),
('c0000000-0000-0000-0000-000000000002', '/images/sommelier.jpg',                      2),
-- Mariage premium
('c0000000-0000-0000-0000-000000000003', '/images/menu-mariage.png',                   0),
('c0000000-0000-0000-0000-000000000003', '/images/Mariage.jpg',                        1),
('c0000000-0000-0000-0000-000000000003', '/images/table-dressee.jpg',                  2),
-- Brunch vegan
('c0000000-0000-0000-0000-000000000004', '/images/menu-vegan.png',                     0),
('c0000000-0000-0000-0000-000000000004', '/images/chef.jpg',                           1),
('c0000000-0000-0000-0000-000000000004', '/images/Menus spéciaux.jpg',                 2),
-- Menu de Noël
('c0000000-0000-0000-0000-000000000005', '/images/table-dressee.jpg',                  0),
('c0000000-0000-0000-0000-000000000005', '/images/chef.jpg',                           1),
('c0000000-0000-0000-0000-000000000005', '/images/sommelier.jpg',                      2),
-- Brunch de Pâques
('c0000000-0000-0000-0000-000000000006', '/images/chef.jpg',                           0),
('c0000000-0000-0000-0000-000000000006', '/images/Menus spéciaux.jpg',                 1),
('c0000000-0000-0000-0000-000000000006', '/images/table-dressee.jpg',                  2),
-- Séminaire & Conférence
('c0000000-0000-0000-0000-000000000007', '/images/Séminaire & entreprise.jpg',         0),
('c0000000-0000-0000-0000-000000000007', '/images/sommelier.jpg',                      1),
('c0000000-0000-0000-0000-000000000007', '/images/table-dressee.jpg',                  2),
-- Anniversaire & Réception
('c0000000-0000-0000-0000-000000000008', '/images/Anniversaire & réception.jpg',       0),
('c0000000-0000-0000-0000-000000000008', '/images/Cocktail & apéritif dînatoire.jpg',  1),
('c0000000-0000-0000-0000-000000000008', '/images/table-dressee.jpg',                  2);
