const { pool } = require("../config/db");

function mapPlan(row) {
  if (!row) return null;

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    billingCycle: row.billing_cycle,
    durationMonths: row.duration_months,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSubscription(row) {
  if (!row) return null;

  return {
    id: row.id,
    instructorId: row.instructor_id,
    planId: row.plan_id,
    planCode: row.plan_code,
    planName: row.plan_name,
    countryCode: row.country_code,
    currency: row.currency,
    amount: Number(row.amount),
    status: row.status,
    paymentId: row.payment_id,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    cancelledAt: row.cancelled_at,
    suspendedAt: row.suspended_at,
    autoRenew: row.auto_renew,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getPlanByCode(code, client = pool) {
  const result = await client.query(
    `
      SELECT *
      FROM subscription_service.subscription_plans
      WHERE code = $1 AND active = TRUE
    `,
    [code],
  );

  return mapPlan(result.rows[0]);
}

async function findOpenPending(instructorId, planId, client = pool) {
  const result = await client.query(
    `
      SELECT s.*, p.code AS plan_code, p.name AS plan_name
      FROM subscription_service.instructor_subscriptions s
      JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
      WHERE s.instructor_id = $1
        AND s.plan_id = $2
        AND s.status = 'PENDING'
      ORDER BY s.created_at DESC
      LIMIT 1
    `,
    [instructorId, planId],
  );

  return mapSubscription(result.rows[0]);
}

async function createSubscription({
  instructorId,
  planId,
  countryCode,
  currency,
  amount,
  autoRenew = false,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`subscription:${instructorId}`],
    );

    const pending = await findOpenPending(instructorId, planId, client);

    if (pending) {
      await client.query("COMMIT");
      return { subscription: pending, created: false };
    }

    const result = await client.query(
      `
        INSERT INTO subscription_service.instructor_subscriptions (
          instructor_id,
          plan_id,
          country_code,
          currency,
          amount,
          status,
          auto_renew
        )
        VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
        RETURNING *
      `,
      [
        instructorId,
        planId,
        countryCode,
        currency,
        amount,
        autoRenew,
      ],
    );

    await addHistory(
      {
        subscriptionId: result.rows[0].id,
        eventType: "CREATED",
        fromStatus: null,
        toStatus: "PENDING",
        actorType: "INSTRUCTOR",
        actorId: instructorId,
        metadata: { countryCode, currency, amount },
      },
      client,
    );

    const fullResult = await client.query(
      `
        SELECT s.*, p.code AS plan_code, p.name AS plan_name
        FROM subscription_service.instructor_subscriptions s
        JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
        WHERE s.id = $1
      `,
      [result.rows[0].id],
    );

    await client.query("COMMIT");

    return {
      subscription: mapSubscription(fullResult.rows[0]),
      created: true,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getMySubscriptions(instructorId) {
  const result = await pool.query(
    `
      SELECT s.*, p.code AS plan_code, p.name AS plan_name
      FROM subscription_service.instructor_subscriptions s
      JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
      WHERE s.instructor_id = $1
      ORDER BY s.created_at DESC
    `,
    [instructorId],
  );

  return result.rows.map(mapSubscription);
}

async function getSubscriptionById(id, client = pool) {
  const result = await client.query(
    `
      SELECT s.*, p.code AS plan_code, p.name AS plan_name
      FROM subscription_service.instructor_subscriptions s
      JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
      WHERE s.id = $1
    `,
    [id],
  );

  return mapSubscription(result.rows[0]);
}

async function getCurrentActive(instructorId, client = pool) {
  const result = await client.query(
    `
      SELECT s.*, p.code AS plan_code, p.name AS plan_name
      FROM subscription_service.instructor_subscriptions s
      JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
      WHERE s.instructor_id = $1
        AND s.status = 'ACTIVE'
        AND s.started_at <= CURRENT_TIMESTAMP
        AND s.expires_at > CURRENT_TIMESTAMP
      ORDER BY s.expires_at DESC
      LIMIT 1
    `,
    [instructorId],
  );

  return mapSubscription(result.rows[0]);
}

async function activateSubscription(id, paymentId, actorId = null) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const locked = await client.query(
      `
        SELECT s.*, p.duration_months
        FROM subscription_service.instructor_subscriptions s
        JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
        WHERE s.id = $1
        FOR UPDATE
      `,
      [id],
    );

    const subscription = locked.rows[0];

    if (!subscription) {
      await client.query("ROLLBACK");
      return null;
    }

    if (subscription.status === "ACTIVE") {
      const current = await getSubscriptionById(id, client);
      await client.query("COMMIT");
      return current;
    }

    if (!["PENDING", "PAYMENT_FAILED"].includes(subscription.status)) {
      const error = new Error(
        `Une adhésion ${subscription.status} ne peut pas être activée.`,
      );
      error.statusCode = 409;
      throw error;
    }

    const latestActive = await client.query(
      `
        SELECT expires_at
        FROM subscription_service.instructor_subscriptions
        WHERE instructor_id = $1
          AND status = 'ACTIVE'
          AND expires_at > CURRENT_TIMESTAMP
        ORDER BY expires_at DESC
        LIMIT 1
      `,
      [subscription.instructor_id],
    );

    const result = await client.query(
      `
        UPDATE subscription_service.instructor_subscriptions
        SET status = 'ACTIVE',
            payment_id = $2,
            started_at = GREATEST(
              CURRENT_TIMESTAMP,
              COALESCE($3::TIMESTAMPTZ, CURRENT_TIMESTAMP)
            ),
            expires_at = GREATEST(
              CURRENT_TIMESTAMP,
              COALESCE($3::TIMESTAMPTZ, CURRENT_TIMESTAMP)
            ) + make_interval(months => $4),
            cancelled_at = NULL,
            suspended_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        paymentId,
        latestActive.rows[0]?.expires_at || null,
        subscription.duration_months,
      ],
    );

    await addHistory(
      {
        subscriptionId: id,
        eventType: "PAYMENT_CONFIRMED",
        fromStatus: subscription.status,
        toStatus: "ACTIVE",
        actorType: "SERVICE",
        actorId,
        metadata: { paymentId },
      },
      client,
    );

    const full = await getSubscriptionById(result.rows[0].id, client);
    await client.query("COMMIT");
    return full;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function markPaymentFailed(id, paymentId, reason, actorId = null) {
  return changeStatus({
    id,
    status: "PAYMENT_FAILED",
    eventType: "PAYMENT_FAILED",
    actorType: "SERVICE",
    actorId,
    metadata: { paymentId, reason },
    allowedFrom: ["PENDING"],
    paymentId,
  });
}

async function cancelPending(id, instructorId) {
  return changeStatus({
    id,
    status: "CANCELLED",
    eventType: "CANCELLED",
    actorType: "INSTRUCTOR",
    actorId: instructorId,
    allowedFrom: ["PENDING", "PAYMENT_FAILED"],
    ownerId: instructorId,
  });
}

async function changeStatus({
  id,
  status,
  eventType,
  actorType,
  actorId,
  metadata = {},
  allowedFrom,
  ownerId,
  paymentId,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT *
        FROM subscription_service.instructor_subscriptions
        WHERE id = $1
          ${ownerId ? "AND instructor_id = $2" : ""}
        FOR UPDATE
      `,
      ownerId ? [id, ownerId] : [id],
    );

    const current = result.rows[0];

    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    if (allowedFrom && !allowedFrom.includes(current.status)) {
      const error = new Error(
        `Le statut ${current.status} ne permet pas cette opération.`,
      );
      error.statusCode = 409;
      throw error;
    }

    const update = await client.query(
      `
        UPDATE subscription_service.instructor_subscriptions
        SET status = $2,
            payment_id = COALESCE($3, payment_id),
            cancelled_at = CASE
              WHEN $2 = 'CANCELLED' THEN CURRENT_TIMESTAMP
              ELSE cancelled_at
            END,
            suspended_at = CASE
              WHEN $2 = 'SUSPENDED' THEN CURRENT_TIMESTAMP
              WHEN $2 = 'ACTIVE' THEN NULL
              ELSE suspended_at
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
      [id, status, paymentId || null],
    );

    await addHistory(
      {
        subscriptionId: id,
        eventType,
        fromStatus: current.status,
        toStatus: status,
        actorType,
        actorId,
        metadata,
      },
      client,
    );

    const full = await getSubscriptionById(update.rows[0].id, client);
    await client.query("COMMIT");
    return full;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateAdminStatus(id, status, actorId, reason) {
  return changeStatus({
    id,
    status,
    eventType: "ADMIN_STATUS_CHANGED",
    actorType: "ADMIN",
    actorId,
    metadata: { reason },
  });
}

async function listSubscriptions({
  page = 1,
  limit = 20,
  status,
  instructorId,
  countryCode,
}) {
  const conditions = [];
  const values = [];

  function add(value, expression) {
    values.push(value);
    conditions.push(expression.replace("?", `$${values.length}`));
  }

  if (status) add(status, "s.status = ?");
  if (instructorId) add(instructorId, "s.instructor_id = ?");
  if (countryCode) add(countryCode, "s.country_code = ?");

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  values.push(limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  const result = await pool.query(
    `
      SELECT s.*, p.code AS plan_code, p.name AS plan_name,
             COUNT(*) OVER() AS total_count
      FROM subscription_service.instructor_subscriptions s
      JOIN subscription_service.subscription_plans p ON p.id = s.plan_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `,
    values,
  );

  return {
    subscriptions: result.rows.map(mapSubscription),
    total: Number(result.rows[0]?.total_count || 0),
    page,
    limit,
  };
}

async function addHistory(
  {
    subscriptionId,
    eventType,
    fromStatus,
    toStatus,
    actorType,
    actorId,
    metadata = {},
  },
  client = pool,
) {
  await client.query(
    `
      INSERT INTO subscription_service.subscription_history (
        subscription_id,
        event_type,
        from_status,
        to_status,
        actor_type,
        actor_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::JSONB)
    `,
    [
      subscriptionId,
      eventType,
      fromStatus,
      toStatus,
      actorType,
      actorId,
      JSON.stringify(metadata),
    ],
  );
}

async function getHistory(subscriptionId) {
  const result = await pool.query(
    `
      SELECT id, subscription_id, event_type, from_status, to_status,
             actor_type, actor_id, metadata, created_at
      FROM subscription_service.subscription_history
      WHERE subscription_id = $1
      ORDER BY created_at DESC
    `,
    [subscriptionId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    subscriptionId: row.subscription_id,
    eventType: row.event_type,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    actorType: row.actor_type,
    actorId: row.actor_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

async function expireElapsedSubscriptions() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
        UPDATE subscription_service.instructor_subscriptions
        SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'ACTIVE'
          AND expires_at <= CURRENT_TIMESTAMP
        RETURNING id
      `,
    );

    for (const row of result.rows) {
      await addHistory(
        {
          subscriptionId: row.id,
          eventType: "EXPIRED",
          fromStatus: "ACTIVE",
          toStatus: "EXPIRED",
          actorType: "SYSTEM",
          actorId: null,
        },
        client,
      );
    }

    await client.query("COMMIT");
    return result.rowCount;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPlanByCode,
  createSubscription,
  getMySubscriptions,
  getSubscriptionById,
  getCurrentActive,
  activateSubscription,
  markPaymentFailed,
  cancelPending,
  updateAdminStatus,
  listSubscriptions,
  getHistory,
  expireElapsedSubscriptions,
};
