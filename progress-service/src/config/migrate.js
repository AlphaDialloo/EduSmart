const pool = require("./db");

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress_service.learning_reflections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES progress_service.enrollments(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth_service.users(id) ON DELETE CASCADE,
      course_id VARCHAR(100) NOT NULL,
      module_id VARCHAR(100) NOT NULL,
      module_title VARCHAR(200) NOT NULL,
      summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 4000),
      confidence_level INT NOT NULL DEFAULT 3 CHECK (confidence_level BETWEEN 1 AND 5),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (enrollment_id, module_id)
    );
    CREATE INDEX IF NOT EXISTS idx_learning_reflections_enrollment
      ON progress_service.learning_reflections(enrollment_id);
    CREATE INDEX IF NOT EXISTS idx_learning_reflections_user
      ON progress_service.learning_reflections(user_id);
  `);
}

module.exports = migrate;
