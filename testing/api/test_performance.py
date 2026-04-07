import io
import time

import pytest


@pytest.mark.performance
def test_multiple_resume_upload_speed(api_client, make_pdf_bytes):
    files = []
    jd = "Need full stack engineer with React and Node"

    for i in range(10):
        content = make_pdf_bytes(f"Candidate {i} React Node.js JavaScript SQL API")
        files.append(("resumes", (f"perf_{i}.pdf", io.BytesIO(content), "application/pdf")))

    start = time.perf_counter()
    response = api_client.rank(files=files, jd=jd)
    elapsed = time.perf_counter() - start

    assert response.status_code == 200
    assert elapsed < 30, f"Upload+rank took too long: {elapsed:.2f}s"


@pytest.mark.performance
def test_api_response_time_for_single_resume(api_client, valid_resume_file):
    jd = "Need Python FastAPI developer"

    start = time.perf_counter()
    response = api_client.rank(files=[("resumes", valid_resume_file)], jd=jd)
    elapsed = time.perf_counter() - start

    assert response.status_code == 200
    assert elapsed < 10, f"Single resume API response too slow: {elapsed:.2f}s"
