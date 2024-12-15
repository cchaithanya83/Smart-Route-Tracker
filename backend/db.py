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


cursor.execute('''CREATE TABLE IF NOT EXISTS route_distances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER,
    from_house_id INTEGER,
    to_house_id INTEGER,
    distance FLOAT,
    FOREIGN KEY (route_id) REFERENCES routes(id)
);
''')

# # Insert 100 houses with visited = 0
for house_id in range(1, 101):
    cursor.execute("INSERT INTO houses (house_id, visited) VALUES (?, ?)", (house_id, 0))

# Commit changes and close connection
conn.commit()

# Check the data inserted
cursor.execute("SELECT * FROM houses LIMIT 10")  # Just to check first 10 records
print(cursor.fetchall())

# Close the connection
conn.close()


