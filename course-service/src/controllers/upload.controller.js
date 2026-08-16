const uploadService = require("../services/upload.service");
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Aucune image envoyée."
      });
    }
    const result = await uploadService.uploadImage(req.file);
    res.status(201).json({
      message: "Image uploadée.",
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        format: result.format
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Aucune vidéo envoyée."
      });
    }
    const result = await uploadService.uploadVideo(req.file);
    res.status(201).json({
      message: "Vidéo uploadée.",
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        bytes: result.bytes,
        format: result.format
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Aucun document envoyé."
      });
    }
    const result = await uploadService.uploadDocument(req.file);
    res.status(201).json({
      message: "Document uploadé.",
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};
