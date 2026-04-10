import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database.database import Base, engine
from app.models.message import MessageReaction
Base.metadata.create_all(bind=engine, tables=[MessageReaction.__table__])
print("message_reactions table created.")
