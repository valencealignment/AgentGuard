from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4


EVENT_TYPES = [
    "agent.registered",
    "claim.created",
    "scan.requested",
    "scan.result",
    "research.generated",
    "decision.allow",
    "decision.block",
    "decision.escalate",
    "notification.sent",
    "reputation.updated",
    "approval.requested",
    "blog.generated",
    "heartbeat",
]


def base_event(event_type: str, subject_kind: str, subject_id: str) -> dict[str, object]:
    return {
        "id": f"evt-{uuid4()}",
        "ts": datetime.now(timezone.utc).isoformat(),
        "source": "computer-2",
        "type": event_type,
        "subject_kind": subject_kind,
        "subject_id": subject_id,
        "severity": "info",
        "decision": "none",
        "reputation_delta": 0,
        "title": "",
        "summary": "",
        "status": "complete",
        "artifacts": [],
    }
