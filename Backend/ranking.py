from tfidf_model import tfidf_similarity
from bert_model import semantic_similarity

def final_score(resume, jd):
    tfidf = tfidf_similarity(resume, jd)
    semantic = semantic_similarity(resume, jd)
    return 0.4*tfidf + 0.6*semantic
