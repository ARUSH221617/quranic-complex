import fetch, { RequestInit, Response } from "node-fetch"; // Import specific types
import * as cheerio from "cheerio";

/**
 * Options for the web scraper.
 */
export interface ScraperOptions {
  headers?: Record<string, string>;
  userAgent?: string;
  timeoutMs?: number; // Use number type for milliseconds
}

/**
 * Represents a link found on a scraped page.
 */
export interface ScrapedLink {
  href: string; // Ensure href is always a string
  text: string; // Ensure text is always a string
}

/**
 * The result structure for a scraped web page.
 */
export interface ScraperResult {
  url: string; // Ensure url is always a string
  status: number; // Ensure status is always a number
  title?: string; // Optional string
  description?: string; // Optional string
  links: ScrapedLink[]; // Array of ScrapedLink objects
  rawHtml: string; // Ensure rawHtml is always a string
  rawText: string; // Ensure rawText is always a string
}

/**
 * Basic static web scraper class
 */
export class WebScraper {
  /**
   * Fetches a web page and extracts relevant content.
   *
   * @param url The URL to fetch.
   * @param options Optional scraper options.
   * @returns A promise resolving to the ScraperResult.
   * @throws Error if the fetch fails.
   */
  public async fetchPage(
    url: string,
    options: ScraperOptions = {},
  ): Promise<ScraperResult> {
    const headers: Record<string, string> = {
      "User-Agent":
        options.userAgent ||
        "Mozilla/5.0 (compatible; WebScraper/1.0; +https://example.com/bot)",
      ...(options.headers || {}), // Spread optional headers
    };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs || 15000,
    );

    let response: Response; // Explicitly type response
    try {
      const fetchOptions: RequestInit = { // Use RequestInit type
        headers,
        signal: controller.signal,
        redirect: "follow",
      };
      response = await fetch(url, fetchOptions);
    } catch (err) {
      clearTimeout(timeout);
      // Improved error handling and type checking
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch URL: ${url} (${errorMessage})`);
    } finally {
      clearTimeout(timeout); // Ensure timeout is cleared even on success
    }

    const status = response.status; // Status is a number
    const rawHtml = await response.text(); // text() returns a string

    const $ = cheerio.load(rawHtml);

    // Extract title - handle potential null/undefined from text() and trim
    const title = $("head > title").text().trim() || undefined;

    // Extract meta description - handle potential undefined from attr and trim
    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[name="Description"]').attr("content")?.trim() || // Case-insensitive check
      undefined;

    // Extract all links
    const links: ScrapedLink[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href"); // attr can return undefined
      const text = $(el).text().trim();
      if (href) { // Only push if href is valid
        links.push({ href, text });
      }
    });

    // Extract visible text content
    // Select body and get text, replace multiple spaces with single, trim
    const rawText = $("body").text().replace(/\s+/g, " ").trim();

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
//   try {
//     const scraper = new WebScraper();
//     const result = await scraper.fetchPage('https://example.com');
//     console.log(result);
//   } catch (error) {
//     console.error("Scraping failed:", error);
//   }
// })();
