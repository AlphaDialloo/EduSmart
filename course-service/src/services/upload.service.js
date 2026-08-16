const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}
async function uploadImage(file) {
  return uploadBuffer(file.buffer, {
    folder: "edusmart/images",
    resource_type: "image"
  });
}
async function uploadVideo(file) {
  return uploadBuffer(file.buffer, {
    folder: "edusmart/videos",
    resource_type: "video"
  });
}
async function uploadDocument(file) {
  return uploadBuffer(file.buffer, {
    folder: "edusmart/documents",
    resource_type: "raw"
  });
}
async function destroy(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType
  });
}
module.exports = {
  uploadImage,
  uploadVideo,
  uploadDocument,
  destroy
};
