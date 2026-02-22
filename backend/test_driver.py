from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

path = "/home/rahul/.wdm/drivers/chromedriver/linux64/142.0.7444.175/chromedriver-linux64/chromedriver"

options = Options()
options.add_argument("--headless=new")

driver = webdriver.Chrome(service=Service(path), options=options)

driver.get("https://www.google.com")
print("Title:", driver.title)

driver.quit()