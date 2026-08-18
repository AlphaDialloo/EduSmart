const {
  pool
} = require("./db");

async function migrate() {
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'payment_service'
          AND table_name = 'payments'
          AND column_name = 'reference_id'
          AND data_type = 'uuid'
      ) THEN
        ALTER TABLE payment_service.payments
          ALTER COLUMN reference_id TYPE VARCHAR(100)
          USING reference_id::text;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'payment_service'
          AND table_name = 'course_purchases'
          AND column_name = 'course_id'
          AND data_type = 'uuid'
      ) THEN
        ALTER TABLE payment_service.course_purchases
          ALTER COLUMN course_id TYPE VARCHAR(100)
          USING course_id::text;
      END IF;
    END
    $$;
  `);
}

module.exports = migrate;
