from __future__ import annotations

import os
from typing import Dict, List, Optional

import psycopg2
import psycopg2.extras


class MatchingRepository:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL")
        if not self.database_url:
            raise RuntimeError("DATABASE_URL is required for matching service")

    def _connect(self):
        return psycopg2.connect(self.database_url)

    def get_user_feature_row(self, user_id: str) -> Optional[Dict]:
        query = """
        SELECT
          u.id AS user_id,
          p.career_level,
          COALESCE(p.goals, ARRAY[]::text[]) AS goals,
          p.years_experience,
          p.location,
          p.mentorship_role,
          pref.communication_style AS preferred_style,
          COALESCE(pref.challenge_tags, ARRAY[]::text[]) AS challenge_tags,
          COALESCE(pref.availability_days, ARRAY[]::text[]) AS availability_days
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        LEFT JOIN user_preferences pref ON pref.user_id = u.id
        WHERE u.id = %s AND u.is_active = true
        LIMIT 1
        """
        with self._connect() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query, (user_id,))
                row = cur.fetchone()
                return dict(row) if row else None

    def get_candidate_feature_rows(self, user_id: str, limit: int, exclude_user_ids: List[str]) -> List[Dict]:
        exclusion = [user_id] + exclude_user_ids
        query = """
        SELECT
          u.id AS user_id,
          p.career_level,
          COALESCE(p.goals, ARRAY[]::text[]) AS goals,
          p.years_experience,
          p.location,
          p.mentorship_role,
          pref.communication_style AS preferred_style,
          COALESCE(pref.challenge_tags, ARRAY[]::text[]) AS challenge_tags,
          COALESCE(pref.availability_days, ARRAY[]::text[]) AS availability_days
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        LEFT JOIN user_preferences pref ON pref.user_id = u.id
        WHERE u.id <> ALL(%s::uuid[])
          AND u.is_active = true
          AND p.is_profile_complete = true
        ORDER BY p.completeness_score DESC, u.created_at DESC
        LIMIT %s
        """
        with self._connect() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query, (exclusion, limit))
                rows = cur.fetchall()
                return [dict(r) for r in rows]
