"""add template_id to jobs

Revision ID: 002
Revises: 001
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '77df39341915'
branch_labels = None
depends_on = None


def upgrade():
    """Add template_id column to jobs table."""
    op.add_column('jobs', sa.Column('template_id', sa.String(length=100), nullable=True))


def downgrade():
    """Remove template_id column from jobs table."""
    op.drop_column('jobs', 'template_id')
