"""add_role_column_to_participants

Revision ID: d29de2a030b3
Revises: c0f1390c314f
Create Date: 2026-03-28 09:01:10.913831

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd29de2a030b3'
down_revision: Union[str, None] = 'c0f1390c314f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add role column to conversation_participants table if it doesn't exist
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='conversation_participants' AND column_name='role') THEN
                ALTER TABLE conversation_participants ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'member';
            END IF;
        END $$;
    """)
    
    # Update existing group creators to be admins
    op.execute("""
        UPDATE conversation_participants 
        SET role = 'admin' 
        WHERE user_id IN (
            SELECT created_by 
            FROM conversations 
            WHERE conversations.id = conversation_participants.conversation_id 
            AND conversations.type = 'group'
        );
    """)


def downgrade() -> None:
    # Remove role column if it exists
    op.execute("""
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='conversation_participants' AND column_name='role') THEN
                ALTER TABLE conversation_participants DROP COLUMN role;
            END IF;
        END $$;
    """)
