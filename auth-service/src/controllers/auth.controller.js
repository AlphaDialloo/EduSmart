const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const sign = user => {
  const firstName = user.firstName ?? user.first_name;
  const lastName = user.lastName ?? user.last_name;
  return jwt.sign({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName,
    lastName
  }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
};
exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = "STUDENT"
    } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Champs obligatoires manquants"
      });
    }
    if (!['STUDENT', 'INSTRUCTOR'].includes(role)) {
      return res.status(400).json({
        message: "Rôle invalide"
      });
    }
    await client.query("BEGIN");
    const exists = await client.query("SELECT id FROM auth_service.users WHERE email = $1", [email]);
    if (exists.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Email déjà utilisé"
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(`
        INSERT INTO auth_service.users (
          first_name,
          last_name,
          email,
          password_hash
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          first_name,
          last_name,
          email
      `, [firstName, lastName, email, passwordHash]);
    const roleResult = await client.query(`
        SELECT id, name
        FROM auth_service.roles
        WHERE name = $1
      `, [role]);
    if (!roleResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Rôle invalide"
      });
    }
    const createdUser = userResult.rows[0];
    await client.query(`
        INSERT INTO auth_service.user_roles (
          user_id,
          role_id
        )
        VALUES ($1, $2)
      `, [createdUser.id, roleResult.rows[0].id]);
    if (role === "STUDENT") {
      await client.query(`
          INSERT INTO user_service.student_profiles (user_id)
          VALUES ($1)
        `, [createdUser.id]);
    }
    await client.query("COMMIT");
    const userForToken = {
      id: createdUser.id,
      firstName: createdUser.first_name,
      lastName: createdUser.last_name,
      email: createdUser.email,
      role
    };
    return res.status(201).json({
      message: "Utilisateur créé",
      token: sign(userForToken),
      user: userForToken
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  } finally {
    client.release();
  }
};
exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe obligatoires"
      });
    }
    const result = await pool.query(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.status,
          u.password_hash,
          r.name AS role
        FROM auth_service.users u
        JOIN auth_service.user_roles ur
          ON ur.user_id = u.id
        JOIN auth_service.roles r
          ON r.id = ur.role_id
        WHERE u.email = $1
      `, [email]);
    if (!result.rows.length) {
      return res.status(401).json({
        message: "Identifiants incorrects"
      });
    }
    const databaseUser = result.rows[0];
    if (databaseUser.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Compte désactivé"
      });
    }
    const passwordIsValid = await bcrypt.compare(password, databaseUser.password_hash);
    if (!passwordIsValid) {
      return res.status(401).json({
        message: "Identifiants incorrects"
      });
    }
    const authenticatedUser = {
      id: databaseUser.id,
      firstName: databaseUser.first_name,
      lastName: databaseUser.last_name,
      email: databaseUser.email,
      role: databaseUser.role
    };
    const token = sign(authenticatedUser);
    console.log("Utilisateur connecté :", authenticatedUser);
    return res.json({
      message: "Connexion réussie",
      token,
      user: authenticatedUser
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};
exports.me = (req, res) => {
  return res.json({
    user: req.user
  });
};
