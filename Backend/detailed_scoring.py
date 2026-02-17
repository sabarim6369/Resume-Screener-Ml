"""
Detailed scoring module for breaking down resume matches into 
skills, experience, and education components.
"""

from tfidf_model import tfidf_similarity
from bert_model import semantic_similarity
import re

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
    
    return ' '.join(skills_content) if skills_content else text[:300]


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
    
    return ' '.join(experience_content) if experience_content else text[:300]


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
    
    return ' '.join(education_content) if education_content else text[:200]


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
    
    # Calculate skills match (40% TF-IDF + 60% BERT)
    skills_tfidf = tfidf_similarity(resume_skills, jd_skills)
    skills_bert = semantic_similarity(resume_skills, jd_skills)
    skills_score = 0.4 * skills_tfidf + 0.6 * skills_bert
    
    # Calculate experience match
    exp_tfidf = tfidf_similarity(resume_experience, jd_experience)
    exp_bert = semantic_similarity(resume_experience, jd_experience)
    experience_score = 0.4 * exp_tfidf + 0.6 * exp_bert
    
    # Calculate education match
    edu_tfidf = tfidf_similarity(resume_education, jd_education)
    edu_bert = semantic_similarity(resume_education, jd_education)
    education_score = 0.4 * edu_tfidf + 0.6 * edu_bert
    
    # Calculate overall score (weighted average)
    # Skills: 50%, Experience: 30%, Education: 20%
    overall_score = (0.5 * skills_score) + (0.3 * experience_score) + (0.2 * education_score)
    
    return {
        'overall': overall_score,
        'skills': skills_score,
        'experience': experience_score,
        'education': education_score
    }
