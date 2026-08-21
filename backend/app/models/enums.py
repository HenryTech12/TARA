from enum import Enum


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class AlertStatus(str, Enum):
    open = "open"
    closed = "closed"


class PatternType(str, Enum):
    pos_cash_out_ring = "pos_cash_out_ring"
    shell_director_web = "shell_director_web"
    layered_transfer_chain = "layered_transfer_chain"


class DecisionStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    escalated = "escalated"
