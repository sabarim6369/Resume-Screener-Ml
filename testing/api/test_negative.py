import pytest


@pytest.mark.negative
def test_empty_jd(api_client, valid_resume_file):
    files = [("resumes", valid_resume_file)]

    response = api_client.rank(files=files, jd="")

    # Current backend accepts empty JD and should still return valid structure.
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert "match_score" in data[0]


@pytest.mark.negative
def test_invalid_file_format(api_client, invalid_file_tuple):
    files = [("resumes", invalid_file_tuple)]
    jd = "Need Python Developer"

    response = api_client.rank(files=files, jd=jd)

    # Parser currently only supports real PDFs, so invalid binary should fail.
    assert response.status_code >= 400


@pytest.mark.negative
def test_corrupted_pdf(api_client, corrupted_pdf_tuple):
    files = [("resumes", corrupted_pdf_tuple)]
    jd = "Need Java Developer"

    response = api_client.rank(files=files, jd=jd)

    assert response.status_code >= 400
