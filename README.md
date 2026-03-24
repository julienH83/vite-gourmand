# Vite & Gourmand - Application Web de Traiteur Événementiel

Application web complète pour le service de traiteur événementiel **Vite & Gourmand**, basé à Bordeaux.

## Prérequis

- **Docker** et **Docker Compose** installés
- **Git** installé

## Démarrage rapide

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd vite-gourmand

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Lancer l'application
docker compose up --build

# 4. Initialiser les mots de passe et MongoDB (première fois, dans un autre terminal)
docker exec vg_api npm run seed
```

## URLs de l'application

| Service       | URL                          |
|---------------|------------------------------|
| Frontend      | http://localhost:5173         |
| API Backend   | http://localhost:3000/api     |
| Mailhog (emails) | http://localhost:8025      |
| PostgreSQL    | localhost:5432               |
| MongoDB       | localhost:27017              |

## Comptes de test

| Rôle        | Email                    | Mot de passe               |
|-------------|--------------------------|----------------------------|
| Admin       | admin@vitegourmand.fr    | *(voir fichier `.env`)*    |
| Employé     | employe@vitegourmand.fr  | *(voir fichier `.env`)*    |
| Utilisateur | user@vitegourmand.fr     | *(voir fichier `.env`)*    |

> **Note :** Les identifiants de connexion sont définis dans le fichier `.env` (copié depuis `.env.example`). En production, chaque utilisateur dispose de son propre mot de passe sécurisé.

## Stack technique

- **Frontend :** React 18 + Vite + React Router + Chart.js
- **Backend :** Node.js + Express + express-validator
- **BD Relationnelle :** PostgreSQL 16 (données métier)
- **BD NoSQL :** MongoDB 7 (agrégations commandes) + PostgreSQL (scores clients)
- **Auth :** JWT (access token : 24h · refresh token : 7j) + bcrypt 12 rounds
- **Emails :** Nodemailer + Mailhog (dev)
- **Conteneurisation :** Docker + Docker Compose

## Structure du projet

```
vite-gourmand/
├── docker-compose.yml          # Config Docker (dev)
├── docker-compose.prod.yml     # Config Docker (prod)
├── .env.example                # Variables d'environnement
├── smoke-test.ps1              # Script de tests automatisés
├── database/
│   ├── schema.sql              # Schéma PostgreSQL (tables de base)
│   ├── seed.sql                # Données de démonstration
│   ├── quotes_migration.sql    # Migration : module devis (quotes, quote_items, quote_options, quote_status_history)
│   ├── payments_migration.sql  # Migration : colonnes paiement sur orders
│   └── quotes-deposit-request.sql # Migration : traçabilité envoi instructions acompte
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Point d'entrée (Composition Root + DI)
│       ├── config/             # Configuration DB (PostgreSQL + MongoDB)
│       ├── controllers/        # Contrôleurs (logique HTTP)
│       ├── services/           # Services (logique métier)
│       ├── repositories/       # Repositories (accès données)
│       ├── errors/             # Hiérarchie d'erreurs (AppError, NotFoundError, etc.)
│       ├── middleware/         # Auth JWT, gestion d'erreurs
│       ├── routes/             # Factories de routes Express
│       ├── models/             # Modèles Mongoose (MongoDB)
│       ├── scripts/            # Seeds (seedPostgres, seedMongo)
│       └── utils/              # Validateurs, sanitization
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # Routeur principal
│       ├── main.jsx            # Point d'entrée React
│       ├── components/         # Header, Footer, CookieConsent
│       ├── pages/              # Pages publiques + dashboards
│       ├── context/            # AuthContext (JWT + refresh)
│       ├── services/           # Client API (apiService)
│       ├── utils/              # Utilitaires (distance, etc.)
│       └── styles/             # CSS global + thème
├── nginx/                      # Config Nginx (prod)
└── docs/                       # Documentation (technique, charte, manuel, gestion projet)
```

## Fonctionnalités

### Pages publiques
- Accueil avec présentation, engagements et avis clients validés
- Catalogue de menus avec filtres dynamiques (thème, régime, prix, nb personnes)
- Détail de chaque menu avec composition et conditions
- Formulaire de contact avec envoi d'email
- Mentions légales et CGV
- Horaires d'ouverture dans le footer

### Authentification
- Inscription avec validation forte du mot de passe
- Connexion avec JWT (access + refresh tokens)
- Réinitialisation du mot de passe par email

### Espace Utilisateur
- Consultation et suivi de ses commandes
- Modification du profil
- Annulation de commande (si statut "en_attente")
- Notation et avis après commande terminée
- Demande de devis personnalisé (type d'événement, invités, items sur-mesure)
- Suivi du workflow devis (draft → accepté → converti en commande)
- Export et suppression du compte (RGPD)

### Espace Employé
- CRUD menus et plats
- Gestion des commandes avec workflow de statuts (transitions contrôlées)
- Obligation de contact client avant annulation
- Validation/refus des avis clients
- Gestion des horaires
- Gestion des devis : envoi au client, instructions d'acompte (IBAN/BIC), enregistrement du paiement, conversion en commande

### Espace Administrateur
- Toutes les fonctionnalités employé
- Création de comptes employés
- Activation/désactivation de comptes
- Analytics (admin uniquement) :
  - Commandes par menu, chiffre d'affaires, tendances — via MongoDB
  - Classement des clients par score d'activité devis — via PostgreSQL
- CRUD pages légales

### Commande
- Calcul automatique des prix (PricingService)
- Livraison gratuite à Bordeaux, sinon 5€ + 0,59€/km
- Remise 10% si nb_persons >= min_persons + 5
- Email de confirmation automatique
- Workflow 8 statuts : en_attente → acceptee → en_preparation → en_livraison → livree → attente_retour_materiel → terminee / annulee

### Devis personnalisé
- Création multi-items : menus, options (sonorisation, décoration, boissons, personnel…), prestations libres
- Calcul automatique : sous-total par ligne, remise %, acompte 30% du total
- Workflow 7 statuts : draft → sent → accepted → acompte_paye → converti_en_commande / refuse / expire
- Validité configurable (par défaut 14 jours), expiration automatique
- Emails à chaque étape (envoi, acceptation, instructions acompte, confirmation paiement, conversion, refus, expiration)
- Vérification de disponibilité de la date à l'acceptation (pas de doublon)

### Suggestions de menus
- `GET /api/suggestions/menus?event_type=X&guest_count=N` — menus recommandés par fréquence de choix historique
- `GET /api/suggestions/budget?event_type=X&guest_count=N` — estimation budgétaire (Q1/médiane/Q3) basée sur les devis acceptés

## Architecture backend

Le backend suit une architecture en couches avec injection de dépendances :

```
Route Factory → Controller → Service → Repository → PostgreSQL/MongoDB
```

- **Routes** : factories Express recevant le contrôleur par injection
- **Controllers** : gèrent la requête/réponse HTTP
- **Services** : logique métier, transactions, validations
- **Repositories** : requêtes SQL/Mongoose isolées
- **Errors** : hiérarchie `AppError` → `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`
- **Composition Root** : `index.js` instancie et injecte toutes les dépendances

## Tests automatisés

Un script de smoke test vérifie les principaux parcours de l'application :

```powershell
# Lancer les tests (nécessite que les containers soient up)
powershell -ExecutionPolicy Bypass -File ./smoke-test.ps1
```

Le script teste : health, login (3 rôles), menus, création/annulation de commande, vérification du stock, transitions de statut, pages légales, analytics et gardes d'authentification.

## Déploiement en production

```bash
# Modifier .env avec les vrais secrets
docker compose -f docker-compose.prod.yml up --build -d
```

## Emails

En développement, tous les emails sont capturés par **Mailhog** accessible sur http://localhost:8025.

Emails envoyés automatiquement :
- Bienvenue à l'inscription
- Réinitialisation du mot de passe (lien valide 1 heure)
- Confirmation de commande
- Commande terminée (invitation à donner un avis)
- Rappel retour matériel
- Envoi du devis au client (draft → sent)
- Confirmation d'acceptation du devis (client accepte)
- Instructions d'acompte avec coordonnées bancaires (IBAN/BIC)
- Confirmation de réception de l'acompte
- Conversion du devis en commande
- Refus du devis (par le client ou le staff)
- Expiration automatique du devis

## Licence

Projet ECF DWWM - Tous droits réservés.
