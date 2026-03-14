from typing import List, Optional

from pydantic import BaseModel, Field


class MatchRequest(BaseModel):
    user_id: str = Field(..., description="Source user id")
    candidate_limit: int = Field(25, ge=1, le=200)
    exclude_user_ids: List[str] = Field(default_factory=list)


class CandidateScore(BaseModel):
    user_id: str
    score: float
    level_compat: float
    goal_alignment: float
    experience_overlap: float
    geographic: float
    communication_style: float
    challenges: float
    availability: float
    identity_alignment: float


class MatchResponse(BaseModel):
    user_id: str
    candidates: List[CandidateScore]


class HealthResponse(BaseModel):
    status: str
    model_ready: bool
    postgres_connected: bool
    detail: Optional[str] = None
