const router=require('express').Router(); const c=require('../controllers/user.controller'); const {authenticate}=require('../middlewares/auth.middleware');
router.get('/profile',authenticate,c.getProfile); router.put('/profile/student',authenticate,c.updateProfile); router.post('/preferences',authenticate,c.addPreference); router.get('/preferences',authenticate,c.getPreferences); router.post('/goals',authenticate,c.addGoal); router.get('/goals',authenticate,c.getGoals);
module.exports=router;
