CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- Schémas PostgreSQL
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS user_service;
CREATE SCHEMA IF NOT EXISTS progress_service;
CREATE SCHEMA IF NOT EXISTS recommendation_service;
CREATE SCHEMA IF NOT EXISTS payment_service;
CREATE SCHEMA IF NOT EXISTS payout_service;
CREATE SCHEMA IF NOT EXISTS settings_service;
CREATE SCHEMA IF NOT EXISTS sponsorship_service;
CREATE SCHEMA IF NOT EXISTS subscription_service;

-- ============================================================
-- AUTH SERVICE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_service.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_service.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS auth_service.user_roles (
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    role_id INT NOT NULL
        REFERENCES auth_service.roles(id)
        ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

INSERT INTO auth_service.roles (name, description)
VALUES
    ('ADMIN', 'Administrateur'),
    ('INSTRUCTOR', 'Formateur'),
    ('STUDENT', 'Étudiant')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_auth_users_email
    ON auth_service.users(email);

CREATE INDEX IF NOT EXISTS idx_auth_user_roles_role_id
    ON auth_service.user_roles(role_id);

-- ============================================================
-- USER SERVICE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_service.student_profiles (
    user_id UUID PRIMARY KEY
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    current_level VARCHAR(30) NOT NULL DEFAULT 'BEGINNER',
    learning_style VARCHAR(30) NOT NULL DEFAULT 'MIXED',
    bio TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_service.learning_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    preferred_format VARCHAR(30) NOT NULL DEFAULT 'MIXED',
    preferred_language VARCHAR(30) NOT NULL DEFAULT 'fr',
    weekly_goal_hours INT NOT NULL DEFAULT 5
        CHECK (weekly_goal_hours >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS user_service.learning_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    target_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_goals_user_id
    ON user_service.learning_goals(user_id);

CREATE INDEX IF NOT EXISTS idx_learning_goals_status
    ON user_service.learning_goals(status);

-- ============================================================
-- PROGRESS SERVICE
-- ============================================================
CREATE TABLE IF NOT EXISTS progress_service.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    course_id VARCHAR(100) NOT NULL,
    course_title VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'STARTED',
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (progress_percentage BETWEEN 0 AND 100),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

-- Compatibilité avec une ancienne version qui utilisait lesson_progress.
DO $$
BEGIN
    IF to_regclass('progress_service.lesson_progress') IS NOT NULL
       AND to_regclass('progress_service.resource_progress') IS NULL THEN
        ALTER TABLE progress_service.lesson_progress
            RENAME TO resource_progress;
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS progress_service.resource_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL
        REFERENCES progress_service.enrollments(id)
        ON DELETE CASCADE,
    module_id VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (progress_percentage BETWEEN 0 AND 100),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (enrollment_id, module_id, resource_id)
);

CREATE TABLE IF NOT EXISTS progress_service.learning_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL
        REFERENCES progress_service.enrollments(id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    course_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    module_title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL
        CHECK (char_length(summary) BETWEEN 10 AND 4000),
    confidence_level INT NOT NULL DEFAULT 3
        CHECK (confidence_level BETWEEN 1 AND 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (enrollment_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_reflections_enrollment
    ON progress_service.learning_reflections(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_learning_reflections_user
    ON progress_service.learning_reflections(user_id);

-- Ajoute les colonnes manquantes lorsqu'une ancienne table existe déjà.
ALTER TABLE progress_service.enrollments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE progress_service.resource_progress
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE progress_service.resource_progress
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS progress_service.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID
        REFERENCES progress_service.enrollments(id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    course_id VARCHAR(100) NOT NULL,
    module_id VARCHAR(100),
    quiz_id VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (score BETWEEN 0 AND 100),
    passing_score NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (passing_score BETWEEN 0 AND 100),
    earned_points NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_points NUMERIC(10,2) NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0
        CHECK (correct_answers >= 0),
    incorrect_answers INT NOT NULL DEFAULT 0
        CHECK (incorrect_answers >= 0),
    total_questions INT NOT NULL DEFAULT 0
        CHECK (total_questions >= 0),
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_number INT NOT NULL DEFAULT 1
        CHECK (attempt_number >= 1),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id
    ON progress_service.enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
    ON progress_service.enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_status
    ON progress_service.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_resource_progress_enrollment_id
    ON progress_service.resource_progress(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_resource_progress_resource_id
    ON progress_service.resource_progress(resource_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id
    ON progress_service.quiz_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_course_id
    ON progress_service.quiz_attempts(course_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id
    ON progress_service.quiz_attempts(quiz_id);

-- ============================================================
-- RECOMMENDATION SERVICE
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendation_service.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    course_id VARCHAR(100),
    resource_id VARCHAR(100),
    recommendation_type VARCHAR(50) NOT NULL DEFAULT 'COURSE',
    reason TEXT NOT NULL,
    recommendation_score NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (recommendation_score BETWEEN 0 AND 100),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_service.recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL
        REFERENCES recommendation_service.recommendations(id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES auth_service.users(id)
        ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (recommendation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id
    ON recommendation_service.recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_recommendations_status
    ON recommendation_service.recommendations(status);

CREATE INDEX IF NOT EXISTS idx_recommendations_score
    ON recommendation_service.recommendations(recommendation_score DESC);

CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id
    ON recommendation_service.recommendation_feedback(user_id);

-- ============================================================
-- Remarque
-- Les schémas payment_service, payout_service, settings_service,
-- sponsorship_service et subscription_service sont créés ici.
-- Leurs tables existantes doivent rester définies dans leurs migrations
-- ou scripts SQL propres afin d'éviter d'inventer une structure différente.
-- ============================================================

-- ============================================================
-- SETTINGS SERVICE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings_service.platform_settings (
    id UUID PRIMARY KEY
        DEFAULT '00000000-0000-0000-0000-000000000001',

    platform_name VARCHAR(100) NOT NULL DEFAULT 'EduSmart',
    logo_url TEXT,
    support_email VARCHAR(255) NOT NULL
        DEFAULT 'support@edusmart.local',

    default_language VARCHAR(10) NOT NULL DEFAULT 'fr',
    supported_languages VARCHAR(10)[] NOT NULL
        DEFAULT ARRAY['fr', 'en'],

    currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Toronto',
    default_theme VARCHAR(20) NOT NULL DEFAULT 'system',

    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    allow_registrations BOOLEAN NOT NULL DEFAULT TRUE,
    certificate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    recommendation_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT platform_settings_singleton
        CHECK (
          id = '00000000-0000-0000-0000-000000000001'
        ),

    CONSTRAINT platform_settings_default_language_check
        CHECK (default_language IN ('fr', 'en')),

    CONSTRAINT platform_settings_currency_check
        CHECK (currency IN ('CAD', 'USD', 'EUR', 'XAF')),

    CONSTRAINT platform_settings_theme_check
        CHECK (default_theme IN ('light', 'dark', 'system'))
);

CREATE TABLE IF NOT EXISTS settings_service.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,

    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,
    updated_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT feature_flags_key_check
        CHECK (key ~ '^[a-z0-9._-]{2,100}$')
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled
ON settings_service.feature_flags(enabled);

INSERT INTO settings_service.platform_settings (
    id,
    platform_name,
    support_email,
    default_language,
    supported_languages,
    currency,
    timezone,
    default_theme,
    maintenance_mode,
    allow_registrations,
    certificate_enabled,
    recommendation_enabled
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'EduSmart',
    'support@edusmart.local',
    'fr',
    ARRAY['fr', 'en'],
    'CAD',
    'America/Toronto',
    'system',
    FALSE,
    TRUE,
    TRUE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings_service.feature_flags (
    key,
    name,
    description,
    enabled
)
VALUES
    (
      'forum.enabled',
      'Forum',
      'Active ou désactive les forums de discussion.',
      TRUE
    ),
    (
      'recommendations.enabled',
      'Recommandations',
      'Active ou désactive les recommandations personnalisées.',
      TRUE
    ),
    (
      'certificates.enabled',
      'Certificats',
      'Active ou désactive la génération des certificats.',
      TRUE
    )
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS settings_service.country_membership_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    country_code VARCHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,

    currency VARCHAR(3) NOT NULL,
    annual_instructor_fee NUMERIC(12, 2) NOT NULL,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,
    updated_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT country_membership_country_code_check
        CHECK (country_code ~ '^[A-Z]{2}$'),

    CONSTRAINT country_membership_currency_check
        CHECK (currency ~ '^[A-Z]{3}$'),

    CONSTRAINT country_membership_fee_check
        CHECK (annual_instructor_fee >= 0)
);

CREATE INDEX IF NOT EXISTS idx_country_membership_enabled
ON settings_service.country_membership_settings(enabled);

INSERT INTO settings_service.country_membership_settings (
    country_code,
    country_name,
    currency,
    annual_instructor_fee,
    enabled
)
VALUES
    ('CA', 'Canada', 'CAD', 120.00, TRUE),
    ('CM', 'Cameroun', 'XAF', 25000.00, TRUE)
ON CONFLICT (country_code) DO NOTHING;

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

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS payment_service;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_type'
          AND typnamespace = 'payment_service'::regnamespace
    ) THEN
        CREATE TYPE payment_service.payment_type AS ENUM (
            'INSTRUCTOR_MEMBERSHIP',
            'COURSE_PURCHASE'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_status'
          AND typnamespace = 'payment_service'::regnamespace
    ) THEN
        CREATE TYPE payment_service.payment_status AS ENUM (
            'PENDING',
            'PROCESSING',
            'SUCCEEDED',
            'FAILED',
            'CANCELLED',
            'REFUNDED',
            'PARTIALLY_REFUNDED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'payment_provider'
          AND typnamespace = 'payment_service'::regnamespace
    ) THEN
        CREATE TYPE payment_service.payment_provider AS ENUM (
            'TEST',
            'STRIPE',
            'PAYPAL',
            'ORANGE_MONEY',
            'MTN_MOMO'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'event_type'
          AND typnamespace = 'payment_service'::regnamespace
    ) THEN
        CREATE TYPE payment_service.event_type AS ENUM (
            'CREATED',
            'PROCESSING',
            'SUCCEEDED',
            'FAILED',
            'CANCELLED',
            'REFUNDED',
            'PARTIALLY_REFUNDED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'refund_status'
          AND typnamespace = 'payment_service'::regnamespace
    ) THEN
        CREATE TYPE payment_service.refund_status AS ENUM (
            'PENDING',
            'SUCCEEDED',
            'FAILED'
        );
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS payment_service.payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code payment_service.payment_provider NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_service.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    payment_type payment_service.payment_type NOT NULL,

    reference_id VARCHAR(100) NOT NULL,

    provider payment_service.payment_provider NOT NULL DEFAULT 'TEST',

    provider_payment_id VARCHAR(255),

    country_code CHAR(2) NOT NULL,

    currency CHAR(3) NOT NULL,

    amount NUMERIC(12,2) NOT NULL,

    refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    status payment_service.payment_status NOT NULL DEFAULT 'PENDING',

    idempotency_key VARCHAR(120),

    failure_code VARCHAR(100),

    failure_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    paid_at TIMESTAMPTZ,

    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT payments_amount_positive_check
        CHECK (amount > 0),

    CONSTRAINT payments_refunded_amount_nonnegative_check
        CHECK (refunded_amount >= 0),

    CONSTRAINT payments_refunded_amount_limit_check
        CHECK (refunded_amount <= amount),

    CONSTRAINT payments_country_code_check
        CHECK (country_code ~ '^[A-Z]{2}$'),

    CONSTRAINT payments_currency_check
        CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_idempotency_key
ON payment_service.payments(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_payments_user_id
ON payment_service.payments(user_id);

CREATE INDEX IF NOT EXISTS ix_payments_reference
ON payment_service.payments(payment_type, reference_id);

CREATE INDEX IF NOT EXISTS ix_payments_status
ON payment_service.payments(status);

CREATE INDEX IF NOT EXISTS ix_payments_created_at
ON payment_service.payments(created_at DESC);

CREATE TABLE IF NOT EXISTS payment_service.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL
        REFERENCES payment_service.payments(id)
        ON DELETE CASCADE,

    event_type payment_service.event_type NOT NULL,

    previous_status payment_service.payment_status,

    new_status payment_service.payment_status,

    message TEXT,

    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_payment_events_payment_id
ON payment_service.payment_events(payment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_service.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL
        REFERENCES payment_service.payments(id),

    requested_by UUID,

    amount NUMERIC(12,2) NOT NULL,

    currency CHAR(3) NOT NULL,

    reason TEXT,

    provider_refund_id VARCHAR(255),

    status payment_service.refund_status NOT NULL DEFAULT 'PENDING',

    failure_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    processed_at TIMESTAMPTZ,

    CONSTRAINT refunds_amount_positive_check
        CHECK (amount > 0),

    CONSTRAINT refunds_currency_check
        CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX IF NOT EXISTS ix_refunds_payment_id
ON payment_service.refunds(payment_id);

CREATE TABLE IF NOT EXISTS payment_service.course_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payment_id UUID NOT NULL UNIQUE
        REFERENCES payment_service.payments(id),

    student_id UUID NOT NULL,

    course_id UUID NOT NULL,

    access_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    granted_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT course_purchase_access_status_check
        CHECK (access_status IN ('PENDING','GRANTED','REVOKED'))
);

CREATE INDEX IF NOT EXISTS ix_course_purchases_student_id
ON payment_service.course_purchases(student_id);

CREATE INDEX IF NOT EXISTS ix_course_purchases_course_id
ON payment_service.course_purchases(course_id);

INSERT INTO payment_service.payment_providers (
    code,
    name,
    enabled
)
VALUES (
    'TEST',
    'Fournisseur de paiement de test',
    TRUE
)
ON CONFLICT (code)
DO UPDATE SET
    enabled = EXCLUDED.enabled,
    name = EXCLUDED.name,
    updated_at = NOW();

CREATE SCHEMA IF NOT EXISTS progress_service;

CREATE TABLE IF NOT EXISTS progress_service.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  module_id VARCHAR(100),
  resource_id VARCHAR(100),

  duration_seconds INTEGER NOT NULL DEFAULT 0
    CHECK (duration_seconds >= 0 AND duration_seconds <= 300),

  session_date DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT learning_sessions_enrollment_fkey
    FOREIGN KEY (enrollment_id)
    REFERENCES progress_service.enrollments(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_learning_sessions_user_date
  ON progress_service.learning_sessions(user_id, session_date);

CREATE INDEX IF NOT EXISTS ix_learning_sessions_enrollment
  ON progress_service.learning_sessions(enrollment_id);

CREATE INDEX IF NOT EXISTS ix_learning_sessions_course
  ON progress_service.learning_sessions(course_id);


CREATE INDEX IF NOT EXISTS ix_learning_sessions_user_date
ON progress_service.learning_sessions(user_id, session_date);

ALTER TABLE auth_service.users
ADD COLUMN IF NOT EXISTS is_active
BOOLEAN NOT NULL DEFAULT TRUE;
