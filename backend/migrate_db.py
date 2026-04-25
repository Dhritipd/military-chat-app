import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'military_chat.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE project_members ADD COLUMN role VARCHAR(20) DEFAULT 'operator';")
except sqlite3.OperationalError as e:
    print(f"Column might already exist: {e}")

try:
    cursor.execute("ALTER TABLE projects ADD COLUMN stego_key VARCHAR;")
except sqlite3.OperationalError as e:
    print(f"Column stego_key might already exist: {e}")

try:
    cursor.execute("ALTER TABLE messages ADD COLUMN sensitivity VARCHAR DEFAULT 'low';")
except sqlite3.OperationalError as e:
    print(f"Column sensitivity might already exist: {e}")

try:
    cursor.execute("ALTER TABLE messages ADD COLUMN recipient_type VARCHAR DEFAULT 'project';")
except sqlite3.OperationalError as e:
    print(f"Column recipient_type might already exist: {e}")

cursor.execute("""
    UPDATE project_members 
    SET role = 'commander' 
    WHERE user_id IN (SELECT created_by FROM projects WHERE id = project_id);
""")

conn.commit()
conn.close()
print("Migration complete.")
