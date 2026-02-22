from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
import time


# Hardcoded working chromedriver path
CHROME_DRIVER_PATH = "/home/rahul/.wdm/drivers/chromedriver/linux64/142.0.7444.175/chromedriver-linux64/chromedriver"


def fetch_price_selenium(url):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")

    service = Service(CHROME_DRIVER_PATH)
    driver = webdriver.Chrome(service=service, options=options)

    price = None

    try:
        driver.get(url)
        time.sleep(3)

        # AMAZON
        if "amazon" in url:
            selectors = [".a-price-whole", ".a-price .a-offscreen"]

        # MYNTRA
        elif "myntra" in url:
            selectors = ["span.pdp-price strong", "span.pdp-price"]

        # MEESHO
        elif "meesho" in url:
            selectors = ["h4"]

        else:
            selectors = []

        for sel in selectors:
            try:
                element = driver.find_element(By.CSS_SELECTOR, sel)
                text = element.text
                digits = "".join(filter(str.isdigit, text))
                if digits:
                    price = int(digits)
                    break
            except:
                continue

    except Exception as e:
        print("Selenium error:", e)

    finally:
        driver.quit()

    return price