import time
import requests

time.sleep(3)
r = requests.options(
    'http://127.0.0.1:8000/api/auth/login',
    headers={
        'Origin': 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST'
    }
)
print(f'Status: {r.status_code}')
print(f'Allow-Origin: {r.headers.get("access-control-allow-origin", "NOT SET")}')
print(f'All headers: {dict(r.headers)}')
