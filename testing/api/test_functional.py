import io

import pytest


@pytest.mark.functional
def test_resume_upload_and_jd_input_work(api_client, valid_resume_file):
    jd = "Need Full Stack Developer with React, Node.js, SQL and 2+ years experience"
    files = [("resumes", valid_resume_file)]

    response = api_client.rank(files=files, jd=jd)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["filename"] == "resume_john.pdf"


@pytest.mark.functional
def test_ranking_output_sorted_descending(api_client, valid_resume_file, designer_resume_file):
    jd = "Looking for Full Stack engineer with React Node SQL AWS and software development experience"

    files = [
        ("resumes", valid_resume_file),
        ("resumes", designer_resume_file),
    ]

    response = api_client.rank(files=files, jd=jd)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    scores = [item["match_score"] for item in data]
    assert scores == sorted(scores, reverse=True)
    assert data[0]["filename"] == "resume_john.pdf"


@pytest.mark.functional
def test_single_match_endpoint_returns_score(api_client, valid_resume_file):
    jd = "Need React and Node developer"

    response = api_client.match(file_tuple=valid_resume_file, jd=jd)

    assert response.status_code == 200
    payload = response.json()
    assert "match_score" in payload
    assert isinstance(payload["match_score"], (int, float))
    assert 0 <= payload["match_score"] <= 100
