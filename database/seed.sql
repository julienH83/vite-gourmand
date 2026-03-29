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
('mentions_legales', 'Mentions légales', '# Mentions légales

## 1. Éditeur du site

Le site vitegourmand.fr est édité par :

**Vite & Gourmand**
Forme juridique : Société à responsabilité limitée (SARL)
Capital social : 10 000 €
Siège social : 10 Place de la Bourse, 33000 Bordeaux
SIRET : 123 456 789 00012
RCS Bordeaux : 123 456 789
Numéro de TVA intracommunautaire : FR 12 123456789
Directeurs de la publication : Julie et José, co-gérants

Téléphone : 05 56 00 00 00
Email : contact@vitegourmand.fr

## 2. Hébergement

Le site est hébergé par :

**Vercel Inc.**
440 N Barranca Avenue #4133
Covina, CA 91723, États-Unis
Site : vercel.com

**Render Services, Inc.**
525 Brannan Street, Suite 300
San Francisco, CA 94107, États-Unis
Site : render.com

## 3. Activité

Vite & Gourmand exerce une activité de traiteur événementiel. L''entreprise propose des prestations de restauration pour des événements privés et professionnels (mariages, séminaires, anniversaires, cocktails) dans la région bordelaise. L''entreprise est soumise aux réglementations en matière d''hygiène et de sécurité alimentaire (paquet hygiène, règlement CE n° 852/2004).

## 4. Propriété intellectuelle

L''ensemble des éléments composant le site vitegourmand.fr (textes, photographies, illustrations, logos, icônes, structure générale, code source, bases de données) constitue une œuvre protégée par les dispositions du Code de la propriété intellectuelle.

Toute reproduction, représentation, adaptation ou exploitation, totale ou partielle, par quelque procédé que ce soit, sans l''autorisation écrite préalable de Vite & Gourmand, est strictement interdite et constitue un acte de contrefaçon sanctionné par les articles L.335-2 et suivants du Code de la propriété intellectuelle.

## 5. Données personnelles

Les informations recueillies sur ce site font l''objet d''un traitement informatique destiné à la gestion des commandes, des demandes de devis et de la relation client. Le responsable de traitement est Vite & Gourmand.

Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés, vous disposez d''un droit d''accès, de rectification, d''effacement, de limitation, de portabilité et d''opposition sur vos données personnelles.

Pour exercer ces droits ou pour toute question relative à vos données : contact@vitegourmand.fr

Pour en savoir plus, consultez notre Politique de confidentialité.

## 6. Cookies

Le site utilise exclusivement des cookies nécessaires au fonctionnement du service (authentification, maintien de session). Aucun cookie à des fins publicitaires ou de mesure d''audience n''est utilisé. Conformément aux recommandations de la CNIL, ces cookies ne nécessitent pas de consentement préalable.

## 7. Limitation de responsabilité

Vite & Gourmand s''efforce d''assurer l''exactitude et la mise à jour des informations publiées sur son site. Toutefois, elle ne saurait garantir l''exhaustivité ou l''absence d''erreurs. Les photographies et illustrations de menus sont présentées à titre indicatif ; la présentation des plats peut varier selon les saisons et la disponibilité des produits.

Vite & Gourmand décline toute responsabilité en cas d''interruption du site, de survenance de bugs ou d''incompatibilité du site avec le matériel de l''utilisateur.

## 8. Liens hypertextes

Le site peut contenir des liens vers des sites extérieurs. Vite & Gourmand n''exerce aucun contrôle sur le contenu de ces sites tiers et décline toute responsabilité quant à leur contenu ou à l''utilisation qui en est faite.

## 9. Droit applicable

Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux compétents de Bordeaux seront seuls compétents.

## 10. Contact

Pour toute question relative au site :

Vite & Gourmand
10 Place de la Bourse, 33000 Bordeaux
Tél. : 05 56 00 00 00
Email : contact@vitegourmand.fr
Horaires : du lundi au vendredi, 9h – 18h'),
('cgv', 'Conditions Générales de Vente', '# Conditions Générales de Vente

**En vigueur au 1er janvier 2026**

Les présentes Conditions Générales de Vente s''appliquent à l''ensemble des prestations conclues entre la société Vite & Gourmand, traiteur événementiel dont le siège social est situé au 10 Place de la Bourse, 33000 Bordeaux, et ses clients. Toute commande passée sur le site vitegourmand.fr ou suite à l''acceptation d''un devis emporte acceptation sans réserve des présentes conditions.

## Article 1 — Prestations

Vite & Gourmand assure des prestations de traiteur pour événements privés et professionnels : mariages, anniversaires, baptêmes, séminaires, cocktails, galas et tout événement sur mesure. Nos prestations couvrent la préparation culinaire, la livraison, la mise en place sur le lieu de réception et, le cas échéant, la mise à disposition de matériel.

## Article 2 — Commandes et devis

### 2.1 Commande en ligne
Le Client sélectionne un menu, indique le nombre de convives (de 6 à 500 personnes), la date, l''adresse et le créneau de livraison souhaité. La commande ne devient ferme et définitive qu''après versement de l''acompte prévu à l''article 4.

### 2.2 Demande de devis
Pour les prestations sur mesure, le Client remplit une demande de devis en ligne. Le devis est gratuit et transmis par email dans les meilleurs délais. Il reste valable 14 jours calendaires à compter de son envoi. L''acceptation du devis par le Client, accompagnée du versement de l''acompte, vaut engagement ferme des deux parties.

## Article 3 — Tarifs

Tous les prix affichés sur le site sont exprimés en euros, toutes taxes comprises (TTC). Ils comprennent la préparation des repas et la livraison dans Bordeaux intra-muros.

- Livraison hors Bordeaux : forfait de 5 € auquel s''ajoute 0,59 € par kilomètre supplémentaire
- Remise volume : une réduction de 10 % s''applique automatiquement dès lors que le nombre de convives dépasse de 5 personnes le minimum indiqué pour le menu commandé

Les tarifs en vigueur sont ceux affichés au jour de la validation de la commande ou de l''acceptation du devis.

## Article 4 — Acompte et règlement

Un acompte de 30 % du montant total est requis pour confirmer la commande. Cet acompte est payable par virement bancaire ; les coordonnées sont communiquées par email. Le solde de 70 % est exigible au plus tard le jour de la prestation, sauf mention contraire portée au devis.

Aucune commande n''est considérée comme confirmée avant la réception effective de l''acompte.

## Article 5 — Annulation

### 5.1 Par le Client
- Avant le versement de l''acompte : annulation libre et sans frais
- Après versement de l''acompte (commande confirmée) : l''acompte de 30 % reste acquis à Vite & Gourmand à titre d''indemnité forfaitaire
- Après acceptation de la commande par notre équipe : le montant total de la prestation reste dû ; aucune annulation n''est possible

### 5.2 Par Vite & Gourmand
En cas de force majeure rendant la prestation impossible (conditions climatiques exceptionnelles, mesure administrative, pandémie), Vite & Gourmand procède au remboursement intégral des sommes versées, sans qu''aucune indemnité complémentaire ne puisse être réclamée.

## Article 6 — Livraison

La livraison a lieu à l''adresse, à la date et dans le créneau horaire convenus lors de la commande. Le Client, ou son représentant désigné, doit être présent pour réceptionner la livraison. Toute anomalie constatée à la réception doit être signalée par email à contact@vitegourmand.fr dans les 24 heures suivant la livraison.

## Article 7 — Matériel mis à disposition

Lorsque la prestation inclut du matériel (vaisselle, équipements de service), celui-ci est confié au Client sous sa responsabilité. Le Client en assure la garde et s''engage à le restituer en bon état.

Dès que la commande passe au statut « Attente de retour de matériel », un email de notification est adressé au Client. Le matériel doit être restitué sous 10 jours ouvrés. Pour organiser le retour, le Client prend contact avec nous par téléphone ou par email.

**À défaut de restitution dans ce délai, une indemnité forfaitaire de 600 € sera facturée au Client.** Tout matériel rendu cassé, détérioré ou incomplet pourra donner lieu à une facturation complémentaire.

## Article 8 — Allergènes et régimes alimentaires

Nos menus sont disponibles en plusieurs déclinaisons : classique, végétarien, végan, et peuvent être adaptés selon vos besoins. Il appartient au Client de signaler toute allergie ou intolérance alimentaire au moment de la commande ou de la demande de devis.

Malgré le soin apporté à nos préparations, la présence de traces d''allergènes ne peut être totalement exclue. La responsabilité de Vite & Gourmand ne saurait être engagée pour des allergies non portées à notre connaissance.

## Article 9 — Avis clients

À l''issue de la prestation (commande au statut « Terminée »), le Client peut déposer un avis comportant une note de 1 à 5 et un commentaire. Chaque avis est soumis à validation par notre équipe avant publication sur le site. Nous nous réservons le droit de refuser tout avis à caractère injurieux, diffamatoire ou sans lien avec la prestation réalisée.

## Article 10 — Responsabilité

Vite & Gourmand s''engage à réaliser ses prestations dans le respect des normes d''hygiène et de sécurité alimentaire en vigueur. Notre responsabilité contractuelle est limitée au montant de la commande concernée. Elle ne saurait être engagée au titre de dommages indirects tels que perte de chance, préjudice d''image ou trouble de jouissance.

## Article 11 — Propriété intellectuelle

L''ensemble des éléments du site vitegourmand.fr — textes, photographies, illustrations, logos, charte graphique — est la propriété de Vite & Gourmand. Toute reproduction, même partielle, est soumise à autorisation préalable écrite.

## Article 12 — Données personnelles

Les informations recueillies lors des commandes et demandes de devis font l''objet d''un traitement informatique dans le respect du RGPD. Notre Politique de confidentialité, consultable sur le site, détaille les données collectées, leurs finalités, leur durée de conservation ainsi que les droits dont vous disposez.

## Article 13 — Droit applicable — Litiges

Les présentes CGV sont régies par le droit français. En cas de différend, les parties rechercheront en priorité un règlement amiable. À défaut d''accord, le litige sera soumis aux juridictions compétentes de Bordeaux.

## Article 14 — Contact

Vite & Gourmand
10 Place de la Bourse, 33000 Bordeaux
Tél. : 05 56 00 00 00
Email : contact@vitegourmand.fr
Horaires : du lundi au vendredi, 9h – 18h'),
('confidentialite', 'Politique de confidentialité', '# Politique de confidentialité

**Dernière mise à jour : mars 2026**

La société Vite & Gourmand, en sa qualité de responsable de traitement, attache une importance particulière à la protection des données personnelles de ses clients et visiteurs. La présente politique vise à vous informer sur la manière dont nous recueillons et traitons vos données, conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée.

## 1. Identité du responsable de traitement

Vite & Gourmand — Traiteur événementiel
Julie et José, co-gérants
10 Place de la Bourse, 33000 Bordeaux
Tél. : 05 56 00 00 00
Email : contact@vitegourmand.fr
SIRET : 123 456 789 00012

## 2. Données collectées et contexte de collecte

Nous collectons uniquement les données strictement nécessaires à la bonne exécution de nos prestations de traiteur :

### Création de votre compte client
Nom, prénom, adresse email, téléphone, adresse postale et mot de passe (ce dernier est chiffré et n''est jamais stocké ni accessible en clair).

### Passation d''une commande
Menu choisi, nombre de convives, adresse et date de livraison, créneau horaire souhaité, montant facturé.

### Demande de devis ou prise de contact
Objet de la demande, adresse email de réponse et contenu du message.

### Navigation sur le site
Données techniques de connexion (adresse IP, type de navigateur) collectées à des fins de sécurité et de bon fonctionnement du service.

## 3. Pourquoi nous utilisons vos données

- Créer et gérer votre espace client
- Traiter vos commandes et assurer leur suivi jusqu''à la livraison
- Établir et suivre vos demandes de devis
- Vous adresser les emails liés à vos commandes (confirmation, suivi, facturation)
- Modérer et publier les avis déposés après une prestation
- Répondre à vos messages via le formulaire de contact
- Assurer la sécurité de notre plateforme
- Respecter nos obligations comptables et fiscales

## 4. Sur quelle base juridique ?

- **Exécution du contrat** (art. 6.1.b RGPD) : gestion des commandes, devis et livraisons
- **Consentement** (art. 6.1.a RGPD) : acceptation lors de la création de votre compte
- **Obligation légale** (art. 6.1.c RGPD) : conservation des pièces comptables pendant 10 ans (art. L.123-22 du Code de commerce)
- **Intérêt légitime** (art. 6.1.f RGPD) : sécurité du site et prévention de la fraude

## 5. Combien de temps conservons-nous vos données ?

- **Compte actif** : pendant toute la durée de la relation commerciale
- **Compte inactif depuis 3 ans** : nous vous contactons pour confirmer votre souhait de le conserver
- **Données de facturation** : 10 ans (obligation légale)
- **Compte supprimé** : anonymisation immédiate ; seules les données comptables sont conservées sous forme anonyme
- **Messages de contact** : 2 ans
- **Journaux techniques** : 12 mois

## 6. Qui a accès à vos données ?

Seuls les membres habilités de l''équipe Vite & Gourmand (employés, administrateurs) accèdent à vos données, dans la limite de ce qui est nécessaire à leurs fonctions.

Nous faisons appel à des prestataires techniques pour l''hébergement du site et l''envoi des emails transactionnels. Chacun d''eux est lié par un contrat conforme à l''article 28 du RGPD.

Vos données ne sont ni vendues, ni louées, ni cédées à des tiers à des fins publicitaires ou commerciales.

## 7. Transferts hors Union européenne

Vos données sont hébergées et traitées au sein de l''Union européenne. En cas de transfert vers un pays tiers, celui-ci sera encadré par les garanties prévues par le RGPD (clauses contractuelles types, décision d''adéquation).

## 8. Comment protégeons-nous vos données ?

Nous mettons en place des mesures de sécurité adaptées à la sensibilité des données traitées :

- Mots de passe chiffrés (hachage bcrypt)
- Politique de mot de passe robuste (10 caractères minimum, majuscule, minuscule, chiffre, caractère spécial)
- Authentification par jetons à durée de vie limitée
- Gestion des droits d''accès par rôles (client, employé, administrateur)
- Chiffrement des échanges (protocole HTTPS)
- Journalisation des accès pour détecter toute anomalie

## 9. Cookies

Notre site n''utilise que des cookies strictement nécessaires à son fonctionnement : maintien de la session utilisateur et authentification. Aucun cookie publicitaire, analytique ou de suivi n''est déposé. Conformément aux recommandations de la CNIL, ces cookies exemptés de consentement ne font pas l''objet d''un bandeau d''acceptation.

## 10. Vos droits

En application des articles 15 à 22 du RGPD, vous pouvez à tout moment :

- **Accéder** à vos données et en obtenir une copie (art. 15)
- **Rectifier** des informations inexactes ou incomplètes (art. 16)
- **Demander l''effacement** de vos données personnelles (art. 17)
- **Limiter** temporairement un traitement (art. 18)
- **Récupérer** vos données dans un format structuré — portabilité (art. 20)
- **Vous opposer** à un traitement fondé sur notre intérêt légitime (art. 21)
- **Retirer votre consentement** à tout moment, sans remettre en cause les traitements antérieurs

Pour exercer ces droits :
- Depuis votre espace client (rubrique Mon profil)
- Par email à contact@vitegourmand.fr (réponse sous 30 jours)
- Par courrier à Vite & Gourmand, 10 Place de la Bourse, 33000 Bordeaux

## 11. Mineurs

Le site vitegourmand.fr s''adresse à un public majeur. Nous ne collectons pas sciemment de données concernant des mineurs de moins de 16 ans.

## 12. Évolution de la présente politique

Cette politique peut être mise à jour pour tenir compte d''évolutions légales ou techniques. La date de révision figure en haut de page. Toute modification substantielle vous sera notifiée par email.

## 13. Réclamation

Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL :
- En ligne : www.cnil.fr
- Par courrier : CNIL, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07

## 14. Nous contacter

Pour toute question relative à vos données personnelles :
- Email : contact@vitegourmand.fr
- Téléphone : 05 56 00 00 00
- Adresse : 10 Place de la Bourse, 33000 Bordeaux');

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
('b0000000-0000-0000-0000-000000000312', 'Bûche de Noël traditionnelle',          'Bûche roulée au chocolat et crème de marrons, décor festif.',                        'dessert', ARRAY['gluten','oeufs','lait']),
('b0000000-0000-0000-0000-000000000320', 'Pièce montée aux choux',                'Croquembouche traditionnel, choux crème pâtissière vanille, caramel filé et nougatine.', 'dessert', ARRAY['gluten','lait','oeufs']),
('b0000000-0000-0000-0000-000000000321', 'Wedding cake aux fruits rouges',        'Gâteau nuptial à étages, crème mascarpone, coulis de fruits rouges et décor floral comestible.', 'dessert', ARRAY['gluten','lait','oeufs']),
('b0000000-0000-0000-0000-000000000322', 'Duo de mignardises & macarons',         'Assortiment de macarons, mini éclairs, truffes au champagne et petits fours raffinés.', 'dessert', ARRAY['gluten','lait','oeufs','fruits_a_coque']);

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
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000320'), -- Pièce montée
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000321'), -- Wedding cake
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000322'); -- Mignardises & macarons

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
