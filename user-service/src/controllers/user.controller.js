const pool = require('../config/db');
exports.getProfile = async (req, res) => {
  try {
    const u = await pool.query('SELECT id,first_name,last_name,email,status FROM auth_service.users WHERE id=$1', [req.user.id]);
    const p = await pool.query('SELECT * FROM user_service.student_profiles WHERE user_id=$1', [req.user.id]);
    res.json({
      user: u.rows[0],
      studentProfile: p.rows[0] || null
    });
  } catch (e) {
    res.status(500).json({
      message: 'Erreur serveur',
      error: e.message
    });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const {
      currentLevel,
      learningStyle,
      bio
    } = req.body;
    const q = await pool.query('UPDATE user_service.student_profiles SET current_level=COALESCE($1,current_level),learning_style=COALESCE($2,learning_style),bio=COALESCE($3,bio),updated_at=CURRENT_TIMESTAMP WHERE user_id=$4 RETURNING *', [currentLevel, learningStyle, bio, req.user.id]);
    res.json({
      message: 'Profil mis à jour',
      profile: q.rows[0]
    });
  } catch (e) {
    res.status(500).json({
      message: 'Erreur serveur',
      error: e.message
    });
  }
};
exports.addPreference = async (req, res) => {
  try {
    const {
      preferredFormat = 'MIXED',
      preferredLanguage = 'fr',
      weeklyGoalHours = 5
    } = req.body;
    const q = await pool.query('INSERT INTO user_service.learning_preferences(user_id,preferred_format,preferred_language,weekly_goal_hours) VALUES($1,$2,$3,$4) RETURNING *', [req.user.id, preferredFormat, preferredLanguage, weeklyGoalHours]);
    res.status(201).json(q.rows[0]);
  } catch (e) {
    res.status(500).json({
      message: 'Erreur serveur',
      error: e.message
    });
  }
};
exports.getPreferences = async (req, res) => {
  const q = await pool.query('SELECT * FROM user_service.learning_preferences WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json(q.rows);
};
exports.addGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      targetDate
    } = req.body;
    const q = await pool.query('INSERT INTO user_service.learning_goals(user_id,title,description,target_date) VALUES($1,$2,$3,$4) RETURNING *', [req.user.id, title, description, targetDate || null]);
    res.status(201).json(q.rows[0]);
  } catch (e) {
    res.status(500).json({
      message: 'Erreur serveur',
      error: e.message
    });
  }
};
exports.getGoals = async (req, res) => {
  const q = await pool.query('SELECT * FROM user_service.learning_goals WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
  res.json(q.rows);
};
