# Web crawler for extracting UI elements

from playwright.sync_api import sync_playwright
from features.forced_continuity import detect_forced_continuity

def crawl_page(url: str):
    elements = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=60000)
        page.wait_for_load_state("networkidle")

        # -------- BUTTONS --------
        button_locator = page.locator("button")
        for i in range(button_locator.count()):
            btn = button_locator.nth(i)
            elements.append({
                "type": "button",
                "text": btn.inner_text().strip(),
                "visible": btn.is_visible(),
                "attributes": {
                    "id": btn.get_attribute("id"),
                    "class": btn.get_attribute("class")
                }
            })

        # -------- LINKS --------
        link_locator = page.locator("a")
        for i in range(link_locator.count()):
            link = link_locator.nth(i)
            elements.append({
                "type": "link",
                "text": link.inner_text().strip(),
                "visible": link.is_visible(),
                "attributes": {
                    "href": link.get_attribute("href")
                }
            })

        # -------- INPUTS --------
        input_locator = page.locator("input")
        for i in range(input_locator.count()):
            inp = input_locator.nth(i)
            elements.append({
                "type": "input",
                "visible": inp.is_visible(),
                "attributes": {
                    "type": inp.get_attribute("type"),
                    "name": inp.get_attribute("name")
                }
            })

        browser.close()

    return elements


if __name__ == "__main__":
    data = crawl_page("https://example.com")
    for el in data:
        print(el)
    
    print("\n--- Forced Continuity Analysis ---")
    result = detect_forced_continuity(data)
    print(result)