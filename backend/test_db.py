import psycopg

# Try different password options
passwords = ['', 'postgres', 'password', 'root']

for pwd in passwords:
    try:
        conn = psycopg.connect(
            host='localhost',
            port='5432',
            user='postgres',
            password=pwd,
            dbname='postgres'
        )
        conn.close()
        print(f"SUCCESS: Connected with password '{pwd}'")
        break
    except Exception as e:
        print(f"FAILED with password '{pwd}': {str(e)[:50]}")
