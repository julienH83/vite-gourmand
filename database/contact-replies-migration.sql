-- Migration: Système de messagerie contact avec conversations
-- Ajouter user_id sur contact_messages + table contact_replies

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);

CREATE TABLE IF NOT EXISTS contact_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_replies_message_id ON contact_replies(message_id);
