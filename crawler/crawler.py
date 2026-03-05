# Web crawler for extracting UI elements

from playwright.sync_api import sync_playwright
from features.forced_continuity import detect_forced_continuity

def crawl_page(url: str):
    elements = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=60000, wait_until="domcontentloaded")

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
        
        # -------- TEXT CONTENT (Headings + Paragraphs) --------
        text_locator = page.locator("h1, h2, h3, p")

        for i in range(text_locator.count()):
            block = text_locator.nth(i)

            elements.append({
                "type": "text",
                "text": block.inner_text().strip(),
                "visible": block.is_visible(),
                "attributes": {}
            })

        browser.close()

    return elements

if __name__ == "__main__":
    url = input("Enter website URL to analyze: ")
    data = crawl_page(url)

    result = detect_forced_continuity(data, url)

    print("\n" + "="*52)
    print("        DARK PATTERN DETECTION REPORT")
    print("="*52)

    print(f"\nURL: {url}")
    print(f"Page Type: {result.get('page_type', 'Unknown')}")

    print("\nPattern:", result["pattern"])
    print(f"Risk Score: {result['risk_score_raw']} / {result['max_score']}")
    print(f"Risk Percentage: {result['risk_percentage']}%")
    print(f"Severity: {result['severity'].upper()}")

    print("\nSignals Triggered:")
    for signal, active in result["signals"].items():
        if active:
            print(f"✓ {signal.replace('_', ' ').title()}")

    print("\nCTA Metrics:")
    print(f"- Subscription CTAs: {result['cta_metrics']['subscription_cta_count']}")
    print(f"- Cancel CTAs: {result['cta_metrics']['cancel_cta_count']}")

    print("\nReasons:")
    for reason in result["reasons"]:
        print(f"- {reason}")

    print("\nConclusion:")
    if result["risk_score_raw"] == 0:
        print("No forced continuity detected.")
    elif result["severity"] in ["High", "Critical"]:
        print("High likelihood of forced continuity pattern.")
    else:
        print("Potential friction in cancellation flow.")

    print("="*52)