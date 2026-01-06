"""add custom_templates and batches tables

Revision ID: 006
Revises: 005
Create Date: 2025-12-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    """Create custom_templates and batches tables."""

    # Create custom_templates table
    op.create_table(
        'custom_templates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('document_type', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('schema', JSONB, nullable=False),
        sa.Column('sample_image_path', sa.String(length=500), nullable=True),
        sa.Column('field_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_custom_templates_id'), 'custom_templates', ['id'], unique=False)
    op.create_index(op.f('ix_custom_templates_user_id'), 'custom_templates', ['user_id'], unique=False)

    # Create batches table
    op.create_table(
        'batches',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('custom_template_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('document_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('results', JSONB, nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['custom_template_id'], ['custom_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_batches_id'), 'batches', ['id'], unique=False)
    op.create_index(op.f('ix_batches_user_id'), 'batches', ['user_id'], unique=False)
    op.create_index(op.f('ix_batches_custom_template_id'), 'batches', ['custom_template_id'], unique=False)
    op.create_index(op.f('ix_batches_status'), 'batches', ['status'], unique=False)
    op.create_index(op.f('ix_batches_expires_at'), 'batches', ['expires_at'], unique=False)


def downgrade():
    """Drop custom_templates and batches tables."""

    # Drop batches table first (due to foreign key)
    op.drop_index(op.f('ix_batches_expires_at'), table_name='batches')
    op.drop_index(op.f('ix_batches_status'), table_name='batches')
    op.drop_index(op.f('ix_batches_custom_template_id'), table_name='batches')
    op.drop_index(op.f('ix_batches_user_id'), table_name='batches')
    op.drop_index(op.f('ix_batches_id'), table_name='batches')
    op.drop_table('batches')

    # Drop custom_templates table
    op.drop_index(op.f('ix_custom_templates_user_id'), table_name='custom_templates')
    op.drop_index(op.f('ix_custom_templates_id'), table_name='custom_templates')
    op.drop_table('custom_templates')
