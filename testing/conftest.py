import io
import os
import time
from dataclasses import dataclass

import pytest
import requests


def _is_url_reachable(url: str, timeout: int = 3) -> bool:
    try:
        res = requests.get(url, timeout=timeout)
        return res.status_code < 500
    except requests.RequestException:
        return False


def _escape_pdf_text(text):
    return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _build_simple_pdf_bytes(text):
    safe_text = _escape_pdf_text(text)
    content_stream = f"BT /F1 12 Tf 72 720 Td ({safe_text}) Tj ET"

    objects = []
    objects.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    objects.append("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n")
    objects.append(
        "3 0 obj\n"
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n"
        "endobj\n"
    )
    objects.append("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    objects.append(
        f"5 0 obj\n<< /Length {len(content_stream.encode('latin-1', errors='ignore'))} >>\n"
        f"stream\n{content_stream}\nendstream\nendobj\n"
    )

    header = "%PDF-1.4\n"
    body = ""
    offsets = [0]
    current = len(header.encode("latin-1"))

    for obj in objects:
        offsets.append(current)
        body += obj
        current += len(obj.encode("latin-1"))

    xref_start = len((header + body).encode("latin-1"))
    xref = ["xref\n0 6\n", "0000000000 65535 f \n"]
    for i in range(1, 6):
        xref.append(f"{offsets[i]:010d} 00000 n \n")

    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n"
    pdf_str = header + body + "".join(xref) + trailer
    return pdf_str.encode("latin-1", errors="ignore")


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
    configured = os.getenv("TEST_UI_BASE_URL")
    if configured:
        return configured

    candidates = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    for candidate in candidates:
        if _is_url_reachable(candidate):
            return candidate

    # Keep a sensible default for skip messaging in UI tests.
    return "http://localhost:5173"


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
        try:
            import fitz

            doc = fitz.open()
            page = doc.new_page()
            page.insert_text((72, 72), text)
            raw = doc.tobytes()
            doc.close()
            return raw
        except ModuleNotFoundError:
            return _build_simple_pdf_bytes(text)

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
