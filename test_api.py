#!/usr/bin/env python3

import requests
import json

# Test the group functionality
BASE_URL = "http://127.0.0.1:8000"

def test_group_functionality():
    # You'll need to get a valid token first
    # For now, let's just test if the endpoints exist
    
    print("Testing group endpoints...")
    
    # Test group info endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/groups/test-id/info")
        print(f"Group info endpoint: {response.status_code}")
    except Exception as e:
        print(f"Group info error: {e}")
    
    # Test members endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/groups/test-id/members")
        print(f"Members endpoint: {response.status_code}")
    except Exception as e:
        print(f"Members error: {e}")
    
    print("Test complete!")

if __name__ == "__main__":
    test_group_functionality()