from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np

from .embeddings import encode_single


@dataclass
class UserFeatureInput:
    user_id: str
    career_level: Optional[str]
    goals: List[str]
    years_experience: Optional[int]
    location: Optional[str]
    mentorship_role: Optional[str]
    preferred_style: Optional[str]
    challenge_tags: List[str]
    availability_days: List[str]


def _normalize_level(level: Optional[str]) -> float:
    scale = {
        "YOUTH": 0.1,
        "HIGH_SCHOOL": 0.25,
        "COLLEGE": 0.45,
        "SEMI_PRO": 0.65,
        "PROFESSIONAL": 0.85,
        "COACH": 0.9,
        "ALUM": 0.75,
    }
    return scale.get((level or "").upper(), 0.0)


def build_numeric_feature_vector(item: UserFeatureInput) -> np.ndarray:
    years_exp = float(max(0, min(item.years_experience or 0, 30))) / 30.0
    level = _normalize_level(item.career_level)

    location_flexible = 1.0 if (item.location or "").strip().lower() in {"any", "remote", "flexible"} else 0.0
    role_score = {
        "MENTOR": 1.0,
        "MENTEE": 0.5,
        "BOTH": 0.8,
    }.get((item.mentorship_role or "").upper(), 0.0)

    style_hash = float(abs(hash((item.preferred_style or "").lower())) % 1000) / 1000.0
    challenge_density = min(len(item.challenge_tags), 10) / 10.0

    weekday_days = {"monday", "tuesday", "wednesday", "thursday", "friday"}
    weekend_days = {"saturday", "sunday"}
    normalized_days = {d.lower() for d in item.availability_days}
    weekday_overlap = len(normalized_days & weekday_days) / 5.0
    weekend_overlap = len(normalized_days & weekend_days) / 2.0

    # 8-dimensional feature vector for structured compatibility dimensions.
    return np.array(
        [
            level,
            years_exp,
            location_flexible,
            role_score,
            style_hash,
            challenge_density,
            weekday_overlap,
            weekend_overlap,
        ],
        dtype=np.float32,
    )


def build_goal_embedding(item: UserFeatureInput) -> np.ndarray:
    goal_text = " ".join(item.goals)
    return encode_single(goal_text)


def user_row_to_input(row: Dict) -> UserFeatureInput:
    return UserFeatureInput(
        user_id=str(row.get("user_id") or row.get("id")),
        career_level=row.get("career_level"),
        goals=row.get("goals") or [],
        years_experience=row.get("years_experience"),
        location=row.get("location"),
        mentorship_role=row.get("mentorship_role"),
        preferred_style=row.get("preferred_style"),
        challenge_tags=row.get("challenge_tags") or [],
        availability_days=row.get("availability_days") or [],
    )
