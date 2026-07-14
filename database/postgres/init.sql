CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS user_service;
CREATE SCHEMA IF NOT EXISTS progress_service;
CREATE SCHEMA IF NOT EXISTS recommendation_service;

CREATE TABLE IF NOT EXISTS auth_service.users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 first_name VARCHAR(100) NOT NULL,
 last_name VARCHAR(100) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS auth_service.roles (
 id SERIAL PRIMARY KEY,
 name VARCHAR(50) UNIQUE NOT NULL,
 description TEXT
);
CREATE TABLE IF NOT EXISTS auth_service.user_roles (
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 role_id INT REFERENCES auth_service.roles(id) ON DELETE CASCADE,
 assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id, role_id)
);
INSERT INTO auth_service.roles(name, description) VALUES
('ADMIN','Administrateur'),('INSTRUCTOR','Formateur'),('STUDENT','Étudiant')
ON CONFLICT(name) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_service.student_profiles (
 user_id UUID PRIMARY KEY REFERENCES auth_service.users(id) ON DELETE CASCADE,
 current_level VARCHAR(30) DEFAULT 'BEGINNER',
 learning_style VARCHAR(30) DEFAULT 'MIXED',
 bio TEXT,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_service.learning_preferences (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 preferred_format VARCHAR(30) DEFAULT 'MIXED',
 preferred_language VARCHAR(30) DEFAULT 'fr',
 weekly_goal_hours INT DEFAULT 5,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_service.learning_goals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 title VARCHAR(150) NOT NULL,
 description TEXT,
 target_date DATE,
 status VARCHAR(30) DEFAULT 'IN_PROGRESS',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress_service.enrollments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 course_id VARCHAR(100) NOT NULL,
 course_title VARCHAR(200) NOT NULL,
 status VARCHAR(30) DEFAULT 'STARTED',
 progress_percentage NUMERIC(5,2) DEFAULT 0,
 started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 completed_at TIMESTAMP,
 UNIQUE(user_id, course_id)
);
CREATE TABLE IF NOT EXISTS progress_service.lesson_progress (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 enrollment_id UUID REFERENCES progress_service.enrollments(id) ON DELETE CASCADE,
 module_id VARCHAR(100) NOT NULL,
 resource_id VARCHAR(100) NOT NULL,
 progress_percentage NUMERIC(5,2) DEFAULT 0,
 completed BOOLEAN DEFAULT FALSE,
 last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(enrollment_id, module_id, resource_id)
);
CREATE TABLE IF NOT EXISTS progress_service.quiz_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 course_id VARCHAR(100) NOT NULL,
 quiz_id VARCHAR(100) NOT NULL,
 score NUMERIC(5,2) NOT NULL,
 passed BOOLEAN DEFAULT FALSE,
 attempt_number INT DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_service.recommendations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 course_id VARCHAR(100),
 resource_id VARCHAR(100),
 recommendation_type VARCHAR(50) DEFAULT 'COURSE',
 reason TEXT NOT NULL,
 recommendation_score NUMERIC(5,2) DEFAULT 0,
 status VARCHAR(30) DEFAULT 'PENDING',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS recommendation_service.recommendation_feedback (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 recommendation_id UUID REFERENCES recommendation_service.recommendations(id) ON DELETE CASCADE,
 user_id UUID REFERENCES auth_service.users(id) ON DELETE CASCADE,
 rating INT NOT NULL,
 comment TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
