"""fix_assessment_schedules_structure

Revision ID: fix_assessment_schedules
Revises: add_assessment_schedules
Create Date: 2026-01-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_assessment_schedules'
down_revision: Union[str, Sequence[str], None] = 'add_assessment_schedules'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - fix assessment_schedules table structure."""
    
    # Verifică dacă tabelul există și dacă are structura corectă
    conn = op.get_bind()
    from sqlalchemy import inspect as sqlalchemy_inspect
    inspector = sqlalchemy_inspect(conn)
    tables = inspector.get_table_names()
    
    if 'assessment_schedules' in tables:
        # Verifică coloanele existente
        columns = [col['name'] for col in inspector.get_columns('assessment_schedules')]
        
        # Dacă nu are groups_composition, șterge tabelul vechi și îl recreează
        if 'groups_composition' not in columns:
            # Șterge index-ul dacă există
            try:
                op.drop_index('ix_assessment_schedules_id', table_name='assessment_schedules')
            except:
                pass
            
            # Șterge tabelul vechi
            op.drop_table('assessment_schedules')
            
            # Creează tabelul cu noua structură
            op.create_table(
                'assessment_schedules',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('subject', sa.String(), nullable=False),
                sa.Column('groups_composition', sa.String(), nullable=False),
                sa.Column('professor_name', sa.String(), nullable=False),
                sa.Column('assessment_date', sa.String(), nullable=False),
                sa.Column('assessment_time', sa.String(), nullable=False),
                sa.Column('room_code', sa.String(), nullable=False),
                sa.Column('academic_year', sa.Integer(), nullable=False),
                sa.Column('semester', sa.String(), nullable=False),
                sa.Column('cycle_type', sa.String(), nullable=True),
                sa.PrimaryKeyConstraint('id')
            )
            op.create_index(op.f('ix_assessment_schedules_id'), 'assessment_schedules', ['id'], unique=False)
    else:
        # Dacă tabelul nu există, îl creează
        op.create_table(
            'assessment_schedules',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('subject', sa.String(), nullable=False),
            sa.Column('groups_composition', sa.String(), nullable=False),
            sa.Column('professor_name', sa.String(), nullable=False),
            sa.Column('assessment_date', sa.String(), nullable=False),
            sa.Column('assessment_time', sa.String(), nullable=False),
            sa.Column('room_code', sa.String(), nullable=False),
            sa.Column('academic_year', sa.Integer(), nullable=False),
            sa.Column('semester', sa.String(), nullable=False),
            sa.Column('cycle_type', sa.String(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_assessment_schedules_id'), 'assessment_schedules', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema - nu face nimic, păstrează structura."""
    pass
