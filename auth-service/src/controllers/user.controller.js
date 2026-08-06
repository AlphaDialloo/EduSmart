const pool = require("../config/db");

function normalizePagination(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

exports.adminSummary = async (_req, res) => {
  try {
    const [statsResult, recentUsersResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(DISTINCT u.id)::int AS total_users,

          COUNT(
            DISTINCT CASE
              WHEN r.name = 'STUDENT'
              THEN u.id
            END
          )::int AS students,

          COUNT(
            DISTINCT CASE
              WHEN r.name = 'INSTRUCTOR'
              THEN u.id
            END
          )::int AS instructors,

          COUNT(
            DISTINCT CASE
              WHEN r.name IN ('ADMIN', 'SUPER_ADMIN')
              THEN u.id
            END
          )::int AS administrators

        FROM auth_service.users u

        LEFT JOIN auth_service.user_roles ur
          ON ur.user_id = u.id

        LEFT JOIN auth_service.roles r
          ON r.id = ur.role_id
      `),

      pool.query(`
        SELECT
          u.id,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          CONCAT_WS(
            ' ',
            u.first_name,
            u.last_name
          ) AS "fullName",
          u.email,
          r.name AS role,
          u.created_at AS "createdAt"

        FROM auth_service.users u

        LEFT JOIN auth_service.user_roles ur
          ON ur.user_id = u.id

        LEFT JOIN auth_service.roles r
          ON r.id = ur.role_id

        ORDER BY u.created_at DESC

        LIMIT 5
      `),
    ]);

    const stats = statsResult.rows[0];

    return res.status(200).json({
      stats: {
        totalUsers: stats.total_users || 0,
        students: stats.students || 0,
        instructors: stats.instructors || 0,
        administrators: stats.administrators || 0,
      },

      recentUsers: recentUsersResult.rows,
    });
  } catch (error) {
    console.error("Erreur adminSummary utilisateurs :", error);

    return res.status(500).json({
      message: "Impossible de charger le résumé des utilisateurs.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.adminList = async (req, res) => {
  try {
    const { page, limit, offset } = normalizePagination(req.query);

    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "")
      .trim()
      .toUpperCase();

    const filters = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);

      filters.push(`
        (
          u.first_name ILIKE $${values.length}
          OR u.last_name ILIKE $${values.length}
          OR u.email ILIKE $${values.length}
        )
      `);
    }

    if (role) {
      values.push(role);

      filters.push(`
        r.name = $${values.length}
      `);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    values.push(limit);
    const limitParameter = values.length;

    values.push(offset);
    const offsetParameter = values.length;

    const usersResult = await pool.query(
      `
        SELECT
          u.id,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          CONCAT_WS(
            ' ',
            u.first_name,
            u.last_name
          ) AS "fullName",
          u.email,
          r.name AS role,
          u.created_at AS "createdAt",

          COALESCE(u.is_active, TRUE) AS "isActive"

        FROM auth_service.users u

        LEFT JOIN auth_service.user_roles ur
          ON ur.user_id = u.id

        LEFT JOIN auth_service.roles r
          ON r.id = ur.role_id

        ${whereClause}

        ORDER BY u.created_at DESC

        LIMIT $${limitParameter}
        OFFSET $${offsetParameter}
      `,
      values,
    );

    const countValues = values.slice(0, values.length - 2);

    const countResult = await pool.query(
      `
        SELECT
          COUNT(DISTINCT u.id)::int AS total

        FROM auth_service.users u

        LEFT JOIN auth_service.user_roles ur
          ON ur.user_id = u.id

        LEFT JOIN auth_service.roles r
          ON r.id = ur.role_id

        ${whereClause}
      `,
      countValues,
    );

    const total = countResult.rows[0]?.total || 0;

    return res.status(200).json({
      users: usersResult.rows,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur adminList utilisateurs :", error);

    return res.status(500).json({
      message: "Impossible de charger les utilisateurs.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.adminUpdate = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    if (String(req.user.id) === String(id) && isActive === false) {
      return res.status(409).json({
        message: "Vous ne pouvez pas désactiver votre propre compte.",
      });
    }

    await client.query("BEGIN");

    const userResult = await client.query(
      `
        SELECT
          id,
          first_name,
          last_name,
          email

        FROM auth_service.users

        WHERE id = $1
      `,
      [id],
    );

    if (!userResult.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (typeof isActive === "boolean") {
      await client.query(
        `
          UPDATE auth_service.users
          SET is_active = $1
          WHERE id = $2
        `,
        [isActive, id],
      );
    }

    if (role) {
      const normalizedRole = String(role).toUpperCase();

      const allowedRoles = ["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"];

      if (!allowedRoles.includes(normalizedRole)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Rôle invalide.",
        });
      }

      const roleResult = await client.query(
        `
          SELECT id
          FROM auth_service.roles
          WHERE name = $1
        `,
        [normalizedRole],
      );

      if (!roleResult.rows.length) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Le rôle demandé n’existe pas.",
        });
      }

      await client.query(
        `
          DELETE FROM auth_service.user_roles
          WHERE user_id = $1
        `,
        [id],
      );

      await client.query(
        `
          INSERT INTO auth_service.user_roles (
            user_id,
            role_id
          )
          VALUES ($1, $2)
        `,
        [id, roleResult.rows[0].id],
      );
    }

    const updatedResult = await client.query(
      `
        SELECT
          u.id,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          CONCAT_WS(
            ' ',
            u.first_name,
            u.last_name
          ) AS "fullName",
          u.email,
          r.name AS role,
          COALESCE(u.is_active, TRUE) AS "isActive",
          u.created_at AS "createdAt"

        FROM auth_service.users u

        LEFT JOIN auth_service.user_roles ur
          ON ur.user_id = u.id

        LEFT JOIN auth_service.roles r
          ON r.id = ur.role_id

        WHERE u.id = $1
      `,
      [id],
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Utilisateur modifié avec succès.",
      user: updatedResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Erreur adminUpdate utilisateur :", error);

    return res.status(500).json({
      message: "Impossible de modifier l’utilisateur.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};
