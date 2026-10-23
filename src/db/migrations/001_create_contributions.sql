CREATE TABLE IF NOT EXISTS contributions (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  email       VARCHAR(255)   NOT NULL,
  phone       VARCHAR(20)    NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_email ON contributions (email);
CREATE INDEX IF NOT EXISTS idx_contributions_created_at ON contributions (created_at DESC);
