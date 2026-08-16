const axios = require("axios");
const client = axios.create({
  baseURL: process.env.COURSE_SERVICE_URL,
  timeout: 10000
});
const headers = () => ({
  "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET
});
async function getCourseForPayment(courseId, accessPlanId) {
  const r = await client.get(`/api/courses/internal/${courseId}/payment-details`, {
    params: {
      accessPlanId
    },
    headers: headers()
  });
  return r.data;
}
async function grantCourseAccess({
  courseId,
  studentId,
  paymentId,
  accessPlanId
}) {
  return (await client.post(`/api/courses/internal/${courseId}/grant-access`, {
    studentId,
    paymentId,
    accessPlanId
  }, {
    headers: headers()
  })).data;
}
module.exports = {
  getCourseForPayment,
  grantCourseAccess
};
