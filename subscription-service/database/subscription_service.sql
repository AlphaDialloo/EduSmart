CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS subscription_service;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'subscription_status'
      AND n.nspname = 'subscription_service'
  ) THEN
    CREATE TYPE subscription_service.subscription_status AS ENUM (
      'PENDING',
      'ACTIVE',
      'EXPIRED',
      'PAYMENT_FAILED',
      'CANCELLED',
      'SUSPENDED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS subscription_service.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'YEARLY',
  duration_months INTEGER NOT NULL DEFAULT 12,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subscription_plan_billing_cycle_check
    CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
  CONSTRAINT subscription_plan_duration_check
    CHECK (duration_months > 0)
);

CREATE TABLE IF NOT EXISTS subscription_service.instructor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_service.subscription_plans(id),
  country_code VARCHAR(2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status subscription_service.subscription_status NOT NULL DEFAULT 'PENDING',
  payment_id UUID,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT instructor_subscription_country_check
    CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT instructor_subscription_currency_check
    CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT instructor_subscription_amount_check
    CHECK (amount >= 0),
  CONSTRAINT instructor_subscription_dates_check
    CHECK (
      expires_at IS NULL OR started_at IS NULL OR expires_at > started_at
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_instructor_pending_plan
ON subscription_service.instructor_subscriptions(instructor_id, plan_id)
WHERE status = 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_payment_id
ON subscription_service.instructor_subscriptions(payment_id)
WHERE payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_instructor
ON subscription_service.instructor_subscriptions(instructor_id);

CREATE INDEX IF NOT EXISTS idx_subscription_status_expiry
ON subscription_service.instructor_subscriptions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_subscription_country
ON subscription_service.instructor_subscriptions(country_code);

CREATE TABLE IF NOT EXISTS subscription_service.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL
    REFERENCES subscription_service.instructor_subscriptions(id)
    ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  from_status subscription_service.subscription_status,
  to_status subscription_service.subscription_status,
  actor_type VARCHAR(30) NOT NULL,
  actor_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subscription_history_actor_check
    CHECK (actor_type IN ('INSTRUCTOR', 'ADMIN', 'SERVICE', 'SYSTEM'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription
ON subscription_service.subscription_history(subscription_id, created_at DESC);

INSERT INTO subscription_service.subscription_plans (
  code,
  name,
  description,
  billing_cycle,
  duration_months,
  active
)
VALUES (
  'INSTRUCTOR_ANNUAL',
  'Adhésion annuelle formateur',
  'Autorise un formateur à publier et commercialiser ses cours pendant douze mois.',
  'YEARLY',
  12,
  TRUE
)
ON CONFLICT (code) DO NOTHING;
