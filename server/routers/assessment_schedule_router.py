from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from typing import List

from core.dependencies import get_admin_user, get_db
from core.database import Base, engine
from core.websocket_manager import websocket_manager
from models.user import User
from models.assessment_schedule import AssessmentSchedule
from repositories.assessment_schedule_repository import AssessmentScheduleRepository
from schemas.assessment_schedules import (
    AssessmentScheduleCreate,
    AssessmentScheduleResponse,
    AssessmentScheduleUpdate,
)

# Verifică și creează tabelele dacă nu există
def ensure_tables_exist():
    """Creează tabelele dacă nu există sau le actualizează dacă structura este veche."""
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        
        if 'assessment_schedules' not in table_names:
            print("⚠️ Tabelul assessment_schedules nu există. Se creează...")
            Base.metadata.create_all(bind=engine, tables=[AssessmentSchedule.__table__])
            print("✓ Tabelul assessment_schedules a fost creat!")
        else:
            # Verifică dacă tabelul are structura corectă
            columns = [col['name'] for col in inspector.get_columns('assessment_schedules')]
            required_columns = ['groups_composition', 'professor_name', 'assessment_date', 
                              'assessment_time', 'room_code', 'academic_year', 'semester', 'cycle_type']
            
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print(f"⚠️ Tabelul assessment_schedules are structură veche (lipsesc: {missing_columns}). Se șterge și se recreează...")
                # Șterge tabelul vechi
                AssessmentSchedule.__table__.drop(engine, checkfirst=True)
                # Creează tabelul cu noua structură
                Base.metadata.create_all(bind=engine, tables=[AssessmentSchedule.__table__])
                print("✓ Tabelul assessment_schedules a fost recreat cu noua structură!")
    except Exception as e:
        print(f"⚠️ Eroare la verificarea/crearea tabelelor: {str(e)}")
        import traceback
        traceback.print_exc()

# Verifică la import
ensure_tables_exist()

router = APIRouter(prefix="/assessment-schedules", tags=["Assessment Schedules"])


@router.get("/", response_model=List[AssessmentScheduleResponse])
def get_all_assessment_schedules(
    academic_year: int | None = None,
    semester: str | None = None,
    cycle_type: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Obține toate evaluările periodice, opțional filtrate după an academic, semestru și tip de ciclu.
    """
    try:
        repo = AssessmentScheduleRepository()
        assessments = repo.get_all(
            db,
            academic_year=academic_year,
            semester=semester,
            cycle_type=cycle_type,
        )
        return [AssessmentScheduleResponse.model_validate(assessment) for assessment in assessments]
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Eroare la încărcarea evaluărilor periodice: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Eroare la încărcarea evaluărilor periodice: {str(e)}",
        )


@router.get("/{assessment_id}", response_model=AssessmentScheduleResponse)
def get_assessment_schedule_by_id(
    assessment_id: int,
    db: Session = Depends(get_db),
):
    """Obține o evaluare periodică după ID."""
    repo = AssessmentScheduleRepository()
    assessment = repo.get_by_id(db, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluarea periodică nu a fost găsită",
        )

    return AssessmentScheduleResponse.model_validate(assessment)


@router.post("/", response_model=AssessmentScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment_schedule(
    item: AssessmentScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Creează o nouă evaluare periodică."""
    repo = AssessmentScheduleRepository()
    new_assessment = repo.create(db, item)
    
    # Emite WebSocket update (opțional - dacă vrei actualizare în timp real)
    # await websocket_manager.broadcast({
    #     "type": "assessment_schedule_update",
    #     "action": "create",
    #     "assessment": AssessmentScheduleResponse.model_validate(new_assessment).model_dump(),
    # })
    
    return AssessmentScheduleResponse.model_validate(new_assessment)


@router.put("/{assessment_id}", response_model=AssessmentScheduleResponse)
async def update_assessment_schedule(
    assessment_id: int,
    item: AssessmentScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Actualizează o evaluare periodică."""
    repo = AssessmentScheduleRepository()
    updated_assessment = repo.update(db, assessment_id, item)

    if not updated_assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluarea periodică nu a fost găsită",
        )

    # Emite WebSocket update (opțional)
    # await websocket_manager.broadcast({
    #     "type": "assessment_schedule_update",
    #     "action": "update",
    #     "assessment": AssessmentScheduleResponse.model_validate(updated_assessment).model_dump(),
    # })

    return AssessmentScheduleResponse.model_validate(updated_assessment)


@router.delete("/{assessment_id}", response_model=dict)
async def delete_assessment_schedule(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """Șterge o evaluare periodică."""
    repo = AssessmentScheduleRepository()
    deleted_assessment = repo.delete(db, assessment_id)

    if not deleted_assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluarea periodică nu a fost găsită",
        )

    # Emite WebSocket update (opțional)
    # await websocket_manager.broadcast({
    #     "type": "assessment_schedule_update",
    #     "action": "delete",
    #     "assessment_id": assessment_id,
    # })

    return {"message": f"Evaluarea periodică cu ID {assessment_id} a fost ștearsă cu succes!"}
