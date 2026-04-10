#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models import Conversation, ConversationParticipant

def fix_group_admins():
    """Fix existing groups where creators are not set as admin"""
    db = next(get_db())
    
    try:
        # Get all group conversations
        groups = db.query(Conversation).filter(Conversation.type == "group").all()
        
        for group in groups:
            print(f"Checking group: {group.name} (ID: {group.id})")
            print(f"Created by: {group.created_by}")
            
            # Find the creator's participant record
            creator_participant = db.query(ConversationParticipant).filter(
                ConversationParticipant.conversation_id == group.id,
                ConversationParticipant.user_id == group.created_by
            ).first()
            
            if creator_participant:
                if creator_participant.role != "admin":
                    print(f"  Fixing: Setting creator as admin (was: {creator_participant.role})")
                    creator_participant.role = "admin"
                else:
                    print(f"  OK: Creator is already admin")
            else:
                print(f"  ERROR: Creator not found in participants!")
        
        db.commit()
        print("All groups fixed!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_group_admins()