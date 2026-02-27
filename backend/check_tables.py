import psycopg as pg

conn = pg.connect(host='localhost', dbname='cipherconnect', user='postgres', password='root')
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = cur.fetchall()
print('Tables in database:')
if tables:
    for t in tables:
        print(f'  - {t[0]}')
else:
    print('  NO TABLES FOUND!')
conn.close()
