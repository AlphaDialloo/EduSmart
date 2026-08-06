const { pool } = require("../config/db");
const map = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    paymentType: r.payment_type,
    referenceId: r.reference_id,
    provider: r.provider,
    providerPaymentId: r.provider_payment_id,
    countryCode: r.country_code,
    currency: r.currency,
    amount: Number(r.amount),
    refundedAmount: Number(r.refunded_amount),
    status: r.status,
    idempotencyKey: r.idempotency_key,
    failureCode: r.failure_code,
    failureMessage: r.failure_message,
    metadata: r.metadata,
    paidAt: r.paid_at,
    cancelledAt: r.cancelled_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
async function createPayment(d) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    if (d.idempotencyKey) {
      const e = await c.query(
        "SELECT * FROM payment_service.payments WHERE idempotency_key=$1 LIMIT 1",
        [d.idempotencyKey],
      );
      if (e.rows[0]) {
        await c.query("COMMIT");
        return { payment: map(e.rows[0]), created: false };
      }
    }
    const r = await c.query(
      `INSERT INTO payment_service.payments(user_id,payment_type,reference_id,provider,country_code,currency,amount,idempotency_key,metadata) VALUES($1,$2,$3,$4,$5,$6,$7::NUMERIC,$8,$9::JSONB) RETURNING *`,
      [
        d.userId,
        d.paymentType,
        d.referenceId,
        d.provider,
        d.countryCode,
        d.currency,
        d.amount,
        d.idempotencyKey,
        JSON.stringify(d.metadata || {}),
      ],
    );
    await c.query(
      `INSERT INTO payment_service.payment_events(payment_id,event_type,new_status,message,payload) VALUES($1,'CREATED','PENDING',$2,$3::JSONB)`,
      [r.rows[0].id, "Paiement créé.", JSON.stringify(d.metadata || {})],
    );
    if (d.paymentType === "COURSE_PURCHASE")
      await c.query(
        `INSERT INTO payment_service.course_purchases(payment_id,student_id,course_id) VALUES($1,$2,$3)`,
        [r.rows[0].id, d.userId, d.referenceId],
      );
    await c.query("COMMIT");
    return { payment: map(r.rows[0]), created: true };
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function getInstructorAnalytics(instructorId, months = 6) {
  const normalizedMonths = Math.min(Math.max(Number(months) || 6, 1), 24);

  const summaryResult = await pool.query(
    `
      SELECT
        COUNT(*)::integer AS sales_count,

        COALESCE(
          SUM(amount),
          0
        )::numeric AS gross_revenue,

        COALESCE(
          SUM(
            amount * (
              1 - COALESCE(
                (metadata->>'commissionRate')::numeric,
                0
              ) / 100
            )
          ),
          0
        )::numeric AS instructor_revenue,

        COALESCE(
          SUM(
            amount * (
              COALESCE(
                (metadata->>'commissionRate')::numeric,
                0
              ) / 100
            )
          ),
          0
        )::numeric AS platform_commission,

        COALESCE(
          SUM(amount) FILTER (
            WHERE paid_at >= DATE_TRUNC(
              'month',
              CURRENT_TIMESTAMP
            )
          ),
          0
        )::numeric AS current_month_gross_revenue,

        COUNT(*) FILTER (
          WHERE paid_at >= DATE_TRUNC(
            'month',
            CURRENT_TIMESTAMP
          )
        )::integer AS current_month_sales

      FROM payment_service.payments

      WHERE payment_type = 'COURSE_PURCHASE'
        AND status IN (
          'SUCCEEDED',
          'PARTIALLY_REFUNDED'
        )
        AND metadata->>'instructorId' = $1
    `,
    [String(instructorId)],
  );

  const monthlyResult = await pool.query(
    `
      WITH months AS (
        SELECT GENERATE_SERIES(
          DATE_TRUNC('month', CURRENT_TIMESTAMP)
            - (($2::integer - 1) * INTERVAL '1 month'),
          DATE_TRUNC('month', CURRENT_TIMESTAMP),
          INTERVAL '1 month'
        ) AS month_start
      ),

      sales AS (
        SELECT
          DATE_TRUNC('month', paid_at) AS month_start,

          COUNT(*)::integer AS sales,

          COALESCE(
            SUM(amount),
            0
          )::numeric AS gross_revenue,

          COALESCE(
            SUM(
              amount * (
                1 - COALESCE(
                  (metadata->>'commissionRate')::numeric,
                  0
                ) / 100
              )
            ),
            0
          )::numeric AS instructor_revenue,

          COALESCE(
            SUM(
              amount * (
                COALESCE(
                  (metadata->>'commissionRate')::numeric,
                  0
                ) / 100
              )
            ),
            0
          )::numeric AS platform_commission

        FROM payment_service.payments

        WHERE payment_type = 'COURSE_PURCHASE'
          AND status IN (
            'SUCCEEDED',
            'PARTIALLY_REFUNDED'
          )
          AND metadata->>'instructorId' = $1
          AND paid_at >= DATE_TRUNC(
            'month',
            CURRENT_TIMESTAMP
          ) - (($2::integer - 1) * INTERVAL '1 month')

        GROUP BY DATE_TRUNC('month', paid_at)
      )

      SELECT
        TO_CHAR(
          months.month_start,
          'YYYY-MM'
        ) AS month,

        TO_CHAR(
          months.month_start,
          'Mon'
        ) AS label,

        COALESCE(
          sales.sales,
          0
        )::integer AS sales,

        COALESCE(
          sales.gross_revenue,
          0
        )::numeric AS gross_revenue,

        COALESCE(
          sales.instructor_revenue,
          0
        )::numeric AS instructor_revenue,

        COALESCE(
          sales.platform_commission,
          0
        )::numeric AS platform_commission

      FROM months

      LEFT JOIN sales
        ON sales.month_start = months.month_start

      ORDER BY months.month_start ASC
    `,
    [String(instructorId), normalizedMonths],
  );

  const recentSalesResult = await pool.query(
    `
      SELECT
        id,
        user_id,
        reference_id,
        currency,
        amount,
        refunded_amount,
        status,
        metadata,
        paid_at,
        created_at

      FROM payment_service.payments

      WHERE payment_type = 'COURSE_PURCHASE'
        AND status IN (
          'SUCCEEDED',
          'PARTIALLY_REFUNDED'
        )
        AND metadata->>'instructorId' = $1

      ORDER BY paid_at DESC NULLS LAST

      LIMIT 8
    `,
    [String(instructorId)],
  );

  const summary = summaryResult.rows[0] || {};

  return {
    summary: {
      salesCount: Number(summary.sales_count) || 0,
      grossRevenue: Number(summary.gross_revenue) || 0,
      instructorRevenue: Number(summary.instructor_revenue) || 0,
      platformCommission: Number(summary.platform_commission) || 0,
      currentMonthGrossRevenue:
        Number(summary.current_month_gross_revenue) || 0,
      currentMonthSales: Number(summary.current_month_sales) || 0,
    },

    monthlySales: monthlyResult.rows.map((row) => ({
      month: row.month,
      label: row.label,
      sales: Number(row.sales) || 0,
      grossRevenue: Number(row.gross_revenue) || 0,
      instructorRevenue: Number(row.instructor_revenue) || 0,
      platformCommission: Number(row.platform_commission) || 0,
    })),

    recentSales: recentSalesResult.rows.map((row) => {
      const commissionRate = Number(row.metadata?.commissionRate) || 0;

      const amount = Number(row.amount) || 0;

      return {
        id: row.id,
        studentId: row.user_id,
        courseId: row.reference_id,
        courseTitle: row.metadata?.courseTitle || "Cours EduSmart",
        planType: row.metadata?.planType || null,
        currency: row.currency,
        amount,
        refundedAmount: Number(row.refunded_amount) || 0,
        commissionRate,
        instructorRevenue: amount * (1 - commissionRate / 100),
        status: row.status,
        paidAt: row.paid_at,
        createdAt: row.created_at,
      };
    }),
  };
}

async function setProviderPayment(id, pid, metadata) {
  const r = await pool.query(
    `UPDATE payment_service.payments SET provider_payment_id=$2,metadata=metadata||$3::JSONB,updated_at=NOW() WHERE id=$1 RETURNING *`,
    [id, pid, JSON.stringify(metadata || {})],
  );
  return map(r.rows[0]);
}
async function findById(id) {
  return map(
    (
      await pool.query("SELECT * FROM payment_service.payments WHERE id=$1", [
        id,
      ])
    ).rows[0],
  );
}
async function findByIdForUser(id, userId) {
  return map(
    (
      await pool.query(
        "SELECT * FROM payment_service.payments WHERE id=$1 AND user_id=$2",
        [id, userId],
      )
    ).rows[0],
  );
}
async function listForUser(userId, { page, limit }) {
  const o = (page - 1) * limit;
  const [a, b] = await Promise.all([
    pool.query(
      "SELECT * FROM payment_service.payments WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, o],
    ),
    pool.query(
      "SELECT COUNT(*)::INT total FROM payment_service.payments WHERE user_id=$1",
      [userId],
    ),
  ]);
  return { payments: a.rows.map(map), total: b.rows[0].total };
}
async function listAll({ page, limit, status, paymentType }) {
  const p = [],
    f = [];
  if (status) {
    p.push(status);
    f.push(`status=$${p.length}`);
  }
  if (paymentType) {
    p.push(paymentType);
    f.push(`payment_type=$${p.length}`);
  }
  const w = f.length ? "WHERE " + f.join(" AND ") : "";
  const count = await pool.query(
    `SELECT COUNT(*)::INT total FROM payment_service.payments ${w}`,
    p,
  );
  p.push(limit, (page - 1) * limit);
  const items = await pool.query(
    `SELECT * FROM payment_service.payments ${w} ORDER BY created_at DESC LIMIT $${p.length - 1} OFFSET $${p.length}`,
    p,
  );
  return { payments: items.rows.map(map), total: count.rows[0].total };
}
async function transitionStatus({
  paymentId,
  allowedStatuses,
  newStatus,
  eventType,
  message,
  failureCode = null,
  failureMessage = null,
  paidAt = null,
  cancelledAt = null,
  payload = {},
}) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const q = await c.query(
      "SELECT * FROM payment_service.payments WHERE id=$1 FOR UPDATE",
      [paymentId],
    );
    const cur = q.rows[0];
    if (!cur) {
      await c.query("ROLLBACK");
      return null;
    }
    if (!allowedStatuses.includes(cur.status)) {
      const e = new Error(`Transition impossible depuis ${cur.status}.`);
      e.statusCode = 409;
      throw e;
    }
    const r = await c.query(
      `UPDATE payment_service.payments SET status=$2,failure_code=$3,failure_message=$4,paid_at=COALESCE($5,paid_at),cancelled_at=COALESCE($6,cancelled_at),updated_at=NOW() WHERE id=$1 RETURNING *`,
      [paymentId, newStatus, failureCode, failureMessage, paidAt, cancelledAt],
    );
    await c.query(
      `INSERT INTO payment_service.payment_events(payment_id,event_type,previous_status,new_status,message,payload) VALUES($1,$2,$3,$4,$5,$6::JSONB)`,
      [
        paymentId,
        eventType,
        cur.status,
        newStatus,
        message,
        JSON.stringify(payload),
      ],
    );
    await c.query("COMMIT");
    return map(r.rows[0]);
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function markCourseAccessGranted(id) {
  await pool.query(
    `UPDATE payment_service.course_purchases SET access_status='GRANTED',granted_at=NOW() WHERE payment_id=$1`,
    [id],
  );
}
async function createRefund({
  payment,
  requestedBy,
  amount,
  reason,
  providerRefundId,
  status,
}) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const rr = await c.query(
      `INSERT INTO payment_service.refunds(payment_id,requested_by,amount,currency,reason,provider_refund_id,status,processed_at) VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [
        payment.id,
        requestedBy,
        amount,
        payment.currency,
        reason,
        providerRefundId,
        status,
      ],
    );
    const total = Number(payment.refundedAmount) + Number(amount),
      ns = total >= Number(payment.amount) ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const pr = await c.query(
      `UPDATE payment_service.payments SET refunded_amount=$2,status=$3,updated_at=NOW() WHERE id=$1 RETURNING *`,
      [payment.id, total, ns],
    );
    await c.query(
      `INSERT INTO payment_service.payment_events(payment_id,event_type,previous_status,new_status,message,payload) VALUES($1,$2,$3,$4,'Remboursement traité.',$5::JSONB)`,
      [
        payment.id,
        ns,
        payment.status,
        ns,
        JSON.stringify({ refundId: rr.rows[0].id, amount }),
      ],
    );
    await c.query("COMMIT");
    return { refund: rr.rows[0], payment: map(pr.rows[0]) };
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function listEvents(id) {
  return (
    await pool.query(
      `SELECT id,payment_id "paymentId",event_type "eventType",previous_status "previousStatus",new_status "newStatus",message,payload,created_at "createdAt" FROM payment_service.payment_events WHERE payment_id=$1 ORDER BY created_at`,
      [id],
    )
  ).rows;
}
async function getGlobalAnalytics(months = 6) {
  const normalizedMonths = Math.min(Math.max(Number(months) || 6, 1), 24);

  const summaryResult = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE status IN ('SUCCEEDED', 'PARTIALLY_REFUNDED')
      )::INTEGER AS total_sales,

      COALESCE(
        SUM(amount) FILTER (
          WHERE status IN ('SUCCEEDED', 'PARTIALLY_REFUNDED')
        ),
        0
      )::NUMERIC AS total_revenue,

      COALESCE(
        SUM(refunded_amount),
        0
      )::NUMERIC AS refunded_amount,

      COUNT(*) FILTER (
        WHERE status = 'SUCCEEDED'
      )::INTEGER AS successful_sales,

      COUNT(*) FILTER (
        WHERE status = 'FAILED'
      )::INTEGER AS failed_sales,

      COALESCE(
        SUM(amount) FILTER (
          WHERE status IN ('SUCCEEDED', 'PARTIALLY_REFUNDED')
            AND paid_at >= DATE_TRUNC(
              'month',
              CURRENT_TIMESTAMP
            )
        ),
        0
      )::NUMERIC AS current_month_revenue

    FROM payment_service.payments
  `);

  const monthlyResult = await pool.query(
    `
      WITH generated_months AS (
        SELECT
          GENERATE_SERIES(
            DATE_TRUNC('month', CURRENT_TIMESTAMP)
              - (($1::INTEGER - 1) * INTERVAL '1 month'),

            DATE_TRUNC('month', CURRENT_TIMESTAMP),

            INTERVAL '1 month'
          ) AS month_start
      ),

      monthly_payments AS (
        SELECT
          DATE_TRUNC('month', paid_at) AS month_start,

          COUNT(*)::INTEGER AS sales,

          COALESCE(
            SUM(amount),
            0
          )::NUMERIC AS revenue

        FROM payment_service.payments

        WHERE status IN (
          'SUCCEEDED',
          'PARTIALLY_REFUNDED'
        )
          AND paid_at IS NOT NULL
          AND paid_at >=
            DATE_TRUNC('month', CURRENT_TIMESTAMP)
            - (($1::INTEGER - 1) * INTERVAL '1 month')

        GROUP BY DATE_TRUNC('month', paid_at)
      )

      SELECT
        TO_CHAR(
          generated_months.month_start,
          'YYYY-MM'
        ) AS "month",

        TO_CHAR(
          generated_months.month_start,
          'Mon'
        ) AS label,

        COALESCE(
          monthly_payments.sales,
          0
        )::INTEGER AS sales,

        COALESCE(
          monthly_payments.revenue,
          0
        )::NUMERIC AS revenue

      FROM generated_months

      LEFT JOIN monthly_payments
        ON monthly_payments.month_start =
          generated_months.month_start

      ORDER BY generated_months.month_start ASC
    `,
    [normalizedMonths],
  );

  const recentPaymentsResult = await pool.query(`
  SELECT
    id,
    user_id,
    payment_type,
    reference_id,
    provider,
    currency,
    amount,
    refunded_amount,
    status,
    metadata,
    created_at,
    paid_at

  FROM payment_service.payments

  WHERE status IN (
    'SUCCEEDED',
    'PARTIALLY_REFUNDED'
  )

  ORDER BY paid_at DESC NULLS LAST

  LIMIT 10
`);

  const summary = summaryResult.rows[0] || {};

  const monthlyRevenue = monthlyResult.rows.map((row) => ({
    month: row.month,
    label: row.label,
    sales: Number(row.sales) || 0,
    revenue: Number(row.revenue) || 0,
  }));

  return {
    stats: {
      totalSales: Number(summary.total_sales) || 0,
      totalRevenue: Number(summary.total_revenue) || 0,
      refundedAmount: Number(summary.refunded_amount) || 0,
      successfulSales: Number(summary.successful_sales) || 0,
      failedSales: Number(summary.failed_sales) || 0,
      monthlyRevenue: Number(summary.current_month_revenue) || 0,
    },

    monthlyRevenueSeries: monthlyRevenue,

    monthlySales: monthlyRevenue.map((item) => ({
      month: item.month,
      label: item.label,
      sales: item.sales,
    })),

    recentPayments: recentPaymentsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      paymentType: row.payment_type,
      referenceId: row.reference_id,
      provider: row.provider,
      currency: row.currency,
      amount: Number(row.amount) || 0,
      refundedAmount: Number(row.refunded_amount) || 0,
      status: row.status,
      courseTitle: row.metadata?.courseTitle || null,
      createdAt: row.created_at,
      paidAt: row.paid_at,
    })),
  };
}

module.exports = {
  createPayment,
  setProviderPayment,
  findById,
  findByIdForUser,
  listForUser,
  listAll,
  transitionStatus,
  markCourseAccessGranted,
  createRefund,
  listEvents,
  getInstructorAnalytics,
  getGlobalAnalytics,
};
