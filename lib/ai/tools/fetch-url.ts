import { tool } from "ai";
import { z } from "zod";
import { WebScraper } from "@/lib/scraper";

// Define the schema for the tool's parameters
const FetchUrlParams = z.object({
  url: z.string().url().describe("The URL to fetch and extract content from."),
  headers: z
    .record(z.string(), z.string())
    .optional()
    .describe("Optional HTTP headers to include in the request."),
  userAgent: z
    .string()
    .optional()
    .describe("Optional custom User-Agent string for the request."),
  timeoutMs: z
    .number()
    .min(1000)
    .max(60000)
    .optional()
    .describe("Optional timeout for the request in milliseconds (default 15000)."),
});

// Define the schema for the tool's output
const FetchUrlResult = z.object({
  url: z.string().describe("The fetched URL."),
  status: z.number().describe("HTTP status code of the response."),
  title: z.string().optional().describe("The page title, if available."),
  description: z.string().optional().describe("Meta description, if available."),
  links: z
    .array(
      z.object({
        href: z.string().describe("The link's href attribute."),
        text: z.string().describe("The visible text of the link."),
      })
    )
    .describe("All links found on the page."),
  rawHtml: z.string().describe("The raw HTML content of the page."),
  rawText: z.string().describe("The visible text content of the page."),
});

export const fetchUrl = tool({
  description:
    "Fetches a web page and extracts its content, including title, meta description, all links, raw HTML, and visible text. Useful for retrieving and analyzing the contents of any public URL.",
  parameters: FetchUrlParams,
  execute: async ({ url, headers, userAgent, timeoutMs }) => {
    const scraper = new WebScraper();
    const result = await scraper.fetchPage(url, {
      headers,
      userAgent,
      timeoutMs,
    });
    // Validate and return the result using the output schema
    return FetchUrlResult.parse(result);
  },
});