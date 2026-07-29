const repository = require("../repositories/settings.repository");
const {
  validatePlatformSettings,
  validateFeatureFlag,
  validateCountryMembershipSettings,
} = require("../utils/validators");

function sendError(res, error) {
  console.error("Settings controller error:", error);

  if (error.code === "23505") {
    return res.status(409).json({
      message: "Une ressource possédant cette clé existe déjà.",
    });
  }

  return res.status(500).json({
    message: "Erreur serveur.",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
  });
}

exports.getPublicSettings = async (_req, res) => {
  try {
    const settings = await repository.getPlatformSettings();

    if (!settings) {
      return res.status(404).json({
        message: "Configuration de la plateforme introuvable.",
      });
    }

    return res.status(200).json({
      settings: {
        platformName: settings.platformName,
        logoUrl: settings.logoUrl,
        supportEmail: settings.supportEmail,
        defaultLanguage: settings.defaultLanguage,
        supportedLanguages: settings.supportedLanguages,
        currency: settings.currency,
        timezone: settings.timezone,
        defaultTheme: settings.defaultTheme,
        maintenanceMode: settings.maintenanceMode,
        allowRegistrations: settings.allowRegistrations,
        certificateEnabled: settings.certificateEnabled,
        recommendationEnabled: settings.recommendationEnabled,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getAdminSettings = async (_req, res) => {
  try {
    const settings = await repository.getPlatformSettings();

    if (!settings) {
      return res.status(404).json({
        message: "Configuration de la plateforme introuvable.",
      });
    }

    return res.status(200).json({ settings });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const errors = validatePlatformSettings(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors,
      });
    }

    const settings = await repository.updatePlatformSettings(
      req.body,
      req.user.id,
    );

    return res.status(200).json({
      message: "Configuration mise à jour avec succès.",
      settings,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.listFeatureFlags = async (_req, res) => {
  try {
    const featureFlags = await repository.listFeatureFlags();

    return res.status(200).json({
      featureFlags,
      total: featureFlags.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getFeatureFlag = async (req, res) => {
  try {
    const featureFlag = await repository.getFeatureFlagByKey(
      req.params.key,
    );

    if (!featureFlag) {
      return res.status(404).json({
        message: "Fonctionnalité introuvable.",
      });
    }

    return res.status(200).json({ featureFlag });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.createFeatureFlag = async (req, res) => {
  try {
    const errors = validateFeatureFlag(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors,
      });
    }

    const featureFlag = await repository.createFeatureFlag(
      req.body,
      req.user.id,
    );

    return res.status(201).json({
      message: "Fonctionnalité créée avec succès.",
      featureFlag,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateFeatureFlag = async (req, res) => {
  try {
    const errors = validateFeatureFlag(req.body, true);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors,
      });
    }

    const featureFlag = await repository.updateFeatureFlag(
      req.params.key,
      req.body,
      req.user.id,
    );

    if (!featureFlag) {
      return res.status(404).json({
        message: "Fonctionnalité introuvable.",
      });
    }

    return res.status(200).json({
      message: "Fonctionnalité mise à jour avec succès.",
      featureFlag,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.deleteFeatureFlag = async (req, res) => {
  try {
    const deleted = await repository.deleteFeatureFlag(req.params.key);

    if (!deleted) {
      return res.status(404).json({
        message: "Fonctionnalité introuvable.",
      });
    }

    return res.status(200).json({
      message: "Fonctionnalité supprimée avec succès.",
      featureFlag: deleted,
    });
  } catch (error) {
    return sendError(res, error);
  }
};


exports.listCountryMembershipSettings = async (req, res) => {
  try {
    const enabledOnly = req.query.enabledOnly === "true";

    const countryMembershipSettings =
      await repository.listCountryMembershipSettings({ enabledOnly });

    return res.status(200).json({
      countryMembershipSettings,
      total: countryMembershipSettings.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getCountryMembershipSettings = async (req, res) => {
  try {
    const countryMembershipSettings =
      await repository.getCountryMembershipSettings(
        req.params.countryCode,
      );

    if (!countryMembershipSettings) {
      return res.status(404).json({
        message: "Tarification d'adhésion introuvable pour ce pays.",
      });
    }

    return res.status(200).json({
      countryMembershipSettings,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.createCountryMembershipSettings = async (req, res) => {
  try {
    const errors = validateCountryMembershipSettings(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors,
      });
    }

    const countryMembershipSettings =
      await repository.createCountryMembershipSettings(
        req.body,
        req.user.id,
      );

    return res.status(201).json({
      message: "Tarification d'adhésion créée avec succès.",
      countryMembershipSettings,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateCountryMembershipSettings = async (req, res) => {
  try {
    const errors = validateCountryMembershipSettings(
      req.body,
      true,
    );

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Données invalides.",
        errors,
      });
    }

    const countryMembershipSettings =
      await repository.updateCountryMembershipSettings(
        req.params.countryCode,
        req.body,
        req.user.id,
      );

    if (!countryMembershipSettings) {
      return res.status(404).json({
        message: "Tarification d'adhésion introuvable pour ce pays.",
      });
    }

    return res.status(200).json({
      message: "Tarification d'adhésion mise à jour avec succès.",
      countryMembershipSettings,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.deleteCountryMembershipSettings = async (req, res) => {
  try {
    const deleted =
      await repository.deleteCountryMembershipSettings(
        req.params.countryCode,
      );

    if (!deleted) {
      return res.status(404).json({
        message: "Tarification d'adhésion introuvable pour ce pays.",
      });
    }

    return res.status(200).json({
      message: "Tarification d'adhésion supprimée avec succès.",
      countryMembershipSettings: {
        id: deleted.id,
        countryCode: deleted.country_code,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};
