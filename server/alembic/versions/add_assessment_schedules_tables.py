"""add_assessment_schedules_tables

Revision ID: add_assessment_schedules
Revises: add_academic_year_fields
Create Date: 2026-01-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_assessment_schedules'
down_revision: Union[str, Sequence[str], None] = 'add_academic_year_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add assessment_schedules table."""
    
    # Creează tabelul assessment_schedules
    op.create_table(
        'assessment_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),  # Numele disciplinei (scris manual)
        sa.Column('groups_composition', sa.String(), nullable=False),  # Componența seriei - grupele separate prin virgulă
        sa.Column('professor_name', sa.String(), nullable=False),  # Cadrul didactic titular (scris manual)
        sa.Column('assessment_date', sa.String(), nullable=False),  # Data evaluării (scris manual)
        sa.Column('assessment_time', sa.String(), nullable=False),  # Ora evaluării (scris manual)
        sa.Column('room_code', sa.String(), nullable=False),  # Codul sălii (scris manual)
        sa.Column('academic_year', sa.Integer(), nullable=False),  # Anul academic (1, 2, 3, 4)
        sa.Column('semester', sa.String(), nullable=False),  # "assessments1" sau "assessments2"
        sa.Column('cycle_type', sa.String(), nullable=True),  # "F" sau "FR"
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessment_schedules_id'), 'assessment_schedules', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema - remove assessment_schedules table."""
    op.drop_index(op.f('ix_assessment_schedules_id'), table_name='assessment_schedules')
    op.drop_table('assessment_schedules')
