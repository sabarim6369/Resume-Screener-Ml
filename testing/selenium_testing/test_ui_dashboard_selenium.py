import pytest
import requests

webdriver = pytest.importorskip("selenium.webdriver")
By = pytest.importorskip("selenium.webdriver.common.by").By
WebDriverWait = pytest.importorskip("selenium.webdriver.support.ui").WebDriverWait
expected_conditions = pytest.importorskip("selenium.webdriver.support.expected_conditions")
Options = pytest.importorskip("selenium.webdriver.chrome.options").Options
Service = pytest.importorskip("selenium.webdriver.chrome.service").Service
ChromeDriverManager = pytest.importorskip("webdriver_manager.chrome").ChromeDriverManager


@pytest.fixture(scope="session", autouse=True)
def check_frontend(ui_base_url):
    try:
        response = requests.get(ui_base_url, timeout=5)
        if response.status_code >= 400:
            pytest.skip(
                f"UI not reachable at {ui_base_url}. "
                "Set TEST_UI_BASE_URL to your running frontend URL."
            )
    except requests.RequestException:
        pytest.skip(
            f"UI not reachable at {ui_base_url}. "
            "Set TEST_UI_BASE_URL to your running frontend URL."
        )


@pytest.fixture
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1366,768")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    try:
        service = Service(ChromeDriverManager().install())
        browser = webdriver.Chrome(service=service, options=chrome_options)
    except Exception as exc:
        pytest.skip(f"Selenium Chrome driver not ready: {exc}")

    yield browser
    browser.quit()


@pytest.mark.selenium
@pytest.mark.ui
def test_dashboard_primary_elements_visible(driver, ui_base_url):
    driver.get(f"{ui_base_url}/dashboard")
    wait = WebDriverWait(driver, 15)

    wait.until(expected_conditions.presence_of_element_located((By.TAG_NAME, "body")))

    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Resume Screening Dashboard" in page_text

    analyze_button = wait.until(
        expected_conditions.presence_of_element_located(
            (By.XPATH, "//button[contains(., 'Analyze Resumes')]")
        )
    )
    assert analyze_button.is_displayed()

    new_analysis_button = wait.until(
        expected_conditions.presence_of_element_located(
            (By.XPATH, "//button[contains(., 'New Analysis')]")
        )
    )
    assert new_analysis_button.is_displayed()


@pytest.mark.selenium
@pytest.mark.ui
def test_dashboard_mobile_smoke(ui_base_url):
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=390,844")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    try:
        service = Service(ChromeDriverManager().install())
        browser = webdriver.Chrome(service=service, options=chrome_options)
    except Exception as exc:
        pytest.skip(f"Selenium Chrome driver not ready: {exc}")

    try:
        browser.get(f"{ui_base_url}/dashboard")
        wait = WebDriverWait(browser, 15)
        body = wait.until(
            expected_conditions.presence_of_element_located((By.TAG_NAME, "body"))
        )
        assert body.is_displayed()

        body_text = body.text
        assert "Resume Screening Dashboard" in body_text
        assert "Drop resumes here" in body_text
    finally:
        browser.quit()
