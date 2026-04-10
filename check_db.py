#!/usr/bin/env python3

import psycopg2
import os

# Database connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/cipherconnect"

def check_database():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if role column exists
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'conversation_participants'
            ORDER BY ordinal_position;
        """)
        
        print("Conversation Participants Table Structure:")
        print("-" * 50)
        for row in cur.fetchall():
            print(f"{row[0]}: {row[1]} (nullable: {row[2]}, default: {row[3]})")
        
        # Check existing groups and roles
        cur.execute("""
            SELECT 
                c.name as group_name,
                c.created_by,
                cp.user_id,
                cp.role,
                u.username
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            JOIN users u ON cp.user_id = u.id
            WHERE c.type = 'group'
            ORDER BY c.name, cp.role DESC;
        """)
        
        print("\nExisting Groups and Roles:")
        print("-" * 50)
        for row in cur.fetchall():
            print(f"Group: {row[0]}, User: {row[4]}, Role: {row[3]}, Created by: {row[1]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_database()