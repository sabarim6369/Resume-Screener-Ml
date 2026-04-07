import io

import pytest


@pytest.mark.boundary
def test_large_file_size(api_client, make_pdf_bytes):
    repeated = "Python React SQL AWS " * 5000
    large_pdf = make_pdf_bytes(repeated)
    large_file = ("large_resume.pdf", io.BytesIO(large_pdf), "application/pdf")

    response = api_client.rank(files=[("resumes", large_file)], jd="Need Python and React")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.boundary
def test_max_number_of_resumes(api_client, make_pdf_bytes):
    jd = "Need backend Python engineer"
    files = []

    # Boundary target: 20 resumes in one request
    for i in range(20):
        content = make_pdf_bytes(f"Candidate {i} Python FastAPI SQL experience")
        files.append(("resumes", (f"candidate_{i}.pdf", io.BytesIO(content), "application/pdf")))

    response = api_client.rank(files=files, jd=jd)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 20
