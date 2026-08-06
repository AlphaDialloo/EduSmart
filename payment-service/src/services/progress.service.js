const axios = require("axios");

const client = axios.create({
  baseURL: process.env.PROGRESS_SERVICE_URL,
  timeout: 10000,
});

function internalHeaders() {
  return {
    "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET,
  };
}

async function createEnrollment({ studentId, courseId, courseTitle }) {
  const response = await client.post(
    "/api/progress/internal/enrollments",
    {
      studentId,
      courseId,
      courseTitle,
    },
    {
      headers: internalHeaders(),
    },
  );

  return response.data;
}

module.exports = {
  createEnrollment,
};
