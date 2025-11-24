"""
Simple Playwright test to diagnose browser launch issues
"""
from playwright.sync_api import sync_playwright

print("Testing Playwright browser launch...")

try:
    with sync_playwright() as p:
        print("1. Launching browser...")
        browser = p.chromium.launch(headless=True)

        print("2. Creating context...")
        context = browser.new_context()

        print("3. Creating page...")
        page = context.new_page()

        print("4. Navigating to test page...")
        page.goto("https://example.com")

        print("5. Getting title...")
        title = page.title()
        print(f"   ✅ Success! Page title: {title}")

        page.close()
        context.close()
        browser.close()

        print("\n✅ Playwright is working correctly!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nTrying with headless=False...")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context()
            page = context.new_page()
            page.goto("https://example.com")
            title = page.title()
            print(f"✅ Non-headless mode works! Title: {title}")
            page.close()
            context.close()
            browser.close()
    except Exception as e2:
        print(f"❌ Non-headless also failed: {e2}")
