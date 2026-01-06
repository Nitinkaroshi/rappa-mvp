"""add email change fields to users

Revision ID: 003
Revises: 002
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    """Add email change fields to users table."""
    op.add_column('users', sa.Column('pending_email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('email_change_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('email_change_token_expires', sa.DateTime(), nullable=True))
    op.create_index(op.f('ix_users_email_change_token'), 'users', ['email_change_token'], unique=False)


def downgrade():
    """Remove email change fields from users table."""
    op.drop_index(op.f('ix_users_email_change_token'), table_name='users')
    op.drop_column('users', 'email_change_token_expires')
    op.drop_column('users', 'email_change_token')
    op.drop_column('users', 'pending_email')
