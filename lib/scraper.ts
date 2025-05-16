import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Types for scraper results and options
 */
export interface ScraperOptions {
  headers?: Record<string, string>;
  userAgent?: string;
  timeoutMs?: number;
}

export interface ScrapedLink {
  href: string;
  text: string;
}

export interface ScraperResult {
  url: string;
  status: number;
  title?: string;
  description?: string;
  links: ScrapedLink[];
  rawHtml: string;
  rawText: string;
}

/**
 * Basic static web scraper class
 */
export class WebScraper {
  async fetchPage(url: string, options: ScraperOptions = {}): Promise<ScraperResult> {
    const headers: Record<string, string> = {
      ...(options.headers || {}),
      'User-Agent': options.userAgent || 'Mozilla/5.0 (compatible; WebScraper/1.0; +https://example.com/bot)',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
    } catch (err) {
      clearTimeout(timeout);
      throw new Error(`Failed to fetch URL: ${url} (${err instanceof Error ? err.message : String(err)})`);
    }
    clearTimeout(timeout);

    const status = response.status;
    const rawHtml = await response.text();

    const $ = cheerio.load(rawHtml);

    // Extract title
    const title = $('head > title').text().trim() || undefined;

    // Extract meta description
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[name="Description"]').attr('content') ||
      undefined;

    // Extract all links
    const links: ScrapedLink[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      links.push({ href, text });
    });

    // Extract visible text content
    const rawText = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      url,
      status,
      title,
      description,
      links,
      rawHtml,
      rawText,
    };
  }
}

// Example usage (uncomment for testing):
// (async () => {
//   const scraper = new WebScraper();
//   const result = await scraper.fetchPage('https://example.com');
//   console.log(result);
// })();
