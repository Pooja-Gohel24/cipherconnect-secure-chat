from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.api.deps import require_roles
from app.database.database import get_db
from app.models import AuditLog, Report, User, Message, Conversation
from app.models.conversation import ConversationParticipant
from app.schemas.report import ReportCreateRequest, ReportOut
from app.schemas.user import UserRoleUpdateRequest


class ReportResolveRequest(BaseModel):
    status: str


def get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def audit(db: Session, user_id: str, action: str, ip: str = None):
    db.add(AuditLog(user_id=user_id, action=action, ip_address=ip))


router = APIRouter()


@router.get("/dashboard-stats", response_model=dict)
def get_dashboard_stats(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    total_users = db.query(func.count(User.id)).scalar()
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar()
    online_users = db.query(func.count(User.id)).filter(User.is_online == True).scalar()
    total_messages = db.query(func.count(Message.id)).scalar()
    total_conversations = db.query(func.count(Conversation.id)).scalar()

    # Count both "open" and "pending" as active reports needing attention
    pending_reports = db.query(func.count(Report.id)).filter(
        or_(Report.status == "open", Report.status == "pending")
    ).scalar()

    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar()

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = db.query(func.count(Message.id)).filter(Message.created_at >= today).scalar()

    return {
        "total_users": total_users,
        "verified_users": verified_users,
        "online_users": online_users,
        "total_messages": total_messages,
        "total_conversations": total_conversations,
        "pending_reports": pending_reports,
        "new_users_week": new_users_week,
        "messages_today": messages_today,
    }


@router.get("/users", response_model=list[dict])
def list_all_users(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    users = db.query(User).order_by(desc(User.created_at)).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "is_verified": user.is_verified,
            "is_online": user.is_online,
            "created_at": user.created_at,
            "last_seen": user.last_seen,
        }
        for user in users
    ]


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("superadmin")),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    audit(db, current_user.id, f"user_deleted:{target_user.username}", get_ip(request))
    db.delete(target_user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.patch("/users/{user_id}/status", response_model=dict)
def update_user_status(
    user_id: str,
    status: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
):
    if status not in {"active", "suspended", "banned"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    target_user.status = status
    audit(db, current_user.id, f"status_changed:{target_user.username}:{status}", get_ip(request))
    db.commit()
    return {"message": "Status updated successfully"}


@router.patch("/users/{user_id}/role", response_model=dict)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    request: Request,
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
    audit(db, current_user.id, f"role_changed:{target_user.username}:{payload.role}", get_ip(request))
    db.commit()
    return {"message": "Role updated"}


@router.patch("/users/{user_id}/verify", response_model=dict)
def verify_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    audit(db, current_user.id, f"user_verified:{user.username}", get_ip(request))
    db.commit()
    return {"message": "User verified"}


# ── Reports ──────────────────────────────────────────────────────────────────

def _enrich_report(r: Report, user_cache: dict, db: Session) -> dict:
    for uid in [r.reported_by, r.reported_user]:
        if uid and uid not in user_cache:
            u = db.query(User).filter(User.id == uid).first()
            user_cache[uid] = {"username": u.username, "email": u.email} if u else {"username": "deleted", "email": ""}
    return {
        "id": r.id,
        "reported_by": r.reported_by,
        "reported_by_username": user_cache.get(r.reported_by, {}).get("username", "unknown"),
        "reported_by_email": user_cache.get(r.reported_by, {}).get("email", ""),
        "reported_user": r.reported_user,
        "reported_user_username": user_cache.get(r.reported_user, {}).get("username", "unknown"),
        "reported_user_email": user_cache.get(r.reported_user, {}).get("email", ""),
        "conversation_id": r.conversation_id,
        "reason": r.reason,
        "status": r.status,
        "created_at": r.created_at,
    }


@router.post("/reports", response_model=ReportOut)
def create_report(
    payload: ReportCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("user", "admin", "superadmin")),
):
    report = Report(
        reported_by=current_user.id,
        conversation_id=payload.conversation_id,
        reported_user=payload.reported_user,
        reason=payload.reason,
    )
    db.add(report)
    audit(db, current_user.id, "report_created", get_ip(request))
    db.commit()
    db.refresh(report)
    return report


@router.get("/reports", response_model=list[dict])
def list_reports(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    user_cache: dict = {}
    return [_enrich_report(r, user_cache, db) for r in reports]


@router.get("/reports/{report_id}", response_model=dict)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "superadmin")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    user_cache: dict = {}
    return _enrich_report(report, user_cache, db)


@router.patch("/reports/{report_id}", response_model=dict)
def resolve_report(
    report_id: str,
    payload: ReportResolveRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
):
    if payload.status not in {"resolved", "dismissed"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status not in {"open", "pending"}:
        raise HTTPException(status_code=400, detail="Report is already closed")
    report.status = payload.status
    audit(db, current_user.id, f"report_{payload.status}:{report_id}", get_ip(request))
    db.commit()
    return {"message": f"Report {payload.status}"}


# ── Audit Logs ────────────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=list[dict])
def list_audit_logs(db: Session = Depends(get_db), _: User = Depends(require_roles("admin", "superadmin"))):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(500).all()
    user_cache: dict = {}
    result = []
    for log in logs:
        if log.user_id and log.user_id not in user_cache:
            u = db.query(User).filter(User.id == log.user_id).first()
            user_cache[log.user_id] = u.username if u else "deleted"
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": user_cache.get(log.user_id, "system"),
            "action": log.action,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        })
    return result


# ── Conversations ─────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[dict])
def list_all_conversations(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "superadmin")),
):
    convs = db.query(Conversation).order_by(desc(Conversation.created_at)).all()
    result = []
    for c in convs:
        msg_count = db.query(func.count(Message.id)).filter(Message.conversation_id == c.id).scalar()
        member_count = db.query(func.count(ConversationParticipant.id)).filter(
            ConversationParticipant.conversation_id == c.id
        ).scalar()
        result.append({
            "id": c.id,
            "type": c.type,
            "name": c.name,
            "created_at": c.created_at,
            "message_count": msg_count,
            "member_count": member_count,
        })
    return result


@router.delete("/conversations/{conv_id}", response_model=dict)
def delete_conversation(
    conv_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("superadmin")),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    audit(db, current_user.id, f"conversation_deleted:{conv_id}", get_ip(request))
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted"}
