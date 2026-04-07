"""
Detailed scoring module for breaking down resume matches into 
skills, experience, and education components.
"""

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

EXPERIENCE_TERMS = {
    'experience', 'intern', 'project', 'develop', 'build', 'implement', 'design',
    'deploy', 'maintain', 'lead', 'architecture', 'api', 'microservice', 'agile',
    'scrum', 'frontend', 'backend', 'fullstack', 'testing', 'ci', 'cd'
}

EDUCATION_FIELDS = {
    'computer science', 'information technology', 'engineering', 'software',
    'data science', 'artificial intelligence', 'machine learning', 'design',
    'ui', 'ux', 'human computer interaction', 'hci', 'it'
}

DEGREE_LEVELS = {
    'phd': 4,
    'doctorate': 4,
    'master': 3,
    'mtech': 3,
    'mca': 3,
    'mba': 3,
    'bachelor': 2,
    'btech': 2,
    'be': 2,
    'bca': 2,
    'diploma': 1
}


def safe_tfidf_similarity(text1, text2):
    if not text1.strip() or not text2.strip():
        return 0.0
    try:
        return tfidf_similarity(text1, text2)
    except ValueError:
        return 0.0


def safe_semantic_similarity(text1, text2):
    if not text1.strip() or not text2.strip():
        return 0.0
    return semantic_similarity(text1, text2)


def extract_required_skills(jd_text):
    """Extract explicit skill terms from the JD text."""
    jd_lower = f" {jd_text.lower()} "
    found = []

    for skill in sorted(KNOWN_SKILLS, key=len, reverse=True):
        pattern = rf'(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])'
        if re.search(pattern, jd_lower):
            found.append(skill)

    return sorted(set(found))


def calculate_skill_coverage(resume_text, required_skills):
    """Measure how many required JD skills appear in the resume text."""
    if not required_skills:
        return 1.0, [], []

    resume_lower = f" {resume_text.lower()} "
    matched = []

    for skill in required_skills:
        pattern = rf'(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])'
        if re.search(pattern, resume_lower):
            matched.append(skill)

    missing = [skill for skill in required_skills if skill not in matched]
    coverage = len(matched) / len(required_skills)
    return coverage, matched, missing


def extract_required_years(jd_text):
    """Extract the required minimum years of experience from JD."""
    jd_lower = jd_text.lower()
    candidates = []

    range_matches = re.findall(r'(\d+)\s*[-to]{1,3}\s*(\d+)\s*\+?\s*(?:year|years|yr|yrs)', jd_lower)
    for low, high in range_matches:
        candidates.append(float(low))

    single_matches = re.findall(r'(?:minimum|min|at least|required|require)\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:year|years|yr|yrs)', jd_lower)
    for value in single_matches:
        candidates.append(float(value))

    generic_matches = re.findall(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:year|years|yr|yrs)', jd_lower)
    for value in generic_matches:
        candidates.append(float(value))

    if not candidates:
        return None

    return max(0.0, min(candidates))


def extract_resume_years(resume_text):
    """Extract the strongest experience duration signal from resume text."""
    resume_lower = resume_text.lower()
    candidates = []

    range_matches = re.findall(r'(\d+(?:\.\d+)?)\s*[-to]{1,3}\s*(\d+(?:\.\d+)?)\s*(?:year|years|yr|yrs)', resume_lower)
    for low, high in range_matches:
        candidates.append(float(high))

    single_matches = re.findall(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:year|years|yr|yrs)', resume_lower)
    for value in single_matches:
        candidates.append(float(value))

    if not candidates:
        return 0.0

    return max(0.0, min(max(candidates), 40.0))


def term_coverage_score(jd_text, resume_text, term_pool):
    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()

    jd_terms = []
    for term in term_pool:
        pattern = rf'(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])'
        if re.search(pattern, jd_lower):
            jd_terms.append(term)

    if not jd_terms:
        return 1.0

    matched = 0
    for term in jd_terms:
        pattern = rf'(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])'
        if re.search(pattern, resume_lower):
            matched += 1

    return matched / len(jd_terms)


def extract_degree_level(text):
    text_lower = text.lower()
    best = 0

    for degree, level in DEGREE_LEVELS.items():
        pattern = rf'(?<![a-z0-9]){re.escape(degree)}(?![a-z0-9])'
        if re.search(pattern, text_lower):
            best = max(best, level)

    return best


def education_field_coverage(jd_text, resume_text):
    return term_coverage_score(jd_text, resume_text, EDUCATION_FIELDS)

def extract_skills_section(text):
    """Extract skills-related content from text"""
    skills_keywords = ['skills', 'technologies', 'technical skills', 'tools', 'programming languages', 
                      'frameworks', 'libraries', 'proficient', 'experienced in']
    
    text_lower = text.lower()
    skills_content = []
    
    # Find skills section
    for keyword in skills_keywords:
        if keyword in text_lower:
            # Get surrounding context (200 chars after keyword)
            idx = text_lower.find(keyword)
            skills_content.append(text[idx:idx+500])
    
    # Also look for common tech terms
    tech_terms = ['python', 'javascript', 'java', 'react', 'node', 'sql', 'mongodb', 
                 'aws', 'docker', 'git', 'api', 'html', 'css', 'typescript', 'nextjs',
                 'express', 'fastapi', 'spring', 'django', 'flask', 'postgresql', 
                 'mysql', 'redis', 'kubernetes', 'angular', 'vue']
    
    for term in tech_terms:
        if term in text_lower:
            skills_content.append(term)
    
    return ' '.join(skills_content) if skills_content else ''


def extract_experience_section(text):
    """Extract experience-related content from text"""
    experience_keywords = ['experience', 'work experience', 'employment', 'intern', 'project',
                          'developed', 'built', 'implemented', 'created', 'designed', 'worked on',
                          'responsibilities', 'achievements', 'role', 'position']
    
    text_lower = text.lower()
    experience_content = []
    
    for keyword in experience_keywords:
        if keyword in text_lower:
            idx = text_lower.find(keyword)
            experience_content.append(text[idx:idx+500])
    
    # Look for year patterns (experience duration)
    year_patterns = re.findall(r'\d{4}|\d+\s*(?:year|yr|month|mo)', text_lower)
    if year_patterns:
        experience_content.extend(year_patterns)
    
    return ' '.join(experience_content) if experience_content else ''


def extract_education_section(text):
    """Extract education-related content from text"""
    education_keywords = ['education', 'degree', 'bachelor', 'master', 'phd', 'diploma',
                         'university', 'college', 'institute', 'school', 'gpa', 'cgpa',
                         'b.tech', 'b.e', 'm.tech', 'm.e', 'mca', 'bca', 'computer science',
                         'engineering', 'cse', 'it', 'information technology']
    
    text_lower = text.lower()
    education_content = []
    
    for keyword in education_keywords:
        if keyword in text_lower:
            idx = text_lower.find(keyword)
            education_content.append(text[idx:idx+400])
    
    return ' '.join(education_content) if education_content else ''


def calculate_detailed_score(resume_text, jd_text):
    """
    Calculate detailed scores for skills, experience, and education.
    Returns a dictionary with overall score and breakdowns.
    """
    
    # Extract sections from resume
    resume_skills = extract_skills_section(resume_text)
    resume_experience = extract_experience_section(resume_text)
    resume_education = extract_education_section(resume_text)
    
    # Extract sections from job description
    jd_skills = extract_skills_section(jd_text)
    jd_experience = extract_experience_section(jd_text)
    jd_education = extract_education_section(jd_text)
    
    # Calculate skills quality + strict required-skill coverage.
    skills_tfidf = safe_tfidf_similarity(resume_skills, jd_skills)
    skills_bert = safe_semantic_similarity(resume_skills, jd_skills)

    required_skills = extract_required_skills(jd_text)
    skills_coverage, matched_skills, missing_skills = calculate_skill_coverage(resume_text, required_skills)
    skills_quality_score = (0.35 * skills_tfidf) + (0.65 * skills_bert)

    # If JD has explicit skills, skills score is strict coverage.
    # This ensures missing must-have skills show as 0.
    skills_score = skills_coverage if required_skills else skills_quality_score
    
    # Calculate experience match with years + term coverage.
    exp_tfidf = safe_tfidf_similarity(resume_experience, jd_experience)
    exp_bert = safe_semantic_similarity(resume_experience, jd_experience)
    required_years = extract_required_years(jd_text)
    resume_years = extract_resume_years(resume_text)
    experience_term_score = term_coverage_score(jd_text, resume_text, EXPERIENCE_TERMS)

    if required_years is not None:
        years_score = min(resume_years / required_years, 1.0) if required_years > 0 else 1.0
        experience_score = (0.30 * exp_tfidf) + (0.30 * exp_bert) + (0.30 * years_score) + (0.10 * experience_term_score)
    else:
        years_score = 1.0
        experience_score = (0.40 * exp_tfidf) + (0.40 * exp_bert) + (0.20 * experience_term_score)
    
    # Calculate education match with degree and field requirement checks.
    edu_tfidf = safe_tfidf_similarity(resume_education, jd_education)
    edu_bert = safe_semantic_similarity(resume_education, jd_education)
    jd_degree_level = extract_degree_level(jd_text)
    resume_degree_level = extract_degree_level(resume_text)
    field_score = education_field_coverage(jd_text, resume_text)

    if jd_degree_level > 0:
        if resume_degree_level >= jd_degree_level:
            degree_score = 1.0
        elif resume_degree_level == 0:
            degree_score = 0.0
        else:
            degree_score = max(0.0, 1.0 - (0.35 * (jd_degree_level - resume_degree_level)))
        education_score = (0.25 * edu_tfidf) + (0.25 * edu_bert) + (0.35 * degree_score) + (0.15 * field_score)
    else:
        degree_score = 1.0
        education_score = (0.40 * edu_tfidf) + (0.40 * edu_bert) + (0.20 * field_score)
    
    # Calculate overall score (weighted average)
    # Skills: 50%, Experience: 30%, Education: 20%
    base_overall_score = (0.5 * skills_score) + (0.3 * experience_score) + (0.2 * education_score)

    # Strongly penalize resumes that miss explicit JD skills.
    # Example: if JD asks for "figma" and resume does not contain it,
    # this gate prevents inflated scores from generic semantic similarity.
    if required_skills:
        coverage_gate = 0.05 + (0.95 * skills_coverage)
        overall_score = base_overall_score * coverage_gate
    else:
        overall_score = base_overall_score
    
    return {
        'overall': overall_score,
        'skills': skills_score,
        'skills_quality': skills_quality_score,
        'experience': experience_score,
        'education': education_score,
        'skills_coverage': skills_coverage,
        'required_years': required_years,
        'resume_years': resume_years,
        'years_match': years_score,
        'education_degree_match': degree_score,
        'education_field_match': field_score,
        'required_skills': required_skills,
        'matched_skills': matched_skills,
        'missing_skills': missing_skills
    }
