from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database.database import get_db
from app.models import AuditLog, Report, User
from app.schemas.report import ReportCreateRequest, ReportOut
from app.schemas.user import UserRoleUpdateRequest

router = APIRouter()


@router.post("/reports", response_model=ReportOut)
def create_report(
    payload: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
):
    report = Report(
        reported_by=current_user.id,
        conversation_id=payload.conversation_id,
        reported_user=payload.reported_user,
        reason=payload.reason,
    )
    db.add(report)
    db.add(AuditLog(user_id=current_user.id, action="report_created"))
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.get("/audit-logs", response_model=list[dict])
def list_audit_logs(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.patch("/users/{user_id}/role", response_model=dict)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("superadmin")),
):
    if payload.role not in {"user", "admin", "superadmin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id and payload.role != "superadmin":
        raise HTTPException(status_code=400, detail="Cannot demote yourself")

    target_user.role = payload.role
    db.add(
        AuditLog(
            user_id=current_user.id,
            action=f"role_changed:{target_user.id}:{payload.role}",
        )
    )
    db.commit()
    return {"message": "Role updated"}
