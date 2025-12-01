"""
Router pentru notificări de modificări ale orarului.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Set
from pydantic import BaseModel

from core.dependencies import get_admin_user, get_db
from models.user import User
from repositories.schedule_repository import ScheduleRepository
from repositories.group_repository import GroupRepository
from core.notification_service import notify_students_for_schedule_changes
from schemas.schedules import ScheduleCreate

router = APIRouter(prefix="/schedule/notifications", tags=["Schedule Notifications"])


class BatchScheduleNotificationRequest(BaseModel):
    """Request pentru notificări în batch după modificarea orarului."""
    modified_group_ids: List[int]


@router.post("/batch")
def notify_batch_schedule_changes(
    request: BatchScheduleNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Trimite notificări către studenții din grupele modificate după o modificare în batch a orarului.
    
    Această funcție este apelată după ce s-au salvat modificările orarului pentru a trimite
    email-uri de notificare către toți studenții din grupele afectate.
    """
    try:
        modified_group_ids = set(request.modified_group_ids)
        
        if not modified_group_ids:
            return {
                "message": "Nu există grupe modificate pentru notificare",
                "groups_notified": 0,
                "total_students": 0,
                "emails_sent": 0
            }
        
        # Trimite notificări
        results = notify_students_for_schedule_changes(db, modified_group_ids)
        
        return {
            "message": "Notificări trimise cu succes",
            **results
        }
    except Exception as e:
        print(f"Eroare la trimiterea notificărilor: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la trimiterea notificărilor: {str(e)}"
        )

