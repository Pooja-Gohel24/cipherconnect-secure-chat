import psycopg as pg

conn = pg.connect(host='localhost', dbname='cipherconnect', user='postgres', password='root')
cur = conn.cursor()

# Check users table
cur.execute("SELECT id, username, email, created_at FROM users")
users = cur.fetchall()
print('Users in database:')
if users:
    for u in users:
        print(f'  - {u}')
else:
    print('  NO USERS FOUND!')

conn.close()
