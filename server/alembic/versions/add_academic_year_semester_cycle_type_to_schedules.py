"""add_academic_year_semester_cycle_type_to_schedules

Revision ID: add_academic_year_fields
Revises: add_odd_week_fields
Create Date: 2026-01-04 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_academic_year_fields'
down_revision: Union[str, Sequence[str], None] = 'add_odd_week_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add academic_year, semester, cycle_type fields to schedules table."""
    # Verifică dacă coloanele există deja înainte de a le adăuga
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('schedules')]
    
    # Folosim batch mode pentru SQLite (compatibilitate)
    with op.batch_alter_table('schedules', schema=None) as batch_op:
        # Adaugă coloanele doar dacă nu există deja
        if 'academic_year' not in columns:
            batch_op.add_column(sa.Column('academic_year', sa.Integer(), nullable=True))
        if 'semester' not in columns:
            batch_op.add_column(sa.Column('semester', sa.String(), nullable=True))
        if 'cycle_type' not in columns:
            batch_op.add_column(sa.Column('cycle_type', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema - remove academic_year, semester, cycle_type fields from schedules table."""
    # Folosim batch mode pentru SQLite
    with op.batch_alter_table('schedules', schema=None) as batch_op:
        # Șterge coloanele
        batch_op.drop_column('cycle_type')
        batch_op.drop_column('semester')
        batch_op.drop_column('academic_year')

