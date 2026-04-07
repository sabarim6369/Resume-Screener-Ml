from tfidf_model import tfidf_similarity
from bert_model import semantic_similarity
import re

KNOWN_SKILLS = {
    'python', 'java', 'javascript', 'typescript', 'react', 'node', 'nodejs',
    'nextjs', 'angular', 'vue', 'sql', 'mysql', 'postgresql', 'mongodb',
    'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github',
    'figma', 'photoshop', 'illustrator', 'sketch', 'xd', 'power bi', 'tableau',
    'excel', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit', 'fastapi',
    'flask', 'django', 'spring', 'rest', 'graphql', 'html', 'css'
}


def _extract_required_skills(jd_text):
    jd_lower = f" {jd_text.lower()} "
    found = []

    for skill in sorted(KNOWN_SKILLS, key=len, reverse=True):
        pattern = rf'(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])'
        if re.search(pattern, jd_lower):
            found.append(skill)

    return sorted(set(found))


def _skill_coverage(resume_text, required_skills):
    if not required_skills:
        return 1.0

    resume_lower = f" {resume_text.lower()} "
    matched = 0

    for skill in required_skills:
        pattern = rf'(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])'
        if re.search(pattern, resume_lower):
            matched += 1

    return matched / len(required_skills)

def final_score(resume, jd):
    tfidf = tfidf_similarity(resume, jd)
    semantic = semantic_similarity(resume, jd)
    base_score = 0.4 * tfidf + 0.6 * semantic

    required_skills = _extract_required_skills(jd)
    coverage = _skill_coverage(resume, required_skills)

    if required_skills:
        return base_score * (0.05 + 0.95 * coverage)

    return base_score
