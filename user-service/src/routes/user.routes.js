const router = require('express').Router();
const c = require('../controllers/user.controller');
const {
  authenticate,
  authorize
} = require('../middlewares/auth.middleware');
router.get('/admin/summary', authenticate, authorize('ADMIN'), c.adminSummary);
router.get('/admin', authenticate, authorize('ADMIN'), c.adminList);
router.patch('/admin/:userId', authenticate, authorize('ADMIN'), c.adminUpdate);
router.get('/profile', authenticate, c.getProfile);
router.put('/profile/student', authenticate, c.updateProfile);
router.post('/preferences', authenticate, c.addPreference);
router.get('/preferences', authenticate, c.getPreferences);
router.post('/goals', authenticate, c.addGoal);
router.get('/goals', authenticate, c.getGoals);
module.exports = router;
