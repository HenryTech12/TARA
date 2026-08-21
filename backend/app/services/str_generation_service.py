from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from groq import Groq

from app.core.config import settings


@dataclass
class STRGenerationResult:
    provider: str
    model_name: str
    model_version: str
    content_json: dict[str, Any]
    content_text: str


class STRGenerationError(RuntimeError):
    pass


class GroqSTRGenerationService:
    def __init__(self) -> None:
        self.provider = "groq"
        self.model_name = settings.groq_model
        self.model_version = "heuristic_v1"
        self._client: Groq | None = None

    def _get_client(self) -> Groq:
        if self._client is None:
            if not settings.groq_api_key:
                raise STRGenerationError("GROQ_API_KEY is not set")
            self._client = Groq(api_key=settings.groq_api_key)
        return self._client

    def _build_prompt(self, alert_payload: dict[str, Any], reviewer_notes: str | None) -> str:
        payload_json = json.dumps(alert_payload, ensure_ascii=True, indent=2)
        notes = reviewer_notes or ""
        return (
            "You are a compliance analyst generating a Suspicious Transaction Report draft for Nigeria.\n"
            "Return ONLY valid JSON with this exact top-level shape:\n"
            "{\n"
            '  "entities_involved": [string],\n'
            '  "transactions_flagged": [string],\n'
            '  "pattern_type_detected": string,\n'
            '  "time_period": string,\n'
            '  "risk_score": string,\n'
            '  "recommended_action": string,\n'
            '  "narrative": string\n'
            "}\n"
            "Use concise regulator-facing language and facts from the payload only.\n"
            f"Reviewer notes: {notes}\n"
            "Alert payload:\n"
            f"{payload_json}\n"
        )

    def _normalize_output(self, raw_text: str, alert_payload: dict[str, Any]) -> dict[str, Any]:
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE).strip()

        try:
            data = json.loads(cleaned)
            if isinstance(data, dict):
                return {
                    "entities_involved": data.get("entities_involved", alert_payload.get("entity_ids", [])),
                    "transactions_flagged": data.get("transactions_flagged", alert_payload.get("transaction_ids", [])),
                    "pattern_type_detected": data.get("pattern_type_detected", alert_payload.get("pattern_type", "unknown")),
                    "time_period": data.get("time_period", alert_payload.get("time_period", "not_specified")),
                    "risk_score": str(data.get("risk_score", alert_payload.get("risk_score", "0.0000"))),
                    "recommended_action": data.get(
                        "recommended_action",
                        "Escalate to compliance officer for review and STR decision",
                    ),
                    "narrative": data.get("narrative", "Potential suspicious activity detected. Review evidence and decide."),
                }
        except json.JSONDecodeError:
            pass

        return {
            "entities_involved": alert_payload.get("entity_ids", []),
            "transactions_flagged": alert_payload.get("transaction_ids", []),
            "pattern_type_detected": alert_payload.get("pattern_type", "unknown"),
            "time_period": alert_payload.get("time_period", "not_specified"),
            "risk_score": str(alert_payload.get("risk_score", "0.0000")),
            "recommended_action": "Escalate to compliance officer for review and STR decision",
            "narrative": cleaned or "Potential suspicious activity detected. Review evidence and decide.",
        }

    def _render_text(self, content_json: dict[str, Any]) -> str:
        lines = [
            "Suspicious Transaction Report (Draft)",
            f"Pattern Type: {content_json.get('pattern_type_detected', 'unknown')}",
            f"Time Period: {content_json.get('time_period', 'not_specified')}",
            f"Risk Score: {content_json.get('risk_score', '0.0000')}",
            f"Entities Involved: {', '.join(str(x) for x in content_json.get('entities_involved', []))}",
            f"Transactions Flagged: {', '.join(str(x) for x in content_json.get('transactions_flagged', []))}",
            f"Recommended Action: {content_json.get('recommended_action', '')}",
            "",
            "Narrative:",
            str(content_json.get("narrative", "")),
        ]
        return "\n".join(lines)

    def generate(
        self,
        alert_payload: dict[str, Any],
        reviewer_notes: str | None = None,
    ) -> STRGenerationResult:
        prompt = self._build_prompt(alert_payload, reviewer_notes)

        try:
            client = self._get_client()
            completion = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You write concise, regulator-ready AML suspicious transaction report drafts.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=900,
            )
            raw_output = completion.choices[0].message.content or ""
        except Exception as exc:  # noqa: BLE001
            raise STRGenerationError(f"Groq STR generation failed: {exc}") from exc

        content_json = self._normalize_output(raw_output, alert_payload)
        content_text = self._render_text(content_json)

        return STRGenerationResult(
            provider=self.provider,
            model_name=self.model_name,
            model_version=self.model_version,
            content_json={
                **content_json,
                "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            },
            content_text=content_text,
        )


str_generation_service = GroqSTRGenerationService()
