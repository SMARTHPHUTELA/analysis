CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE org_status      AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE provider_type   AS ENUM ('openai', 'anthropic', 'gemini', 'azure_openai');
CREATE TYPE request_status  AS ENUM ('success', 'error', 'blocked', 'cached');
CREATE TYPE audit_action    AS ENUM (
  'key_created', 'key_deleted', 'key_rotated',
  'budget_updated', 'org_created', 'org_suspended',
  'credential_added', 'credential_deleted'
);

-- ORGANIZATIONS
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  monthly_budget  NUMERIC(12,6) NOT NULL DEFAULT 0,
  status          org_status NOT NULL DEFAULT 'active',
  alert_email     TEXT,
  slack_webhook   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API KEYS (we store only the hash, never plaintext)
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  key_hash        TEXT NOT NULL UNIQUE,   -- SHA-256 of the plaintext key
  key_prefix      TEXT NOT NULL,          -- first 8 chars for display
  scopes          TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org    ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash   ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;

-- PROVIDER CREDENTIALS (AES-256-GCM encrypted)
CREATE TABLE provider_credentials (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        provider_type NOT NULL,
  label           TEXT NOT NULL DEFAULT 'default',
  encrypted_key   TEXT NOT NULL,
  iv              TEXT NOT NULL,
  auth_tag        TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider, label)
);

CREATE INDEX idx_provider_creds_org ON provider_credentials(organization_id, provider);

-- MODEL PRICING (updated without code changes)
CREATE TABLE model_pricing (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider            provider_type NOT NULL,
  model               TEXT NOT NULL,
  input_cost_per_1k   NUMERIC(10,8) NOT NULL,
  output_cost_per_1k  NUMERIC(10,8) NOT NULL,
  context_window      INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, model)
);

-- USAGE LOGS (append-only, one row per request)
CREATE TABLE usage_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  api_key_id        UUID REFERENCES api_keys(id),
  customer_id       TEXT,
  feature           TEXT NOT NULL,
  provider          provider_type NOT NULL,
  model             TEXT NOT NULL,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  input_cost        NUMERIC(12,8) NOT NULL DEFAULT 0,
  output_cost       NUMERIC(12,8) NOT NULL DEFAULT 0,
  total_cost        NUMERIC(12,8) NOT NULL DEFAULT 0,
  latency_ms        INTEGER,
  cache_hit         BOOLEAN NOT NULL DEFAULT FALSE,
  request_status    request_status NOT NULL DEFAULT 'success',
  http_status       INTEGER,
  error_message     TEXT,
  request_id        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_org_created  ON usage_logs(organization_id, created_at DESC);
CREATE INDEX idx_usage_feature      ON usage_logs(organization_id, feature, created_at DESC);
CREATE INDEX idx_usage_model        ON usage_logs(organization_id, model, created_at DESC);
CREATE INDEX idx_usage_customer     ON usage_logs(organization_id, customer_id, created_at DESC);

-- ORGANIZATION BUDGET SUMMARY
-- Composite PK: (organization_id, month)
-- month is always first-of-month: 2025-06-01
CREATE TABLE organization_budget_summary (
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month             DATE NOT NULL,
  total_cost        NUMERIC(12,6) NOT NULL DEFAULT 0,
  prompt_tokens     BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens      BIGINT NOT NULL DEFAULT 0,
  request_count     INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, month)
);

CREATE INDEX idx_budget_summary_org ON organization_budget_summary(organization_id, month DESC);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  actor_id        UUID,
  actor_type      TEXT NOT NULL DEFAULT 'system',
  action          audit_action NOT NULL,
  target_type     TEXT,
  target_id       UUID,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_org    ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- SEED MODEL PRICING
INSERT INTO model_pricing (provider, model, input_cost_per_1k, output_cost_per_1k, context_window) VALUES
  ('openai',     'gpt-4o',                       0.00250,  0.01000,  128000),
  ('openai',     'gpt-4o-mini',                  0.000150, 0.000600, 128000),
  ('openai',     'gpt-4-turbo',                  0.01000,  0.03000,  128000),
  ('openai',     'gpt-3.5-turbo',                0.000500, 0.001500, 16385),
  ('openai',     'text-embedding-3-small',       0.000020, 0.000000, 8191),
  ('openai',     'text-embedding-3-large',       0.000130, 0.000000, 8191),
  ('anthropic',  'claude-opus-4-6',              0.01500,  0.07500,  200000),
  ('anthropic',  'claude-sonnet-4-6',            0.00300,  0.01500,  200000),
  ('anthropic',  'claude-haiku-4-5-20251001',    0.000800, 0.004000, 200000),
  ('gemini',     'gemini-1.5-pro',               0.001250, 0.005000, 1000000),
  ('gemini',     'gemini-1.5-flash',             0.000075, 0.000300, 1000000),
  ('gemini',     'gemini-2.0-flash',             0.000100, 0.000400, 1000000);

-- AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgs_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_keys_updated_at
  BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_creds_updated_at
  BEFORE UPDATE ON provider_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at();