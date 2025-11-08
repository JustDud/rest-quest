import argparse
import json
import os
import pathlib
import re
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Sequence

import requests
from dotenv import load_dotenv

BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "models/gemini-1.5-flash"


def _slug(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or value


def _safe_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


@dataclass
class Destination:
    raw: Dict[str, Any]

    @property
    def id(self) -> str:
        return self.raw["id"]

    @property
    def matching(self) -> Dict[str, Any]:
        return self.raw.get("matchingProfile", {})

    def summary_block(self) -> Dict[str, Any]:
        return {
            "id": self.raw.get("id"),
            "name": self.raw.get("displayName"),
            "summary": self.raw.get("summary"),
            "region": self.raw.get("region"),
            "setting": self.raw.get("setting"),
            "idealFor": self.raw.get("idealFor", []),
            "therapeuticFocus": self.raw.get("therapeuticFocus", []),
            "recommendedSeasons": self.raw.get("recommendedSeasons", []),
            "travelCompanions": self.raw.get("travelCompanions", []),
            "matchingProfile": self.matching,
            "clinicianNotes": self.raw.get("clinicianNotes"),
            "accessibilityNotes": self.raw.get("accessibilityNotes"),
        }


class DestinationCatalog:
    def __init__(self, data_path: pathlib.Path):
        payload = json.loads(data_path.read_text())
        self.destinations: List[Destination] = [Destination(d) for d in payload.get("destinations", [])]
        self.schema: Dict[str, Any] = payload.get("geminiMatching", {})

    def preselect(self, profile: Dict[str, Any], limit: int = 8) -> List[Destination]:
        scored = sorted(
            ((self._score_destination(profile, d), d) for d in self.destinations),
            key=lambda item: item[0],
            reverse=True,
        )
        return [dest for score, dest in scored[:limit] if score > 0]

    def _score_destination(self, profile: Dict[str, Any], dest: Destination) -> float:
        matching = dest.matching
        if not matching:
            return 0

        score = 0.0
        emotion = _slug(profile.get("emotion_state", ""))
        if emotion and emotion in matching.get("emotionTags", []):
            score += 3.5

        desired_modality = {_slug(v) for v in _safe_list(profile.get("desiredModalities", []))}
        modality_overlap = desired_modality.intersection(matching.get("modalityTags", []))
        score += 1.5 * len(modality_overlap)

        energy_pref = profile.get("energyPreference")
        if energy_pref and matching.get("energyScore", {}).get("activation") == energy_pref:
            score += 1.0

        budget = profile.get("budgetTier")
        cost_bucket = matching.get("costScore", {}).get("bucket")
        if budget and cost_bucket:
            penalty = abs(self._bucket_rank(budget) - self._bucket_rank(cost_bucket))
            score += max(0, 1.2 - 0.6 * penalty)

        if profile.get("climatePreference") == matching.get("climateTag"):
            score += 0.8

        group_mode = profile.get("groupMode")
        if group_mode and group_mode in matching.get("groupTags", []):
            score += 0.6

        desired_stay = profile.get("desiredStay")
        if desired_stay and desired_stay == matching.get("stayBucket"):
            score += 0.4

        sensitivities = {_slug(v) for v in _safe_list(profile.get("sensitivities", []))}
        contraindications = _slug(" ".join(_safe_list(matching.get("contraindicationSummary", ""))))
        for sensitivity in sensitivities:
            if sensitivity and sensitivity in contraindications:
                score = -1
                break

        return score

    @staticmethod
    def _bucket_rank(bucket: str) -> int:
        ranks = {"budget": 0, "mid": 1, "premium": 2}
        return ranks.get(bucket, 1)


class GeminiRecommender:
    def __init__(
        self,
        catalog: DestinationCatalog,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        require_api_key: bool = True,
    ):
        load_dotenv()
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key and require_api_key:
            raise RuntimeError("GEMINI_API_KEY not provided. Set env var or pass api_key explicitly.")
        self.catalog = catalog
        self.model = model

    def recommend(
        self,
        profile: Dict[str, Any],
        *,
        candidate_limit: int = 8,
        recommendation_count: int = 3,
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        candidates = self.catalog.preselect(profile, limit=candidate_limit)
        if not candidates:
            raise ValueError("No destinations matched the minimum score. Adjust inputs and retry.")

        prompt = self._build_prompt(profile, candidates, recommendation_count)
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        if dry_run:
            return {"prompt": prompt, "payload": payload}

        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY required for live Gemini calls.")

        url = f"{BASE_URL}/{self.model}:generateContent?key={self.api_key}"
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return self._parse_response(data)

    def _build_prompt(
        self,
        profile: Dict[str, Any],
        candidates: Sequence[Destination],
        recommendation_count: int,
    ) -> str:
        schema = self.catalog.schema
        candidate_blocks = [dest.summary_block() for dest in candidates]
        instructions = {
            "scoring": schema.get("scoring"),
            "hardStops": schema.get("scoring", {}).get("hardStops") if schema.get("scoring") else None,
            "promptTemplate": schema.get("promptTemplate"),
            "llmContextHints": schema.get("llmContextHints"),
            "outputFormat": {
                "recommendations": [
                    {
                        "destinationId": "string",
                        "fitReasoning": "1-2 sentences",
                        "confidence": "0-1 float"
                    }
                    for _ in range(recommendation_count)
                ]
            }
        }
        prompt = (
            "You are a wellbeing travel recommender. Use the scoring policy below to evaluate each candidate. "
            "Return strict JSON only.\n\n"
            f"Policy:\n{json.dumps(instructions, indent=2)}\n\n"
            f"User profile:\n{json.dumps(profile, indent=2)}\n\n"
            f"Candidates:\n{json.dumps(candidate_blocks, indent=2)}\n\n"
            f"Return JSON with <= {recommendation_count} recommendations ordered best fit first."
        )
        return prompt

    @staticmethod
    def _parse_response(data: Dict[str, Any]) -> Dict[str, Any]:
        candidates = data.get("candidates", [])
        if not candidates:
            return {"raw": data}
        text_parts = candidates[0].get("content", {}).get("parts", [])
        response_text = " ".join(part.get("text", "") for part in text_parts).strip()
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return {"rawText": response_text, "raw": data}


def load_profile(profile_path: pathlib.Path) -> Dict[str, Any]:
    return json.loads(profile_path.read_text())


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Run Gemini wellbeing destination recommendations.")
    parser.add_argument("--profile", type=pathlib.Path, required=True, help="Path to user profile JSON.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Gemini model id.")
    parser.add_argument("--dry-run", action="store_true", help="Skip API call and output prompt only.")
    parser.add_argument("--candidates", type=int, default=8, help="Candidate pool size sent to Gemini.")
    parser.add_argument("--top", type=int, default=3, help="Number of recommendations to request.")
    args = parser.parse_args(argv)

    catalog = DestinationCatalog(pathlib.Path("data/mock_travel_data.json"))
    recommender = GeminiRecommender(catalog, model=args.model, require_api_key=not args.dry_run)
    profile = load_profile(args.profile)

    try:
        result = recommender.recommend(
            profile,
            candidate_limit=args.candidates,
            recommendation_count=args.top,
            dry_run=args.dry_run,
        )
    except Exception as error:  # pragma: no cover - CLI surfacing
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
