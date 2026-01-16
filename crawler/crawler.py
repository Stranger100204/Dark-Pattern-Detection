# Web crawler for extracting UI elements

from playwright.sync_api import sync_playwright

def crawl_page(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=60000)

        # Wait for page to load
        page.wait_for_load_state("networkidle")

        # Extract buttons
        buttons = page.locator("button").all_text_contents()

        # Extract links
        links = page.locator("a").all_text_contents()

        # Extract input fields
        inputs = page.locator("input").count()

        browser.close()

        print(f"URL: {url}")
        print("\nButtons found:")
        for b in buttons:
            if b.strip():
                print("-", b.strip())

        print("\nLinks found:")
        for l in links:
            if l.strip():
                print("-", l.strip())

        print(f"\nNumber of input fields: {inputs}")


if __name__ == "__main__":
    crawl_page("https://example.com")