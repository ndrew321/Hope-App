from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

import numpy as np
from scipy.spatial.distance import cosine

from .feature_extraction import UserFeatureInput, build_goal_embedding, build_numeric_feature_vector

WEIGHTS: Dict[str, float] = {
    "level_compat": 0.20,
    "goal_alignment": 0.20,
    "experience_overlap": 0.15,
    "geographic": 0.10,
    "communication_style": 0.10,
    "challenges": 0.10,
    "availability": 0.10,
    "identity_alignment": 0.05,
}


@dataclass
class ScoreBreakdown:
    level_compat: float
    goal_alignment: float
    experience_overlap: float
    geographic: float
    communication_style: float
    challenges: float
    availability: float
    identity_alignment: float

    @property
    def total(self) -> float:
        weighted = (
            self.level_compat * WEIGHTS["level_compat"]
            + self.goal_alignment * WEIGHTS["goal_alignment"]
            + self.experience_overlap * WEIGHTS["experience_overlap"]
            + self.geographic * WEIGHTS["geographic"]
            + self.communication_style * WEIGHTS["communication_style"]
            + self.challenges * WEIGHTS["challenges"]
            + self.availability * WEIGHTS["availability"]
            + self.identity_alignment * WEIGHTS["identity_alignment"]
        )
        return float(max(0.0, min(1.0, weighted)))


def _safe_cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    if np.allclose(a, 0) or np.allclose(b, 0):
        return 0.0
    return float(1.0 - cosine(a, b))


def _clamp(v: float) -> float:
    return max(0.0, min(1.0, v))


def calculate_breakdown(source: UserFeatureInput, candidate: UserFeatureInput) -> ScoreBreakdown:
    src_numeric = build_numeric_feature_vector(source)
    cand_numeric = build_numeric_feature_vector(candidate)

    src_goal = build_goal_embedding(source)
    cand_goal = build_goal_embedding(candidate)

    level_compat = 1.0 - abs(float(src_numeric[0] - cand_numeric[0]))
    goal_alignment = _safe_cosine_similarity(src_goal, cand_goal)
    experience_overlap = 1.0 - abs(float(src_numeric[1] - cand_numeric[1]))
    geographic = 1.0 if source.location and candidate.location and source.location.lower() == candidate.location.lower() else max(src_numeric[2], cand_numeric[2])
    communication_style = 1.0 - abs(float(src_numeric[4] - cand_numeric[4]))
    challenges = 1.0 - abs(float(src_numeric[5] - cand_numeric[5]))

    src_availability = np.array([src_numeric[6], src_numeric[7]], dtype=np.float32)
    cand_availability = np.array([cand_numeric[6], cand_numeric[7]], dtype=np.float32)
    availability = _safe_cosine_similarity(src_availability, cand_availability)

    identity_alignment = 0.5
    if source.mentorship_role and candidate.mentorship_role:
        pair = {source.mentorship_role.upper(), candidate.mentorship_role.upper()}
        if pair == {"MENTOR", "MENTEE"}:
            identity_alignment = 1.0
        elif "BOTH" in pair:
            identity_alignment = 0.8

    return ScoreBreakdown(
        level_compat=_clamp(level_compat),
        goal_alignment=_clamp(goal_alignment),
        experience_overlap=_clamp(experience_overlap),
        geographic=_clamp(float(geographic)),
        communication_style=_clamp(communication_style),
        challenges=_clamp(challenges),
        availability=_clamp(availability),
        identity_alignment=_clamp(identity_alignment),
    )
