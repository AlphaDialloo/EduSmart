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
exports.adminSummary = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT u.id)::int AS total_users,
        COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'STUDENT')::int AS students,
        COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'INSTRUCTOR')::int AS instructors,
        COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'ADMIN')::int AS administrators
      FROM auth_service.users u
      LEFT JOIN auth_service.user_roles ur ON ur.user_id = u.id
      LEFT JOIN auth_service.roles r ON r.id = ur.role_id
    `);
    const stats = result.rows[0];
    return res.json({
      stats: {
        totalUsers: stats.total_users,
        students: stats.students,
        instructors: stats.instructors,
        administrators: stats.administrators
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
exports.adminList = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM auth_service.users');
    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.status,
        u.created_at,
        COALESCE(r.name, 'STUDENT') AS role
      FROM auth_service.users u
      LEFT JOIN auth_service.user_roles ur ON ur.user_id = u.id
      LEFT JOIN auth_service.roles r ON r.id = ur.role_id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const users = result.rows.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      role: user.role,
      status: user.status,
      isActive: user.status === 'ACTIVE',
      createdAt: user.created_at
    }));
    const total = countResult.rows[0].total;
    return res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
exports.adminUpdate = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { role, isActive } = req.body;
    if (userId === req.user.id && (role || isActive === false)) {
      return res.status(409).json({ message: 'Vous ne pouvez pas désactiver ou modifier votre propre rôle.' });
    }
    await client.query('BEGIN');
    const userResult = await client.query(`
      UPDATE auth_service.users
      SET status = CASE WHEN $1::boolean IS NULL THEN status WHEN $1 THEN 'ACTIVE' ELSE 'INACTIVE' END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `, [typeof isActive === 'boolean' ? isActive : null, userId]);
    if (!userResult.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    if (role) {
      const allowedRoles = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];
      if (!allowedRoles.includes(role)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Rôle invalide.' });
      }
      const roleResult = await client.query('SELECT id FROM auth_service.roles WHERE name = $1', [role]);
      await client.query('DELETE FROM auth_service.user_roles WHERE user_id = $1', [userId]);
      await client.query('INSERT INTO auth_service.user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleResult.rows[0].id]);
    }
    await client.query('COMMIT');
    return res.json({ message: 'Utilisateur mis à jour.' });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } finally {
    client.release();
  }
};
