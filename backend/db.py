import sqlite3

conn = sqlite3.connect("waste_management.db")
cursor = conn.cursor()

# # Create houses table
# cursor.execute("""
# CREATE TABLE IF NOT EXISTS houses (
#     house_id INTEGER PRIMARY KEY,
#     visited INTEGER DEFAULT 0,
#     neighborhood_encoded INTEGER,
#     previous_day_waste FLOAT
# )
# """)
# cursor.execute('''CREATE TABLE routes ( date TEXT PRIMARY KEY, optimal_route TEXT )''')

# # Create houses table (if not already exists)
# cursor.execute('''CREATE TABLE IF NOT EXISTS houses (
#                     house_id INTEGER PRIMARY KEY,
#                     visited INTEGER DEFAULT 0)''')


cursor.execute('''CREATE TABLE IF NOT EXISTS waste_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            house_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
''')

# # Insert 100 houses with visited = 0

# Commit changes and close connection
conn.commit()

# Check the data inserted
cursor.execute("SELECT * FROM houses LIMIT 10")  # Just to check first 10 records
print(cursor.fetchall())

# Close the connection
conn.close()


