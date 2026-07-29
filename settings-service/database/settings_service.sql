CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS settings_service
AUTHORIZATION edusmart;

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
