import axios from "axios";

const UPLOAD_API_URL =
  import.meta.env.VITE_UPLOAD_API_URL || "http://localhost:3000/api/uploads";

const uploadApi = axios.create({
  baseURL: UPLOAD_API_URL,
  timeout: 300000, // 5 minutes
});

function auth(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
}

export async function uploadImage(token, file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await uploadApi.post("/image", formData, {
    ...auth(token),

    onUploadProgress(event) {
      if (!onProgress) return;

      const percent = Math.round((event.loaded * 100) / event.total);

      onProgress(percent);
    },
  });

  return response.data;
}

export async function uploadVideo(token, file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await uploadApi.post("/video", formData, {
    ...auth(token),

    onUploadProgress(event) {
      if (!onProgress) return;

      const percent = Math.round((event.loaded * 100) / event.total);

      onProgress(percent);
    },
  });

  return response.data;
}

export async function uploadDocument(token, file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await uploadApi.post("/document", formData, {
    ...auth(token),

    onUploadProgress(event) {
      if (!onProgress) return;

      const percent = Math.round((event.loaded * 100) / event.total);

      onProgress(percent);
    },
  });

  return response.data;
}
