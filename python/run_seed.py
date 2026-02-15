import sqlite3
import os

import sqlite3
import os
import json
import random
from datetime import datetime, timedelta

DB_FILE = "database.db"

def run_seed():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"Removed existing {DB_FILE}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 1. Create Tables
    cursor.executescript("""
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
        insights TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        job_id TEXT
    );
    """)

    # 2. Base Data
    print("Inserting base data...")
    users = [
        ('user_teacher_01', 'Prof. Alan Turing', 'alan@university.edu', 'teacher'),
        ('user_student_01', 'Student A', 'student.a@university.edu', 'student'),
        ('user_student_02', 'Student B', 'student.b@university.edu', 'student'),
        ('user_student_03', 'Student C', 'student.c@university.edu', 'student'),
        ('user_student_04', 'Student D', 'student.d@university.edu', 'student'),
        ('user_student_05', 'Student E', 'student.e@university.edu', 'student')
    ]
    cursor.executemany("INSERT INTO users VALUES (?,?,?,?)", users)
    
    cursor.execute("INSERT INTO classrooms VALUES (?,?,?,?,?,?)", 
                   ('room_cs101', 'CS101: Intro to CS', 'Algorithms', 'user_teacher_01', datetime.now(), datetime.now()))

    # 3. Generate 30 Sessions with Summaries
    print("Generating 30 sessions with summaries...")
    
    topics = ["Recursion", "Dynamic Programming", "Graph Theory", "Sorting Algorithms", "Big O Notation", "Data Structures", "Pointers", "Memory Management", "Concurrency", "Networking"]
    sentiments = ["positive", "neutral", "negative"]
    
    for i in range(1, 31):
        session_id = f"sess_{i:03d}"
        topic = random.choice(topics)
        date = datetime.now() - timedelta(days=random.randint(1, 60))
        
        # Insert Session
        cursor.execute("INSERT INTO class_sessions (id, classroom_id, status, started_at) VALUES (?, ?, ?, ?)",
                       (session_id, 'room_cs101', 'ended', date))
        
        # Simulate Analysis Result based on random sentiment
        sentiment_type = random.choice(sentiments)
        score = 0.0
        summary = ""
        themes = [topic, "Pacing", "Clarity"]
        
        if sentiment_type == "positive":
            score = random.uniform(0.7, 0.99)
            summary = f"Students loved the {topic} lecture. Examples were clear and pacing was perfect."
            insights = {
                "sentiment_score": round(score, 2),
                "themes": themes,
                "strengths": ["Great examples", "Clear explanation", "Engaging"],
                "improvements": ["None"],
                "confidence": "high"
            }
        elif sentiment_type == "negative":
            score = random.uniform(0.1, 0.4)
            summary = f"Students struggled with {topic}. Many found it too fast and confusing."
            insights = {
                "sentiment_score": round(score, 2),
                "themes": themes + ["Confusion"],
                "strengths": ["Topic relevance"],
                "improvements": ["Slow down", "More examples", "Explain basics first"],
                "confidence": "high"
            }
        else: # neutral
            score = random.uniform(0.41, 0.69)
            summary = f"The {topic} session was okay, but some parts were rushed."
            insights = {
                "sentiment_score": round(score, 2),
                "themes": themes,
                "strengths": ["Good slides"],
                "improvements": ["More interaction needed"],
                "confidence": "medium"
            }
            
        # Insert Summary
        cursor.execute("INSERT INTO feedback_summaries (id, session_id, summary_text, insights, processed_at, job_id) VALUES (?, ?, ?, ?, ?, ?)",
                       (f"summ_{i:03d}", session_id, summary, json.dumps(insights), date + timedelta(hours=2), f"job_{i:03d}"))
        
        # Insert some dummy feedback for this session
        for j in range(random.randint(3, 8)):
            cursor.execute("INSERT INTO post_class_feedback (id, session_id, user_id, understanding_level, comment) VALUES (?, ?, ?, ?, ?)",
                           (f"feed_{i}_{j}", session_id, random.choice(users)[0], random.randint(1, 5), "Sample comment"))

    conn.commit()
    
    # Verify
    cursor.execute("SELECT count(*) FROM feedback_summaries")
    count = cursor.fetchone()[0]
    print(f"Success! Database populated with {count} summaries.")
    
    conn.close()

if __name__ == "__main__":
    run_seed()
