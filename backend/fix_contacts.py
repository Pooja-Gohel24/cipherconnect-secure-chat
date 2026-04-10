"""
Script to fix existing contacts by making them bidirectional
Run this once to fix existing accepted contacts
"""

from app.database.database import engine
from app.models import Contact
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

Session = sessionmaker(bind=engine)

def fix_existing_contacts():
    session = Session()
    
    try:
        # Get all accepted contacts
        accepted_contacts = session.query(Contact).filter(Contact.status == "accepted").all()
        
        print(f"Found {len(accepted_contacts)} accepted contacts")
        
        for contact in accepted_contacts:
            # Check if reciprocal contact exists
            reciprocal = session.query(Contact).filter(
                Contact.user_id == contact.contact_user_id,
                Contact.contact_user_id == contact.user_id
            ).first()
            
            if not reciprocal:
                # Create reciprocal contact
                new_contact = Contact(
                    user_id=contact.contact_user_id,
                    contact_user_id=contact.user_id,
                    status="accepted"
                )
                session.add(new_contact)
                print(f"Created reciprocal contact: {contact.contact_user_id} -> {contact.user_id}")
            else:
                # Update status if needed
                if reciprocal.status != "accepted":
                    reciprocal.status = "accepted"
                    print(f"Updated reciprocal contact status: {reciprocal.user_id} -> {reciprocal.contact_user_id}")
        
        session.commit()
        print("Successfully fixed existing contacts")
        
    except Exception as e:
        session.rollback()
        print(f"Error fixing contacts: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    fix_existing_contacts()