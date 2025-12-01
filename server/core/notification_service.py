"""
Serviciu pentru gestionarea notificărilor către studenți când orarul este modificat.
"""
from sqlalchemy.orm import Session
from typing import List, Set
from models.user import User, UserRole
from models.user_group import UserGroup
from models.group import Group
from core.email_service import send_schedule_notifications_to_students


def get_students_by_group_id(db: Session, group_id: int) -> List[User]:
    """
    Obține toți studenții care fac parte dintr-o grupă specificată.
    
    Args:
        db: Sesiunea de bază de date
        group_id: ID-ul grupei
    
    Returns:
        Lista de utilizatori (studenți) din grupă
    """
    user_groups = db.query(UserGroup).filter(UserGroup.group_id == group_id).all()
    student_ids = [ug.user_id for ug in user_groups]
    
    if not student_ids:
        return []
    
    students = (
        db.query(User)
        .filter(User.id.in_(student_ids))
        .filter(User.role == UserRole.STUDENT)
        .all()
    )
    
    return students


def get_group_code_by_id(db: Session, group_id: int) -> str | None:
    """
    Obține codul unei grupe după ID.
    
    Args:
        db: Sesiunea de bază de date
        group_id: ID-ul grupei
    
    Returns:
        Codul grupei sau None dacă nu există
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    return group.code if group else None


def notify_students_for_schedule_changes(
    db: Session,
    modified_group_ids: Set[int]
) -> dict:
    """
    Trimite notificări către studenții din grupele modificate.
    
    Args:
        db: Sesiunea de bază de date
        modified_group_ids: Set de ID-uri ale grupelor modificate
    
    Returns:
        Dict cu statistici despre notificări
    """
    results = {
        "groups_notified": 0,
        "total_students": 0,
        "emails_sent": 0,
        "emails_failed": 0,
        "groups_without_students": []
    }
    
    for group_id in modified_group_ids:
        # Obține codul grupei
        group_code = get_group_code_by_id(db, group_id)
        if not group_code:
            continue
        
        # Obține studenții din grupă
        students = get_students_by_group_id(db, group_id)
        
        if not students:
            results["groups_without_students"].append(group_code)
            continue
        
        # Extrage email-urile studenților (username = posta corporativă)
        student_emails = [student.username for student in students]
        results["total_students"] += len(student_emails)
        
        # Trimite notificări
        email_results = send_schedule_notifications_to_students(
            student_emails,
            group_code
        )
        
        results["emails_sent"] += email_results["sent"]
        results["emails_failed"] += email_results["failed"]
        results["groups_notified"] += 1
        
        print(f"📧 Notificări trimise pentru grupă {group_code}: {email_results['sent']}/{email_results['total']} email-uri")
    
    return results

