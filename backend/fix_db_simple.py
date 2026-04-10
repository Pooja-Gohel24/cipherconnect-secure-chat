#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from sqlalchemy import text
    from app.database.database import engine
    
    def fix_database():
        with engine.connect() as conn:
            # Add role column if it doesn't exist
            try:
                conn.execute(text("""
                    ALTER TABLE conversation_participants 
                    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'member';
                """))
                print("Role column added/verified")
            except Exception as e:
                print(f"Role column: {e}")
            
            # Update existing group creators to be admins
            try:
                result = conn.execute(text("""
                    UPDATE conversation_participants 
                    SET role = 'admin' 
                    WHERE user_id IN (
                        SELECT created_by 
                        FROM conversations 
                        WHERE conversations.id = conversation_participants.conversation_id 
                        AND conversations.type = 'group'
                    );
                """))
                print(f"Updated {result.rowcount} group creators to admin")
            except Exception as e:
                print(f"Update admins: {e}")
            
            conn.commit()
            print("Database fixed!")
    
    if __name__ == "__main__":
        fix_database()
        
except ImportError as e:
    print(f"Import error: {e}")
    print("Please run this from the backend directory with the virtual environment activated")
except Exception as e:
    print(f"Error: {e}")