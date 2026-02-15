-- SQLite Schema and Seed Data

-- 1. Schema Definitions
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_class_feedback (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES class_sessions(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    understanding_level INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback_summaries (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES class_sessions(id),
    summary_text TEXT NOT NULL,
    insights TEXT, -- Store JSON as TEXT in SQLite
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_id TEXT
);

-- 2. Seed Data
-- Users
INSERT INTO users (id, name, email, role) VALUES 
('user_teacher_01', 'Prof. Alan Turing', 'alan@university.edu', 'teacher'),
('user_student_01', 'Student A', 'student.a@university.edu', 'student'),
('user_student_02', 'Student B', 'student.b@university.edu', 'student'),
('user_student_03', 'Student C', 'student.c@university.edu', 'student');

-- Classrooms
INSERT INTO classrooms (id, name, description, created_by) VALUES 
('room_cs101', 'CS101: Intro to Computer Science', 'Basic concepts of algorithms', 'user_teacher_01');

-- Sessions
INSERT INTO class_sessions (id, classroom_id, status, started_at) VALUES 
('sess_legacy_01', 'room_cs101', 'ended', datetime('now', '-2 days'));

-- Post-Class Feedback
INSERT INTO post_class_feedback (id, session_id, user_id, understanding_level, comment) VALUES
('feed_01', 'sess_legacy_01', 'user_student_01', 4, 'Great pace, but the recursion examples were tricky.'),
('feed_02', 'sess_legacy_01', 'user_student_02', 5, 'Loved the live coding demo!'),
('feed_03', 'sess_legacy_01', 'user_student_03', 3, 'I got lost halfway through. Maybe slower next time?');

-- Feedback Summaries
INSERT INTO feedback_summaries (id, session_id, summary_text, insights, processed_at, job_id) VALUES 
('summ_01', 'sess_legacy_01', 
 'Students generally found the session engaging, particularly the live coding, though some struggled with the pace of recursion concepts.', 
 '{
    "sentiment_score": 0.75,
    "themes": ["pacing", "recursion", "engagement"],
    "strengths": ["Live coding demos", "Engaging delivery"],
    "improvements": ["Slow down on complex topics like recursion"],
    "confidence": "medium"
 }',
 datetime('now'),
 'job_ai_analytics_001'
);
