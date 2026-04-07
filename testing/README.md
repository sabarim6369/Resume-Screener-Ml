# Testing Suite

This folder contains a complete testing setup for the Resume Screener project.

## Covers

1. Functional Testing
- Resume upload works
- JD input works
- Ranking output order is correct

2. Negative Testing
- Empty JD
- Invalid file format
- Corrupted PDF

3. Boundary Testing
- Large file size
- Max number of resumes per request

4. Performance Testing
- Multiple resume upload speed
- API response time

5. UI Testing
- Key dashboard buttons visible/working
- Responsive layout smoke test on mobile viewport

## Folder Structure

- `api/test_functional.py`
- `api/test_negative.py`
- `api/test_boundary.py`
- `api/test_performance.py`
- `ui/test_ui_dashboard.py`
- `conftest.py`
- `pytest.ini`
- `requirements.txt`

## Prerequisites

- Backend running on `http://127.0.0.1:8000`
- Frontend running on `http://127.0.0.1:5173`

You can override URLs with environment variables:

- `TEST_API_BASE_URL`
- `TEST_UI_BASE_URL`

## Install

```powershell
cd testing
python -m pip install -r requirements.txt
python -m playwright install chromium
```

## Run all tests

```powershell
cd testing
pytest
```

## Run by category

```powershell
pytest -m functional
pytest -m negative
pytest -m boundary
pytest -m performance
pytest -m ui
```

## Notes

- Negative tests for invalid/corrupted files currently expect HTTP error responses.
- Empty JD test reflects current backend behavior (accepted input).
- Performance thresholds are practical defaults and can be tuned for your machine.
