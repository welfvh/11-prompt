"""
Web scraper for hilfe-center.1und1.de
Extracts help articles from sitemap and uses Playwright for JavaScript-rendered content.
"""
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import time
from pathlib import Path
import hashlib
import json
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


class HelpdeskScraper:
    """Scraper for 1&1 help center articles"""

    def __init__(self, base_url: str = "https://hilfe-center.1und1.de"):
        self.base_url = base_url
        self.sitemap_url = f"{base_url}/sitemap.xml"
        self.articles = []

    def get_article_urls_from_sitemap(self) -> List[str]:
        """
        Fetch all article URLs from the sitemap.xml

        Returns:
            List of article URLs
        """
        print(f"Fetching sitemap from: {self.sitemap_url}")

        try:
            response = requests.get(self.sitemap_url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'xml')
            urls = [loc.text for loc in soup.find_all('loc')]

            print(f"Found {len(urls)} URLs in sitemap")
            return urls

        except Exception as e:
            print(f"Error fetching sitemap: {e}")
            return []

    def scrape_article_with_playwright(self, url: str, page) -> Optional[Dict[str, Any]]:
        """
        Scrape a single help article using Playwright for JavaScript rendering.

        Args:
            url: URL of the article to scrape
            page: Playwright page object (reused for efficiency)

        Returns:
            Dictionary with article content and metadata
        """
        try:
            # Navigate to the page
            page.goto(url, wait_until="domcontentloaded", timeout=30000)

            # Wait a bit for JavaScript to load content
            time.sleep(1)

            # Get the rendered HTML
            html = page.content()
            soup = BeautifulSoup(html, 'lxml')

            # Extract title
            title = self._extract_title(soup)

            # Extract main content
            content = self._extract_content(soup)

            if not content or len(content) < 100:
                print(f"  ⚠️  Skipped (insufficient content): {url}")
                return None

            # Generate unique ID
            article_id = hashlib.md5(url.encode()).hexdigest()

            article = {
                'id': article_id,
                'url': url,
                'title': title,
                'content': content,
                'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }

            return article

        except PlaywrightTimeoutError:
            print(f"  ⚠️  Timeout: {url}")
            return None
        except Exception as e:
            print(f"  ❌ Error scraping {url}: {e}")
            return None

    def _extract_title(self, soup: BeautifulSoup) -> str:
        """Extract article title from page"""
        # Try different title selectors for Next.js rendered page
        title_selectors = [
            'h1',
            '[data-testid="title"]',
            '.article-title',
            '.page-title',
            'title'
        ]

        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem and title_elem.get_text(strip=True):
                return title_elem.get_text(strip=True)

        return "Untitled Article"

    def _extract_content(self, soup: BeautifulSoup) -> str:
        """Extract main article content from page"""
        # Try different content selectors for Next.js rendered page
        content_selectors = [
            'main',
            'article',
            '[role="main"]',
            '.article-content',
            '.help-article',
            '.content',
        ]

        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                # Remove script, style, nav, footer elements
                for unwanted in content_elem(['script', 'style', 'nav', 'footer', 'header']):
                    unwanted.decompose()

                # Get text with preserved structure
                text = content_elem.get_text(separator='\n', strip=True)

                # Clean up excessive whitespace
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                return '\n'.join(lines)

        # Fallback: get all paragraph text
        paragraphs = soup.find_all('p')
        if paragraphs:
            text = '\n\n'.join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
            if len(text) > 100:
                return text

        return ""

    def scrape_all_articles(self, max_articles: int = None) -> List[Dict[str, Any]]:
        """
        Scrape multiple articles using Playwright.

        Args:
            max_articles: Maximum number of articles to scrape (None = all)

        Returns:
            List of article dictionaries
        """
        # Get URLs from sitemap
        urls = self.get_article_urls_from_sitemap()

        if not urls:
            print("No URLs found in sitemap")
            return []

        if max_articles:
            urls = urls[:max_articles]
            print(f"Limiting to first {max_articles} articles")

        articles = []

        print(f"\nStarting to scrape {len(urls)} articles with Playwright...")
        print("This may take 15-20 minutes for all articles.\n")

        # Use Playwright to scrape all articles
        with sync_playwright() as p:
            # Launch browser (using Firefox for better macOS compatibility)
            browser = p.firefox.launch(
                headless=True
            )
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()

            # Increase default timeout
            page.set_default_timeout(30000)

            try:
                for i, url in enumerate(urls, 1):
                    if i % 50 == 0:
                        print(f"Progress: {i}/{len(urls)} articles scraped ({len(articles)} successful)")

                    print(f"[{i}/{len(urls)}] Scraping: {url}")

                    article = self.scrape_article_with_playwright(url, page)

                    if article:
                        articles.append(article)

                    # Rate limiting (be nice to the server)
                    time.sleep(0.5)

            finally:
                page.close()
                context.close()
                browser.close()

        print(f"\n✅ Successfully scraped {len(articles)} articles out of {len(urls)} URLs")
        return articles

    def save_articles(self, articles: List[Dict[str, Any]], output_file: str = None):
        """Save scraped articles to JSON file"""
        if output_file is None:
            base_dir = Path(__file__).parent.parent.parent
            output_file = base_dir / "data" / "scraped_articles.json"

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)

        print(f"💾 Saved {len(articles)} articles to {output_path}")

    def load_articles(self, input_file: str = None) -> List[Dict[str, Any]]:
        """Load previously scraped articles from JSON file"""
        if input_file is None:
            base_dir = Path(__file__).parent.parent.parent
            input_file = base_dir / "data" / "scraped_articles.json"

        input_path = Path(input_file)

        if not input_path.exists():
            return []

        with open(input_path, 'r', encoding='utf-8') as f:
            return json.load(f)


def main():
    """Main function for standalone scraping"""
    scraper = HelpdeskScraper()

    print("=" * 60)
    print("1&1 Hilfe-Center Article Scraper")
    print("=" * 60)
    print("This scraper will:")
    print("  1. Fetch all article URLs from sitemap.xml")
    print("  2. Use Playwright (headless browser) to scrape JS-rendered content")
    print("  3. Save articles to JSON and import to ChromaDB")
    print(f"  4. Estimated: ~976 articles, ~15-20 minutes")
    print("=" * 60)
    print()

    # Scrape articles (no max limit to get all)
    articles = scraper.scrape_all_articles()

    if not articles:
        print("\n❌ No articles scraped. Check the output above for errors.")
        return

    print(f"\n✅ Scraped {len(articles)} articles")

    # Save to file
    scraper.save_articles(articles)

    # Import to vector database
    print("\nImporting to ChromaDB vector database...")
    from vector_db.chroma_client import VectorDBClient

    vector_db = VectorDBClient()

    documents = [a['content'] for a in articles]
    metadatas = [{'title': a['title'], 'url': a['url']} for a in articles]
    ids = [a['id'] for a in articles]

    result = vector_db.add_documents(documents, metadatas, ids)
    print(f"✅ Vector DB import result: {result}")

    # Show stats
    stats = vector_db.get_stats()
    print(f"\n📊 Vector DB now contains: {stats.get('count', 0)} articles")


if __name__ == "__main__":
    main()
