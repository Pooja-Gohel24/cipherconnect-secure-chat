"""
Comprehensive API test script for CipherConnect
Tests: Authentication, Conversations, Messages, Contacts, Groups
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

class APITester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.conversation_id = None
        self.message_id = None
        self.user2_id = None
        self.user2_token = None
        
    def print_response(self, method, endpoint, status, response):
        print(f"\n{'='*60}")
        print(f"{method} {endpoint}")
        print(f"Status: {status}")
        print(f"Response: {json.dumps(response, indent=2)}")
        print('='*60)
    
    def test_register(self):
        """Test user registration"""
        print("\n\n>>> TEST 1: User Registration")
        
        # Register first user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": "testuser1",
            "email": "testuser1@test.com",
            "password": "testpass123"
        })
        self.print_response("POST", "/api/auth/register", response.status_code, response.json())
        assert response.status_code == 200, "Registration failed"
        
        # Register second user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": "testuser2",
            "email": "testuser2@test.com",
            "password": "testpass123"
        })
        self.print_response("POST", "/api/auth/register", response.status_code, response.json())
        assert response.status_code == 200, "Registration 2 failed"
        
    def test_login(self):
        """Test user login"""
        print("\n\n>>> TEST 2: User Login")
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser1@test.com",
            "password": "testpass123",
            "device_id": "test-device",
            "device_name": "Test Device"
        })
        self.print_response("POST", "/api/auth/login", response.status_code, response.json())
        
        data = response.json()
        self.access_token = data.get("access_token")
        self.refresh_token = data.get("refresh_token")
        
        assert response.status_code == 200, "Login failed"
        assert self.access_token is not None, "No access token"
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/users/me", headers={
            "Authorization": f"Bearer {self.access_token}"
        })
        self.print_response("GET", "/api/users/me", response.status_code, response.json())
        self.user_id = response.json().get("id")
        
    def test_create_conversation(self):
        """Test creating a conversation"""
        print("\n\n>>> TEST 3: Create Conversation")
        
        # First, we need another user in the database for the conversation
        # Let's create a direct conversation (type: direct)
        response = requests.post(
            f"{BASE_URL}/api/chat/conversations",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json={
                "type": "direct",
                "name": None,
                "description": None,
                "profile_picture": None,
                "participant_ids": [self.user_id]  # For direct, it will be just self
            }
        )
        self.print_response("POST", "/api/chat/conversations", response.status_code, response.json())
        
        if response.status_code == 200:
            self.conversation_id = response.json().get("id")
        
    def test_list_conversations(self):
        """Test listing conversations"""
        print("\n\n>>> TEST 4: List Conversations")
        
        response = requests.get(
            f"{BASE_URL}/api/chat/conversations",
            headers={"Authorization": f"Bearer {self.access_token}"}
        )
        self.print_response("GET", "/api/chat/conversations", response.status_code, response.json())
        
    def test_send_message(self):
        """Test sending a message"""
        print("\n\n>>> TEST 5: Send Message")
        
        # First create a conversation if not exists
        if not self.conversation_id:
            self.test_create_conversation()
            
        if self.conversation_id:
            response = requests.post(
                f"{BASE_URL}/api/chat/messages",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={
                    "conversation_id": self.conversation_id,
                    "encrypted_content": "SGVsbG8gV29ybGQhIFRoaXMgaXMgYW4gZW5jcnlwdGVkIG1lc3NhZ2U=",  # Base64 encoded
                    "message_type": "text",
                    "reply_to": None
                }
            )
            self.print_response("POST", "/api/chat/messages", response.status_code, response.json())
            
            if response.status_code == 200:
                self.message_id = response.json().get("id")
        else:
            print("Skipping - no conversation ID")
            
    def test_list_messages(self):
        """Test listing messages"""
        print("\n\n>>> TEST 6: List Messages")
        
        if self.conversation_id:
            response = requests.get(
                f"{BASE_URL}/api/chat/conversations/{self.conversation_id}/messages",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            self.print_response("GET", f"/api/chat/conversations/{self.conversation_id}/messages", 
                              response.status_code, response.json())
        else:
            print("Skipping - no conversation ID")
            
    def test_create_group(self):
        """Test creating a group"""
        print("\n\n>>> TEST 7: Create Group")
        
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers={"Authorization": f"Bearer {self.access_token}"},
            json={
                "type": "group",
                "name": "Test Group",
                "description": "A test group",
                "profile_picture": None,
                "participant_ids": []
            }
        )
        self.print_response("POST", "/api/groups", response.status_code, response.json())
        
    def test_contacts(self):
        """Test contacts functionality"""
        print("\n\n>>> TEST 8: Create Contact")
        
        # First, get the second user's ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testuser2@test.com",
            "password": "testpass123",
            "device_id": "test-device-2",
            "device_name": "Test Device 2"
        })
        
        if response.status_code == 200:
            data = response.json()
            user2_token = data.get("access_token")
            
            response = requests.get(f"{BASE_URL}/api/users/me", headers={
                "Authorization": f"Bearer {user2_token}"
            })
            self.user2_id = response.json().get("id")
            
            # Now add this user as a contact
            response = requests.post(
                f"{BASE_URL}/api/users/contacts",
                headers={"Authorization": f"Bearer {self.access_token}"},
                json={"contact_user_id": self.user2_id}
            )
            self.print_response("POST", "/api/users/contacts", response.status_code, response.json())
        
    def run_all_tests(self):
        """Run all tests"""
        print("="*60)
        print("CIPHERCONNECT API COMPREHENSIVE TEST")
        print("="*60)
        
        try:
            self.test_register()
            self.test_login()
            self.test_create_conversation()
            self.test_list_conversations()
            self.test_send_message()
            self.test_list_messages()
            self.test_create_group()
            self.test_contacts()
            
            print("\n\n" + "="*60)
            print("ALL TESTS COMPLETED!")
            print("="*60)
            
        except AssertionError as e:
            print(f"\n\nTEST FAILED: {e}")
        except Exception as e:
            print(f"\n\nERROR: {e}")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
