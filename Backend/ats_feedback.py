import json
import re
from typing import Dict, List

try:
    from groq import Groq
except Exception:  # pragma: no cover - optional dependency at runtime
    Groq = None


def _extract_json_payload(content: str) -> Dict:
    """Extract JSON object from raw model response text."""
    if not content:
        return {}

    text = content.strip()

    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return {}

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return {}


def _build_prompt(resume_text: str, jd_text: str, detailed_scores: Dict) -> str:
    missing_skills = detailed_scores.get("missing_skills", [])
    matched_skills = detailed_scores.get("matched_skills", [])
    overall = round(float(detailed_scores.get("overall", 0.0)) * 100, 2)
    skills = round(float(detailed_scores.get("skills_coverage", 0.0)) * 100, 2)
    experience = round(float(detailed_scores.get("experience", 0.0)) * 100, 2)
    education = round(float(detailed_scores.get("education", 0.0)) * 100, 2)

    trimmed_resume = resume_text[:5000]
    trimmed_jd = jd_text[:3000]

    return f"""
You are an ATS reviewer. Analyze this resume against the job description and return clear, specific ATS issues.

Output rules:
- Return ONLY valid JSON.
- Schema: {{"issues": ["issue 1", "issue 2", "issue 3"]}}
- 2 to 4 issues.
- Each issue must be one sentence and actionable.
- Focus on gaps relative to this JD, not generic resume advice.
- Mention concrete missing keywords if relevant.

Signals:
- Overall score: {overall}
- Skills coverage: {skills}
- Experience score: {experience}
- Education score: {education}
- Matched skills: {matched_skills}
- Missing skills: {missing_skills}

Job Description:
{trimmed_jd}

Resume Content:
{trimmed_resume}

Job Description Content:
{trimmed_jd}
"""


def generate_ats_issues(resume_text: str, jd_text: str, detailed_scores: Dict) -> Dict:
    """
    Generate ATS issues using an LLM when configured.
    Returns dict with issues and source fields.
    """
    api_key = "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"
    model = "llama-3.1-8b-instant"

    if not api_key or Groq is None:
        return {
            "issues": ["LLM issue generation is unavailable. Configure Groq client and API key."],
            "issues_source": "llm_unavailable"
        }

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict ATS analyst. Return only JSON."
                },
                {
                    "role": "user",
                    "content": _build_prompt(resume_text, jd_text, detailed_scores)
                }
            ]
        )

        content = response.choices[0].message.content if response.choices else ""
        data = _extract_json_payload(content)
        issues = data.get("issues", [])

        if not isinstance(issues, list) or not issues:
            raise ValueError("Invalid issues payload from model")

        cleaned = [str(issue).strip() for issue in issues if str(issue).strip()]
        if not cleaned:
            raise ValueError("Empty issues after cleaning")

        return {
            "issues": cleaned[:4],
            "issues_source": "llm"
        }
    except Exception as exc:
        return {
            "issues": [f"LLM issue generation failed: {str(exc)}"],
            "issues_source": "llm_error"
        }
