const {
  pool
} = require("../config/db");
const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
function mapSettings(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    platformName: row.platform_name,
    logoUrl: row.logo_url,
    supportEmail: row.support_email,
    defaultLanguage: row.default_language,
    supportedLanguages: row.supported_languages,
    currency: row.currency,
    timezone: row.timezone,
    defaultTheme: row.default_theme,
    maintenanceMode: row.maintenance_mode,
    allowRegistrations: row.allow_registrations,
    certificateEnabled: row.certificate_enabled,
    recommendationEnabled: row.recommendation_enabled,
    metadata: row.metadata,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapFeatureFlag(row) {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    configuration: row.configuration,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function ensureDefaultSettings() {
  const query = `
    INSERT INTO settings_service.platform_settings (
      id,
      platform_name,
      logo_url,
      support_email,
      default_language,
      supported_languages,
      currency,
      timezone,
      default_theme,
      maintenance_mode,
      allow_registrations,
      certificate_enabled,
      recommendation_enabled,
      metadata
    )
    VALUES (
      $1,
      'EduSmart',
      NULL,
      'support@edusmart.local',
      'fr',
      ARRAY['fr', 'en'],
      'CAD',
      'America/Toronto',
      'system',
      FALSE,
      TRUE,
      TRUE,
      TRUE,
      '{}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING
  `;
  await pool.query(query, [SETTINGS_ID]);
}
async function getPlatformSettings() {
  const result = await pool.query(`
      SELECT *
      FROM settings_service.platform_settings
      WHERE id = $1
    `, [SETTINGS_ID]);
  return mapSettings(result.rows[0]);
}
async function updatePlatformSettings(payload, updatedBy) {
  const fields = {
    platformName: "platform_name",
    logoUrl: "logo_url",
    supportEmail: "support_email",
    defaultLanguage: "default_language",
    supportedLanguages: "supported_languages",
    currency: "currency",
    timezone: "timezone",
    defaultTheme: "default_theme",
    maintenanceMode: "maintenance_mode",
    allowRegistrations: "allow_registrations",
    certificateEnabled: "certificate_enabled",
    recommendationEnabled: "recommendation_enabled",
    metadata: "metadata"
  };
  const assignments = [];
  const values = [];
  let parameterIndex = 1;
  for (const [property, column] of Object.entries(fields)) {
    if (Object.prototype.hasOwnProperty.call(payload, property)) {
      assignments.push(`${column} = $${parameterIndex}`);
      values.push(payload[property]);
      parameterIndex += 1;
    }
  }
  if (assignments.length === 0) {
    return getPlatformSettings();
  }
  assignments.push(`updated_by = $${parameterIndex}`);
  values.push(updatedBy || null);
  parameterIndex += 1;
  assignments.push("updated_at = CURRENT_TIMESTAMP");
  values.push(SETTINGS_ID);
  const result = await pool.query(`
      UPDATE settings_service.platform_settings
      SET ${assignments.join(", ")}
      WHERE id = $${parameterIndex}
      RETURNING *
    `, values);
  return mapSettings(result.rows[0]);
}
async function listFeatureFlags() {
  const result = await pool.query(`
    SELECT *
    FROM settings_service.feature_flags
    ORDER BY key ASC
  `);
  return result.rows.map(mapFeatureFlag);
}
async function getFeatureFlagByKey(key) {
  const result = await pool.query(`
      SELECT *
      FROM settings_service.feature_flags
      WHERE key = $1
    `, [key]);
  return result.rows[0] ? mapFeatureFlag(result.rows[0]) : null;
}
async function createFeatureFlag(payload, userId) {
  const result = await pool.query(`
      INSERT INTO settings_service.feature_flags (
        key,
        name,
        description,
        enabled,
        configuration,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *
    `, [payload.key, payload.name.trim(), payload.description?.trim() || null, payload.enabled ?? false, payload.configuration || {}, userId || null]);
  return mapFeatureFlag(result.rows[0]);
}
async function updateFeatureFlag(key, payload, userId) {
  const fields = {
    name: "name",
    description: "description",
    enabled: "enabled",
    configuration: "configuration"
  };
  const assignments = [];
  const values = [];
  let parameterIndex = 1;
  for (const [property, column] of Object.entries(fields)) {
    if (Object.prototype.hasOwnProperty.call(payload, property)) {
      assignments.push(`${column} = $${parameterIndex}`);
      values.push(payload[property]);
      parameterIndex += 1;
    }
  }
  if (assignments.length === 0) {
    return getFeatureFlagByKey(key);
  }
  assignments.push(`updated_by = $${parameterIndex}`);
  values.push(userId || null);
  parameterIndex += 1;
  assignments.push("updated_at = CURRENT_TIMESTAMP");
  values.push(key);
  const result = await pool.query(`
      UPDATE settings_service.feature_flags
      SET ${assignments.join(", ")}
      WHERE key = $${parameterIndex}
      RETURNING *
    `, values);
  return result.rows[0] ? mapFeatureFlag(result.rows[0]) : null;
}
async function deleteFeatureFlag(key) {
  const result = await pool.query(`
      DELETE FROM settings_service.feature_flags
      WHERE key = $1
      RETURNING id, key
    `, [key]);
  return result.rows[0] || null;
}
function mapCountryMembershipSettings(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    countryCode: row.country_code,
    countryName: row.country_name,
    currency: row.currency,
    annualInstructorFee: Number(row.annual_instructor_fee),
    enabled: row.enabled,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function listCountryMembershipSettings({
  enabledOnly = false
} = {}) {
  const result = await pool.query(`
      SELECT *
      FROM settings_service.country_membership_settings
      ${enabledOnly ? "WHERE enabled = TRUE" : ""}
      ORDER BY country_name ASC
    `);
  return result.rows.map(mapCountryMembershipSettings);
}
async function getCountryMembershipSettings(countryCode) {
  const result = await pool.query(`
      SELECT *
      FROM settings_service.country_membership_settings
      WHERE country_code = $1
    `, [String(countryCode).trim().toUpperCase()]);
  return mapCountryMembershipSettings(result.rows[0]);
}
async function createCountryMembershipSettings(payload, userId) {
  const result = await pool.query(`
      INSERT INTO settings_service.country_membership_settings (
        country_code,
        country_name,
        currency,
        annual_instructor_fee,
        enabled,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *
    `, [payload.countryCode.trim().toUpperCase(), payload.countryName.trim(), payload.currency.trim().toUpperCase(), Number(payload.annualInstructorFee), payload.enabled ?? true, userId || null]);
  return mapCountryMembershipSettings(result.rows[0]);
}
async function updateCountryMembershipSettings(countryCode, payload, userId) {
  const fields = {
    countryName: "country_name",
    currency: "currency",
    annualInstructorFee: "annual_instructor_fee",
    enabled: "enabled"
  };
  const assignments = [];
  const values = [];
  let parameterIndex = 1;
  for (const [property, column] of Object.entries(fields)) {
    if (Object.prototype.hasOwnProperty.call(payload, property)) {
      let value = payload[property];
      if (property === "countryName") {
        value = value.trim();
      }
      if (property === "currency") {
        value = value.trim().toUpperCase();
      }
      if (property === "annualInstructorFee") {
        value = Number(value);
      }
      assignments.push(`${column} = $${parameterIndex}`);
      values.push(value);
      parameterIndex += 1;
    }
  }
  if (assignments.length === 0) {
    return getCountryMembershipSettings(countryCode);
  }
  assignments.push(`updated_by = $${parameterIndex}`);
  values.push(userId || null);
  parameterIndex += 1;
  assignments.push("updated_at = CURRENT_TIMESTAMP");
  values.push(String(countryCode).trim().toUpperCase());
  const result = await pool.query(`
      UPDATE settings_service.country_membership_settings
      SET ${assignments.join(", ")}
      WHERE country_code = $${parameterIndex}
      RETURNING *
    `, values);
  return mapCountryMembershipSettings(result.rows[0]);
}
async function deleteCountryMembershipSettings(countryCode) {
  const result = await pool.query(`
      DELETE FROM settings_service.country_membership_settings
      WHERE country_code = $1
      RETURNING id, country_code
    `, [String(countryCode).trim().toUpperCase()]);
  return result.rows[0] || null;
}
module.exports = {
  ensureDefaultSettings,
  getPlatformSettings,
  updatePlatformSettings,
  listFeatureFlags,
  getFeatureFlagByKey,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  listCountryMembershipSettings,
  getCountryMembershipSettings,
  createCountryMembershipSettings,
  updateCountryMembershipSettings,
  deleteCountryMembershipSettings
};
