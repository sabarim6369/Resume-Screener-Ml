from fastapi import FastAPI, UploadFile, File
import shutil
from parser import extract_text_from_pdf
from preprocess import clean_text
from ranking import final_score
from typing import List

app = FastAPI()

@app.post("/match")
async def match_resume(resume: UploadFile = File(...), jd: str = ""):
    with open("temp.pdf", "wb") as f:
        shutil.copyfileobj(resume.file, f)

    resume_text = extract_text_from_pdf("temp.pdf")
    resume_clean = clean_text(resume_text)
    jd_clean = clean_text(jd)

    score = final_score(resume_clean, jd_clean)

    return {"match_score": round(score*100,2)}
@app.post("/rank")
async def rank_resumes(
    resumes: List[UploadFile] = File(...),
    jd: str = ""
):
    results = []

    for resume in resumes:
        path = f"temp_{resume.filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(resume.file, f)

        text = extract_text_from_pdf(path)
        clean_resume = clean_text(text)
        clean_jd = clean_text(jd)

        score = final_score(clean_resume, clean_jd)

        results.append({
            "filename": resume.filename,
            "match_score": round(score*100,2)
        })

    ranked = sorted(results, key=lambda x: x["match_score"], reverse=True)

    return ranked