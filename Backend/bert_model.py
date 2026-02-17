from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

def semantic_similarity(text1, text2):
    emb = model.encode([text1, text2])
    return cosine_similarity([emb[0]], [emb[1]])[0][0]
