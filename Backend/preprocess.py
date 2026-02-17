import spacy

nlp = spacy.load("en_core_web_sm")

def clean_text(text):
    doc = nlp(text.lower())
    tokens = [t.lemma_ for t in doc if not t.is_stop and t.is_alpha]
    return " ".join(tokens)
