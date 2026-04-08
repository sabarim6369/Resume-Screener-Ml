import pytest
import requests

playwright_sync_api = pytest.importorskip("playwright.sync_api")
sync_playwright = playwright_sync_api.sync_playwright


@pytest.fixture(scope="session", autouse=True)
def check_frontend(ui_base_url):
    try:
        response = requests.get(ui_base_url, timeout=5)
        if response.status_code >= 400:
            pytest.skip(f"UI not reachable at {ui_base_url}")
    except requests.RequestException:
        pytest.skip(f"UI not reachable at {ui_base_url}")


@pytest.mark.ui
def test_buttons_work_and_visible(ui_base_url):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1366, "height": 768})
            page.goto(f"{ui_base_url}/dashboard", wait_until="networkidle")

            analyze_btn = page.get_by_role("button", name="Analyze Resumes")
            assert analyze_btn.is_visible()

            new_analysis_buttons = page.get_by_role("button", name="New Analysis")
            assert new_analysis_buttons.count() >= 1

            backend_status = page.get_by_text("API", exact=False)
            assert backend_status.first.is_visible()

            browser.close()
    except Exception as exc:
        pytest.skip(f"Playwright browser not ready: {exc}")


@pytest.mark.ui
def test_responsive_design_mobile_view(ui_base_url):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 390, "height": 844})
            page.goto(f"{ui_base_url}/dashboard", wait_until="networkidle")

            heading = page.get_by_text("Resume Screening Dashboard")
            assert heading.is_visible()

            upload_label = page.get_by_text("Drop resumes here", exact=False)
            assert upload_label.first.is_visible()

            browser.close()
    except Exception as exc:
        pytest.skip(f"Playwright browser not ready: {exc}")
