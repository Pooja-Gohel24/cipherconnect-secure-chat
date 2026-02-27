import requests

url = 'http://127.0.0.1:8000/api/auth/register'
# Use unique timestamp-based username
import time
unique_id = int(time.time())
data = {
    'username': f'newuser{unique_id}', 
    'email': f'test{unique_id}@example.com', 
    'password': 'Test1234', 
    'bio': 'Test bio'
}

try:
    r = requests.post(url, json=data)
    print('Status:', r.status_code)
    print('Response:', r.text)
except Exception as e:
    print('Error:', e)
