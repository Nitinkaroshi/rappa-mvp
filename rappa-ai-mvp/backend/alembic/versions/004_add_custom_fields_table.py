"""add custom_fields table

Revision ID: 004
Revises: 003
Create Date: 2025-12-29

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    """Create custom_fields table."""
    op.create_table(
        'custom_fields',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('field_value', sa.Text(), nullable=True),
        sa.Column('field_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_custom_fields_id'), 'custom_fields', ['id'], unique=False)
    op.create_index(op.f('ix_custom_fields_job_id'), 'custom_fields', ['job_id'], unique=False)
    op.create_index(op.f('ix_custom_fields_user_id'), 'custom_fields', ['user_id'], unique=False)


def downgrade():
    """Drop custom_fields table."""
    op.drop_index(op.f('ix_custom_fields_user_id'), table_name='custom_fields')
    op.drop_index(op.f('ix_custom_fields_job_id'), table_name='custom_fields')
    op.drop_index(op.f('ix_custom_fields_id'), table_name='custom_fields')
    op.drop_table('custom_fields')
