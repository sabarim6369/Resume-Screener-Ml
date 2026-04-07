import io
import os
import time
from dataclasses import dataclass

import fitz
import pytest
import requests


@dataclass
class ApiClient:
    base_url: str

    def rank(self, files, jd):
        payload = {"jd": jd}
        return requests.post(f"{self.base_url}/rank", files=files, data=payload, timeout=120)

    def match(self, file_tuple, jd):
        payload = {"jd": jd}
        files = {"resume": file_tuple}
        return requests.post(f"{self.base_url}/match", files=files, data=payload, timeout=120)


@pytest.fixture(scope="session")
def api_base_url():
    return os.getenv("TEST_API_BASE_URL", "http://127.0.0.1:8000")


@pytest.fixture(scope="session")
def ui_base_url():
    return os.getenv("TEST_UI_BASE_URL", "http://127.0.0.1:5173")


@pytest.fixture(scope="session")
def api_client(api_base_url):
    return ApiClient(base_url=api_base_url)


@pytest.fixture(scope="session", autouse=True)
def wait_for_backend(api_base_url):
    deadline = time.time() + 25
    while time.time() < deadline:
        try:
            res = requests.get(f"{api_base_url}/health", timeout=2)
            if res.ok:
                return
        except requests.RequestException:
            pass
        time.sleep(1)
    pytest.skip(f"Backend not reachable at {api_base_url}")


@pytest.fixture
def make_pdf_bytes():
    def _make_pdf(text):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), text)
        raw = doc.tobytes()
        doc.close()
        return raw

    return _make_pdf


@pytest.fixture
def valid_resume_file(make_pdf_bytes):
    content = make_pdf_bytes(
        "John Doe Full Stack Developer Experience 3 years React Node.js SQL AWS Bachelor Computer Science"
    )
    return ("resume_john.pdf", io.BytesIO(content), "application/pdf")


@pytest.fixture
def designer_resume_file(make_pdf_bytes):
    content = make_pdf_bytes(
        "Jane Designer UI UX portfolio Adobe Photoshop Illustrator Bachelor Design"
    )
    return ("resume_designer.pdf", io.BytesIO(content), "application/pdf")


@pytest.fixture
def invalid_file_tuple():
    return ("malware.exe", io.BytesIO(b"MZ...not a resume"), "application/octet-stream")


@pytest.fixture
def corrupted_pdf_tuple():
    return ("corrupted.pdf", io.BytesIO(b"%PDF-1.4\nTHIS_IS_NOT_VALID_PDF"), "application/pdf")
