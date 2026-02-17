from fastapi import FastAPI, UploadFile, File
import shutil
from parser import extract_text_from_pdf
from preprocess import clean_text
from ranking import final_score

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
