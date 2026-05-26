import { sql } from "./db";

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      email         VARCHAR(255)  UNIQUE NOT NULL,
      name          VARCHAR(255)  NOT NULL,
      password_hash TEXT          NOT NULL,
      role          VARCHAR(20)   NOT NULL DEFAULT 'user'
                                  CHECK (role IN ('admin', 'user')),
      created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS words (
      id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      word            VARCHAR(500)  NOT NULL,
      translation_es  TEXT          NOT NULL,
      translation_pt  TEXT          NOT NULL,
      pronunciation   VARCHAR(500),
      example_en      TEXT,
      example_es      TEXT,
      example_pt      TEXT,
      category        VARCHAR(50)   DEFAULT 'intermediate',
      part_of_speech  VARCHAR(50),
      created_by      UUID          REFERENCES users(id) ON DELETE SET NULL,
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS playlists (
      id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(255)  NOT NULL,
      description TEXT,
      owner_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS playlist_words (
      playlist_id UUID          REFERENCES playlists(id) ON DELETE CASCADE,
      word_id     UUID          REFERENCES words(id) ON DELETE CASCADE,
      added_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      PRIMARY KEY (playlist_id, word_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS playlist_shares (
      playlist_id   UUID  REFERENCES playlists(id) ON DELETE CASCADE,
      shared_with   UUID  REFERENCES users(id) ON DELETE CASCADE,
      shared_by     UUID  REFERENCES users(id) ON DELETE SET NULL,
      shared_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (playlist_id, shared_with)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS word_reviews (
      id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word_id       UUID          NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      reviewed_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_wr_user ON word_reviews(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wr_word ON word_reviews(word_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_wr_date ON word_reviews(reviewed_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word_id         UUID          NOT NULL REFERENCES words(id) ON DELETE CASCADE,
      mode            VARCHAR(20)   NOT NULL CHECK (mode IN ('translate', 'listen')),
      source_lang     VARCHAR(5),
      is_correct      BOOLEAN       NOT NULL,
      user_answer     TEXT          NOT NULL,
      correct_answer  TEXT          NOT NULL,
      created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_qa_user ON quiz_attempts(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_qa_word ON quiz_attempts(word_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_qa_date ON quiz_attempts(created_at)`;

  // Migrate mode constraint to include 'reverse' (idempotent)
  await sql`
    DO $$
    BEGIN
      ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_mode_check;
      ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_mode_check
        CHECK (mode IN ('translate', 'listen', 'reverse'));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    $$
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS playlist_favorites (
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, playlist_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      ip           TEXT        NOT NULL,
      success      BOOLEAN     NOT NULL,
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_la_ip_time ON login_attempts(ip, attempted_at)`;

  schemaReady = true;
}
