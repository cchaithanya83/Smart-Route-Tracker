import sqlite3

def add_image_column():
    try:
        # Connect to the database
        conn = sqlite3.connect("waste_management.db")
        cursor = conn.cursor()
        
        # Add image column to user_queries table
        cursor.execute("""
            ALTER TABLE user_queries ADD COLUMN image BLOB
        """)
        
        conn.commit()
        print("Successfully added 'image' column to user_queries table.")
        
    except sqlite3.Error as e:
        print(f"Error modifying database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_image_column()