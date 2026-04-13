import sqlite3
from datetime import datetime

def safe_add_column(conn, table_name, column_name, column_def):
    """Safely add a column to a table, ignoring if it already exists."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}")
        conn.commit()
        print(f"[Migration] ✓ Added {column_name} column to {table_name}")
        return True
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print(f"[Migration] Column {column_name} already exists")
            return False
        else:
            print(f"[Migration] Error adding {column_name}: {e}")
            return False
    except Exception as e:
        print(f"[Migration] Unexpected error adding {column_name}: {e}")
        return False

def init_db():
    """Initialize database with all required tables and columns."""
    try:
        conn = sqlite3.connect("local_datbase.db", timeout=15.0)
        print("[Init] Database connection established")
    except Exception as e:
        print(f"[Init] CRITICAL: Cannot connect to database: {e}")
        return False

    cursor = conn.cursor()

    # Create the user_profile table with basic columns
    try:
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
        print("[Init] ✓ user_profile table created or verified")
    except Exception as e:
        print(f"[Init] Error creating user_profile table: {e}")

    # Add all required columns to user_profile
    print("[Init] Adding required columns to user_profile...")
    safe_add_column(conn, 'user_profile', 'name', "TEXT")
    safe_add_column(conn, 'user_profile', 'subscription_tier', "TEXT DEFAULT 'free'")
    safe_add_column(conn, 'user_profile', 'documents_uploaded_this_month', "INTEGER DEFAULT 0")
    safe_add_column(conn, 'user_profile', 'documents_processed', "INTEGER DEFAULT 0")
    safe_add_column(conn, 'user_profile', 'last_reset_date', "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    # Create subscription plans table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscription_plans (
                plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                monthly_limit INTEGER,
                price REAL,
                features TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("[Init] ✓ subscription_plans table created or verified")
    except Exception as e:
        print(f"[Init] Error creating subscription_plans table: {e}")

    # Create subscription history table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscription_history (
                transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plan_name TEXT NOT NULL,
                amount REAL,
                status TEXT DEFAULT 'completed',
                transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES user_profile(user_id)
            )
        """)
        conn.commit()
        print("[Init] ✓ subscription_history table created or verified")
    except Exception as e:
        print(f"[Init] Error creating subscription_history table: {e}")

    # Insert default plans if not exist
    try:
        cursor.execute("SELECT COUNT(*) FROM subscription_plans")
        count = cursor.fetchone()[0]
        if count == 0:
            cursor.execute("""
                INSERT INTO subscription_plans (name, monthly_limit, price, features) VALUES
                ('free', 5, 0.0, 'Upload up to 5 documents per month,Basic support,Standard processing'),
                ('premium', NULL, 9.99, 'Unlimited document uploads,Priority support,Advanced analytics,Faster processing')
            """)
            conn.commit()
            print("[Init] ✓ Inserted default subscription plans")
        else:
            print(f"[Init] Subscription plans already exist ({count} plans)")
    except Exception as e:
        print(f"[Init] Error with subscription plans: {e}")

    conn.close()
    print("[Init] ✓ Database initialization completed successfully")
    return True

if __name__ == "__main__":
    init_db()