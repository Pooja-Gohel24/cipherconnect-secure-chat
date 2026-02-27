import psycopg

# Check if database exists, if not create it
try:
    conn = psycopg.connect(
        host='localhost',
        port='5432',
        user='postgres',
        password='root',
        dbname='cipherconnect'
    )
    conn.close()
    print("Database 'cipherconnect' exists!")
except Exception as e:
    print(f"Database 'cipherconnect' does not exist or error: {str(e)[:80]}")
    
    # Try to create the database
    try:
        conn = psycopg.connect(
            host='localhost',
            port='5432',
            user='postgres',
            password='root',
            dbname='postgres'
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("CREATE DATABASE cipherconnect")
        cur.close()
        conn.close()
        print("Database 'cipherconnect' created successfully!")
    except Exception as e2:
        print(f"Error creating database: {str(e2)[:80]}")
