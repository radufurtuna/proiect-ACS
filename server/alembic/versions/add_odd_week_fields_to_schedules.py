"""add_odd_week_fields_to_schedules

Revision ID: add_odd_week_fields
Revises: 2f94fa87e2f8
Create Date: 2025-11-29 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_odd_week_fields'
down_revision: Union[str, Sequence[str], None] = '2f94fa87e2f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add odd week fields to schedules table."""
    # Verifică dacă coloanele există deja înainte de a le adăuga
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('schedules')]
    
    # SQLite nu suportă ALTER TABLE pentru a adăuga constrângeri direct
    # Folosim batch mode pentru a crea un tabel nou cu structura actualizată
    # Pentru SQLite, adăugăm doar coloanele - constrângerile de foreign key
    # vor fi gestionate de SQLAlchemy ORM (relațiile sunt definite în model)
    with op.batch_alter_table('schedules', schema=None) as batch_op:
        # Adaugă coloanele pentru săptămâna impară doar dacă nu există deja
        if 'odd_week_subject_id' not in columns:
            batch_op.add_column(sa.Column('odd_week_subject_id', sa.Integer(), nullable=True))
        if 'odd_week_professor_id' not in columns:
            batch_op.add_column(sa.Column('odd_week_professor_id', sa.Integer(), nullable=True))
        if 'odd_week_room_id' not in columns:
            batch_op.add_column(sa.Column('odd_week_room_id', sa.Integer(), nullable=True))
    
    # Notă: Nu adăugăm constrângerile de foreign key explicit pentru SQLite
    # SQLite nu aplică strict constrângerile de foreign key prin DDL
    # SQLAlchemy ORM gestionează relațiile corect chiar și fără constrângerile DDL
    # Relațiile sunt definite în modelul Schedule și funcționează corect


def downgrade() -> None:
    """Downgrade schema - remove odd week fields from schedules table."""
    # Folosim batch mode pentru SQLite
    with op.batch_alter_table('schedules', schema=None) as batch_op:
        # Șterge coloanele (nu există constrângeri de șters pentru SQLite)
        batch_op.drop_column('odd_week_room_id')
        batch_op.drop_column('odd_week_professor_id')
        batch_op.drop_column('odd_week_subject_id')

