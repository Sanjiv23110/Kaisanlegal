import sqlite3

def init_db():
    # connect to the database
    conn = sqlite3.connect("local_datbase.db")
    cursor = conn.cursor()

    # Create the user_profile table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profile (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            saved_roadmaps TEXT,
            document_history TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()