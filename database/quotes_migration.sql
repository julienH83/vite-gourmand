-- ============================================================
-- Vite & Gourmand - Migration : Module Devis (Quotes)
-- À exécuter APRÈS schema.sql
-- ============================================================

-- ============================================================
-- TYPES ENUM (idempotent)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE quote_status AS ENUM (
            'draft',
            'sent',
            'accepted',
            'acompte_paye',
            'converti_en_commande',
            'expire',
            'refuse'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM (
            'mariage',
            'anniversaire',
            'seminaire',
            'cocktail',
            'gala',
            'autre'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_item_type') THEN
        CREATE TYPE quote_item_type AS ENUM (
            'menu',
            'option',
            'prestation'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_item_unit') THEN
        CREATE TYPE quote_item_unit AS ENUM (
            'par_personne',
            'forfait',
            'par_heure'
        );
    END IF;
END$$;

-- ============================================================
-- TABLE: quote_options (catalogue des prestations additionnelles)
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_options (
    id          UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    label       VARCHAR(120)     NOT NULL,
    description TEXT,
    unit_price  NUMERIC(10,2)   NOT NULL CHECK (unit_price >= 0),
    unit        quote_item_unit  NOT NULL DEFAULT 'forfait',
    is_active   BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_options_active ON quote_options(is_active);

-- ============================================================
-- TABLE: quotes (devis principal)
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
    id                 UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID           NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    assigned_to        UUID                      REFERENCES users(id)  ON DELETE SET NULL,
    status             quote_status   NOT NULL DEFAULT 'draft',
    event_type         event_type     NOT NULL,
    event_date         DATE           NOT NULL,
    event_time         TIME,
    event_address      TEXT           NOT NULL,
    event_city         VARCHAR(100)   NOT NULL,
    guest_count        INTEGER        NOT NULL CHECK (guest_count > 0),
    dietary_notes      TEXT,
    client_message     TEXT,
    internal_notes     TEXT,
    subtotal           NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_pct       NUMERIC(5,2)   NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
    discount_amount    NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total              NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (total >= 0),
    deposit_amount     NUMERIC(10,2)  NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
    deposit_paid_at    TIMESTAMPTZ,
    deposit_ref        VARCHAR(100),
    valid_until        DATE,
    converted_order_id UUID                      REFERENCES orders(id) ON DELETE SET NULL,
    sent_at            TIMESTAMPTZ,
    accepted_at        TIMESTAMPTZ,
    refused_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id     ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_assigned_to ON quotes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_quotes_status      ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_event_date  ON quotes(event_date);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);

-- ============================================================
-- TABLE: quote_items (lignes du devis — menus + options)
-- Le champ "unit" est un snapshot au moment de la création.
-- Il ne dépend PAS de quote_options.unit (valeur mutable).
-- Pour les items de type 'menu', unit = 'par_personne' toujours.
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_items (
    id          UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id    UUID             NOT NULL REFERENCES quotes(id)        ON DELETE CASCADE,
    item_type   quote_item_type  NOT NULL,
    menu_id     UUID                        REFERENCES menus(id)       ON DELETE SET NULL,
    option_id   UUID                        REFERENCES quote_options(id) ON DELETE SET NULL,
    label       VARCHAR(200)     NOT NULL,
    unit_price  NUMERIC(10,2)    NOT NULL CHECK (unit_price >= 0),
    unit        quote_item_unit  NOT NULL DEFAULT 'forfait',
    quantity    INTEGER          NOT NULL DEFAULT 1 CHECK (quantity > 0),
    line_total  NUMERIC(10,2)    NOT NULL CHECK (line_total >= 0),
    sort_order  INTEGER          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quote_item_ref CHECK (
        (item_type = 'menu'       AND menu_id   IS NOT NULL AND option_id IS NULL) OR
        (item_type = 'option'     AND option_id IS NOT NULL AND menu_id   IS NULL) OR
        (item_type = 'prestation' AND menu_id   IS NULL     AND option_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- ============================================================
-- TABLE: quote_status_history (miroir de order_status_history)
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_status_history (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id    UUID          NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    status      quote_status  NOT NULL,
    changed_by  UUID                   REFERENCES users(id)  ON DELETE SET NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_sh_quote_id ON quote_status_history(quote_id);

-- ============================================================
-- Triggers updated_at (réutilise la fonction existante update_updated_at)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_quotes_updated_at') THEN
        CREATE TRIGGER tr_quotes_updated_at
            BEFORE UPDATE ON quotes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_quote_options_updated_at') THEN
        CREATE TRIGGER tr_quote_options_updated_at
            BEFORE UPDATE ON quote_options
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END$$;

-- ============================================================
-- Données de démonstration : options catalogue
-- ============================================================

-- ── Services complémentaires généraux (gestion de salle & logistique) ──────
INSERT INTO quote_options (label, description, unit_price, unit) VALUES
    ('Personnel de service', 'Serveurs qualifiés pour votre événement', 25.00, 'par_personne'),
    ('Décoration de table', 'Nappes, centres de table, bougies premium', 150.00, 'forfait'),
    ('Sono & éclairage', 'Système audio et éclairage d''ambiance', 300.00, 'forfait'),
    ('Location de vaisselle', 'Vaisselle haut de gamme par personne', 8.00, 'par_personne'),
    ('Coordination événement', 'Coordinateur dédié sur place', 80.00, 'par_heure')
ON CONFLICT DO NOTHING;

-- ── Formules boissons ────────────────────────────────────────────────────────
INSERT INTO quote_options (label, description, unit_price, unit) VALUES
    (
        'Formule Sans Alcool',
        'Eaux plates & pétillantes illimitées, jus de fruits artisanaux (3 références min.), limonade & sodas maison, thés glacés infusés. Mocktails signature sur option.',
        4.50,
        'par_personne'
    ),
    (
        'Sélection Vins',
        'Vins blancs secs & demi-secs, vins rouges sélection Bordeaux, vins rosés de Provence. Option vins bio & biodynamiques. Accord met-vins conseillé par notre équipe.',
        9.00,
        'par_personne'
    ),
    (
        'Bières & Bulles',
        'Bières artisanales locales (2–3 références), champagne & crémant d''Alsace pour vos toasts, prosecco pour cocktails. Option bière sans alcool incluse.',
        8.00,
        'par_personne'
    ),
    (
        'Open Bar Événementiel',
        'Bar animé par notre équipe, service à table inclus, verres, carafes & matériel fournis. Mise en place et repli assurés. Carte boissons personnalisable.',
        22.00,
        'par_personne'
    )
ON CONFLICT DO NOTHING;

-- ── Services boissons complémentaires ───────────────────────────────────────
INSERT INTO quote_options (label, description, unit_price, unit) VALUES
    (
        'Cave à vin sélectionnée',
        'Accord personnalisé avec vos menus, présélection de bouteilles par notre sommelier partenaire.',
        120.00,
        'forfait'
    ),
    (
        'Bar à cocktails',
        'Cocktails maison préparés sur place par notre barman. Inclut matériel et ingrédients.',
        250.00,
        'forfait'
    ),
    (
        'Verres & matériel boissons',
        'Fourniture des verres adaptés, carafes, glacières et plateau. Nettoyage inclus.',
        3.50,
        'par_personne'
    )
ON CONFLICT DO NOTHING;

-- ── Types de prestations traiteur ───────────────────────────────────────────
INSERT INTO quote_options (label, description, unit_price, unit) VALUES
    (
        'Prestation Mariage',
        'Cocktail de bienvenue & vin d''honneur, buffet gastronomique ou repas assis, menu personnalisé à votre image, coordination le jour J incluse.',
        0.00,
        'forfait'
    ),
    (
        'Prestation Séminaire & entreprise',
        'Petits-déjeuners d''accueil, plateaux repas & déjeuners, cocktails dînatoires. Facturation entreprise possible.',
        0.00,
        'forfait'
    ),
    (
        'Prestation Anniversaire & réception',
        'De 10 à 500 convives, formules buffet ou service à table, gâteaux & pièces montées sur commande, animation culinaire possible.',
        0.00,
        'forfait'
    ),
    (
        'Prestation Cocktail & apéritif dînatoire',
        'Pièces salées & sucrées maison, service en circulation ou en station, verrines, bouchées, tapas raffinés. Adaptation aux régimes alimentaires.',
        0.00,
        'forfait'
    ),
    (
        'Prestation Livraison & logistique',
        'Créneaux de livraison flexibles, mise en place sur place incluse, gestion du matériel et du froid, repli et nettoyage après l''événement.',
        0.00,
        'forfait'
    ),
    (
        'Prestation Menus spéciaux',
        'Menus végétariens & vegan certifiés, sans gluten & allergènes maîtrisés, options halal disponibles, menus enfants personnalisés.',
        0.00,
        'forfait'
    )
ON CONFLICT DO NOTHING;

-- ── Options complémentaires prestations ─────────────────────────────────────
INSERT INTO quote_options (label, description, unit_price, unit) VALUES
    (
        'Location de matériel (tables, chaises, nappes)',
        'Tables rondes ou rectangulaires, chaises et nappes assorties pour tous vos convives.',
        6.00,
        'par_personne'
    ),
    (
        'Personnel de service (serveurs, maître d''hôtel)',
        'Serveurs en tenue et maître d''hôtel pour assurer un service élégant tout au long de l''événement.',
        25.00,
        'par_personne'
    ),
    (
        'Décoration de table & centre de table',
        'Compositions florales, photophores, chevalets de table et nappage haut de gamme.',
        150.00,
        'forfait'
    ),
    (
        'Sonorisation & éclairage ambiance',
        'Système audio discret pour fond musical, éclairage LED d''ambiance personnalisable selon votre thème.',
        300.00,
        'forfait'
    )
ON CONFLICT DO NOTHING;