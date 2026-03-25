-- ============================================================
-- Vite & Gourmand - Schema SQL (PostgreSQL)
-- ECF DWWM - Base relationnelle
-- ============================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TYPES ENUM (idempotent)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'employee', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dish_type') THEN
        CREATE TYPE dish_type AS ENUM ('entree', 'plat', 'dessert');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'en_attente',
            'acceptee',
            'en_preparation',
            'en_livraison',
            'livree',
            'attente_retour_materiel',
            'terminee',
            'annulee'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_method') THEN
        CREATE TYPE contact_method AS ENUM ('phone', 'email');
    END IF;
END$$;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    phone      VARCHAR(20)  NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    address    TEXT NOT NULL,
    country    VARCHAR(100) NOT NULL DEFAULT 'France',

    role   user_role   NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'active',

    password_hash VARCHAR(255) NOT NULL,

    reset_token         VARCHAR(255),
    reset_token_expires TIMESTAMPTZ,

    -- RGPD (important pour tes seeds + justification ECF)
    rgpd_consent      BOOLEAN NOT NULL DEFAULT false,
    rgpd_consent_date TIMESTAMPTZ,
    -- RGPD droit à l'effacement : date d'anonymisation (NC-07)
    -- NULL = compte actif, non NULL = compte anonymisé
    anonymized_at     TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ============================================================
-- TABLE: menus
-- ============================================================
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    theme       VARCHAR(100) NOT NULL,
    diet        VARCHAR(100) NOT NULL DEFAULT 'standard',

    min_persons INT NOT NULL DEFAULT 1 CHECK (min_persons > 0),
    min_price   DECIMAL(10,2) NOT NULL CHECK (min_price >= 0),

    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),

    conditions TEXT,
    image_url  VARCHAR(500),

    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_theme ON menus(theme);
CREATE INDEX IF NOT EXISTS idx_menus_diet  ON menus(diet);
CREATE INDEX IF NOT EXISTS idx_menus_active ON menus(is_active);

-- ============================================================
-- TABLE: dishes
-- ============================================================
CREATE TABLE IF NOT EXISTS dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    type        dish_type NOT NULL,
    allergens   TEXT[],
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dishes_type ON dishes(type);

-- ============================================================
-- TABLE: menu_dishes (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_dishes (
    menu_id UUID NOT NULL REFERENCES menus(id)  ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_id, dish_id)
);

-- ============================================================
-- TABLE: menu_images (galerie d'images par menu)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id  UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    url      VARCHAR(500) NOT NULL,
    position INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_images_menu ON menu_images(menu_id);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,

    nb_persons INT NOT NULL CHECK (nb_persons > 0),

    delivery_address TEXT NOT NULL,
    delivery_city    VARCHAR(255) NOT NULL,
    delivery_date    DATE NOT NULL,
    delivery_time    TIME NOT NULL,

    delivery_distance_km DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (delivery_distance_km >= 0),

    menu_price     DECIMAL(10,2) NOT NULL CHECK (menu_price >= 0),
    delivery_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (delivery_price >= 0),
    discount       DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total_price    DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),

    pret_materiel       BOOLEAN NOT NULL DEFAULT false,
    restitution_materiel BOOLEAN NOT NULL DEFAULT false,

    status order_status NOT NULL DEFAULT 'en_attente',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_menu   ON orders(menu_id);
CREATE INDEX IF NOT EXISTS idx_orders_date   ON orders(delivery_date);

-- ============================================================
-- TABLE: order_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status   order_status NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osh_order ON order_status_history(order_id);

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
    menu_id  UUID NOT NULL REFERENCES menus(id)  ON DELETE RESTRICT,

    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,

    status review_status NOT NULL DEFAULT 'pending',
    validated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_menu   ON reviews(menu_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============================================================
-- TABLE: business_hours
-- ============================================================
CREATE TABLE IF NOT EXISTS business_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(day_of_week)
);

-- ============================================================
-- TABLE: legal_pages
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_pages (
    id SERIAL PRIMARY KEY,
    type  VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    -- NC-15 : traçabilité traitement des messages (qui a lu + quand)
    read_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    read_at  TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);

-- ============================================================
-- TABLE: contact_replies
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_replies_message_id ON contact_replies(message_id);

-- ============================================================
-- TABLE: employee_contact_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_contact_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    contact_method contact_method NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_contact_logs_order ON employee_contact_logs(order_id);

-- ============================================================
-- Trigger pour updated_at automatique (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_users_updated_at') THEN
        CREATE TRIGGER tr_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_menus_updated_at') THEN
        CREATE TRIGGER tr_menus_updated_at
            BEFORE UPDATE ON menus
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_dishes_updated_at') THEN
        CREATE TRIGGER tr_dishes_updated_at
            BEFORE UPDATE ON dishes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_orders_updated_at') THEN
        CREATE TRIGGER tr_orders_updated_at
            BEFORE UPDATE ON orders
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_reviews_updated_at') THEN
        CREATE TRIGGER tr_reviews_updated_at
            BEFORE UPDATE ON reviews
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END$$;
