# Web Scraper Status - 11-Prompt

## Problem Identified

### Initial Scraper Issues
- **Original scraper**: Only found 28/~1200 articles
- **Root cause**: hilfe-center.1und1.de is a **Next.js (React) application** with JavaScript-rendered content
- **BeautifulSoup limitation**: Cannot execute JavaScript, so it only sees empty HTML shells

### Discovery
- **Sitemap found**: https://hilfe-center.1und1.de/sitemap.xml
- **Total articles**: **976 URLs** (close to expected ~1200)
- **Content**: Fully client-side rendered, requires headless browser

## Current Solution

### Improved Scraper
**File**: `backend/scraper/helpdesk_scraper.py`

**Features**:
1. ✅ Fetches all article URLs from sitemap.xml (976 articles)
2. ✅ Uses **Playwright + Chromium** for JavaScript rendering
3. ✅ Extracts title and content from rendered pages
4. ✅ Saves to JSON and imports to ChromaDB
5. ✅ Progress tracking (shows every 50th article)
6. ✅ Rate limiting (0.5s delay between requests)

**Dependencies**:
- `playwright==1.40.0` (added to requirements.txt)
- Chromium browser (downloaded via `playwright install chromium`)

## Current Status: Browser Crash Issue

### Error
```
playwright._impl._errors.TargetClosedError: Target page, context or browser has been closed
```

### Likely Cause
- macOS security restrictions with headless Chromium
- Sandboxing issues in headless mode

### What's Working
- ✅ Sitemap parsing (found all 976 URLs)
- ✅ Playwright installation
- ✅ Browser download
- ❌ Browser launch (crashes immediately in headless mode)

## Next Steps (Options)

### Option 1: Debug Playwright (Recommended)
Try running with non-headless mode to debug:
```python
browser = p.chromium.launch(headless=False)  # See browser window
```

### Option 2: Alternative - Selenium
Use Selenium + ChromeDriver instead of Playwright:
```bash
pip install selenium webdriver-manager
```

### Option 3: Test with Smaller Batch
Test scraper with just 10 articles first:
```bash
# Modify scraper to limit to 10 articles for testing
articles = scraper.scrape_all_articles(max_articles=10)
```

### Option 4: External Service
Use a scraping service/API that handles JavaScript:
- ScrapingBee
- Browserless.io
- Apify

## Technical Details

### URL Structure
- **Sitemap**: https://hilfe-center.1und1.de/sitemap.xml
- **Article URLs**: Direct slugs like `/1-und-1-bestell-hotline-oder-kundenservice-anrufen`
- **Content**: Loaded via Next.js JavaScript bundles

### Content Extraction
The scraper looks for content in these selectors (in order):
1. `<main>` tag
2. `<article>` tag
3. `[role="main"]` attribute
4. `.article-content` class
5. Fallback to all `<p>` tags

### Performance
- **Estimated time**: 15-20 minutes for 976 articles
- **Rate**: ~0.5 seconds per article + render time
- **Success rate**: Unknown (crashed before first article)

## Files Changed

### New Files
- `backend/scraper/helpdesk_scraper.py` (rewritten for Playwright)

### Modified Files
- `backend/requirements.txt` (added playwright==1.40.0)

### Database
- ChromaDB collection: `helpdesk_articles`
- Current count: 28 articles (from old scraper)
- Target: 976 articles (from new scraper when working)

## How to Run (When Fixed)

```bash
cd /Users/welf/dev/11-prompt/backend
source venv/bin/activate
python -m scraper.helpdesk_scraper
```

**Output**:
- Progress displayed in terminal
- Articles saved to: `/Users/welf/dev/11-prompt/data/scraped_articles.json`
- Automatically imported to ChromaDB

