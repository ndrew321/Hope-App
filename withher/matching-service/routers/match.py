from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import CandidateScore, MatchRequest, MatchResponse
from services.db import MatchingRepository
from ml.feature_extraction import user_row_to_input
from ml.scoring import calculate_breakdown

router = APIRouter(prefix="/match", tags=["match"])


def get_repository() -> MatchingRepository:
    return MatchingRepository()


@router.post("", response_model=MatchResponse)
def run_matching(payload: MatchRequest, repo: MatchingRepository = Depends(get_repository)) -> MatchResponse:
    source_row = repo.get_user_feature_row(payload.user_id)
    if not source_row:
        raise HTTPException(status_code=404, detail="User not found for matching")

    candidate_rows = repo.get_candidate_feature_rows(
        user_id=payload.user_id,
        limit=payload.candidate_limit,
        exclude_user_ids=payload.exclude_user_ids,
    )

    source = user_row_to_input(source_row)

    scored: List[CandidateScore] = []
    for row in candidate_rows:
        candidate = user_row_to_input(row)
        breakdown = calculate_breakdown(source, candidate)
        scored.append(
            CandidateScore(
                user_id=candidate.user_id,
                score=round(breakdown.total, 6),
                level_compat=round(breakdown.level_compat, 6),
                goal_alignment=round(breakdown.goal_alignment, 6),
                experience_overlap=round(breakdown.experience_overlap, 6),
                geographic=round(breakdown.geographic, 6),
                communication_style=round(breakdown.communication_style, 6),
                challenges=round(breakdown.challenges, 6),
                availability=round(breakdown.availability, 6),
                identity_alignment=round(breakdown.identity_alignment, 6),
            )
        )

    scored.sort(key=lambda x: x.score, reverse=True)
    return MatchResponse(user_id=payload.user_id, candidates=scored)
