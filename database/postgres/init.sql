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