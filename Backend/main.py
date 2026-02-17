from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
from parser import extract_text_from_pdf
from preprocess import clean_text
from ranking import final_score
from detailed_scoring import calculate_detailed_score
from typing import List

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Resume Screening API is running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/match")
async def match_resume(resume: UploadFile = File(...), jd: str = Form("")):
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
    jd: str = Form("")
):
    print("\n=== RANK ENDPOINT CALLED ===")
    print(f"Number of resumes: {len(resumes)}")
    print(f"Job Description received (length): {len(jd)}")
    print(f"Job Description (first 100 chars): {jd[:100]}")
    
    results = []
    
    # Clean JD once outside the loop
    clean_jd = clean_text(jd)
    print(f"Cleaned JD (length): {len(clean_jd)}")
    print(f"Cleaned JD (first 100 chars): {clean_jd[:100]}")

    for i, resume in enumerate(resumes):
        print(f"\n--- Processing resume {i+1}: {resume.filename} ---")
        path = f"temp_{resume.filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(resume.file, f)

        text = extract_text_from_pdf(path)
        print(f"Extracted text length: {len(text)}")
        
        clean_resume = clean_text(text)
        print(f"Cleaned resume length: {len(clean_resume)}")
        print(f"Cleaned resume (first 100 chars): {clean_resume[:100]}")

        # Calculate detailed scores
        detailed_scores = calculate_detailed_score(clean_resume, clean_jd)
        
        print(f"Overall score: {detailed_scores['overall']}")
        print(f"Skills: {detailed_scores['skills']}, Experience: {detailed_scores['experience']}, Education: {detailed_scores['education']}")
        print(f"Percentage - Overall: {round(detailed_scores['overall']*100,2)}%")

        results.append({
            "filename": resume.filename,
            "match_score": round(detailed_scores['overall']*100, 2),
            "skills_match": round(detailed_scores['skills']*100, 2),
            "experience_match": round(detailed_scores['experience']*100, 2),
            "education_match": round(detailed_scores['education']*100, 2)
        })

    ranked = sorted(results, key=lambda x: x["match_score"], reverse=True)
    print(f"\n=== Final ranked results: {ranked} ===\n")

    return ranked