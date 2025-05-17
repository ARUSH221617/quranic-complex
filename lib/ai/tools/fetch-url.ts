import { tool } from "ai";
import { z } from "zod"; // Keep Zod for schema validation
import { WebScraper, ScraperResult, ScraperOptions } from "@/lib/scraper"; // Import types from scraper
import { DataStreamWriter } from "ai"; // Assuming DataStreamWriter is correctly typed elsewhere
import { Session } from "next-auth"; // Assuming Session is correctly typed elsewhere

// Define the schema for the tool's parameters using Zod
const FetchUrlParams = z.object({
  url: z.string().describe("The URL to fetch and extract content from."),
  headers: z
    .record(z.string(), z.string())
    .optional()
    .describe("Optional HTTP headers to include in the request."),
  userAgent: z
    .string()
    .optional()
    .describe("Optional custom User-Agent string for the request."),
  timeoutMs: z // Matches the type in ScraperOptions
    .number()
    .int() // Integer milliseconds
    .min(1000)
    .max(60000)
    .optional()
    .default(15000)
    .describe(
      "Optional timeout for the request in milliseconds (default 15000).",
    ),
});

// Define the schema for the tool's output using Zod, matching ScraperResult
const FetchUrlResultSchema = z.object({
  url: z.string().describe("The fetched URL."),
  status: z.number().describe("HTTP status code of the response."),
  title: z.string().optional().describe("The page title, if available."),
  description: z
    .string()
    .optional()
    .describe("Meta description, if available."),
  links: z // Array of objects matching ScrapedLink structure
    .array(
      z.object({
        href: z.string().describe("The link's href attribute."),
        text: z.string().describe("The visible text of the link."),
      }),
    )
    .describe("All links found on the page."),
  rawHtml: z.string().describe("The raw HTML content of the page."),
  rawText: z.string().describe("The visible text content of the page."),
});

// Define the Props for the fetchUrl tool factory function
interface FetchUrlToolProps {
  session: Session;
  dataStream: DataStreamWriter;
}

// Define the tool's execute function signature explicitly
type ExecuteFetchUrl = (
  params: z.infer<typeof FetchUrlParams>, // Infer parameter types from schema
) => Promise<ScraperResult>; // Promise resolves to ScraperResult type

export const fetchUrl = (
  { session, dataStream }: FetchUrlToolProps, // Use FetchUrlToolProps
) =>
  tool({
    description:
      "Fetches a web page and extracts its content, including title, meta description, all links, raw HTML, and visible text. Useful for retrieving and analyzing the contents of any public URL.",
    parameters: FetchUrlParams,
    execute: (async ({ url, headers, userAgent, timeoutMs }) => {
      // Explicitly type params
      console.log("[fetchUrl] Starting to fetch the URL:", url);
      dataStream.writeData({
        type: "fetch_url_status",
        content: `Starting to fetch the URL: ${url}...`, // More descriptive message
      });

      const scraperOptions: ScraperOptions = {
        // Use ScraperOptions type
        headers,
        userAgent,
        timeoutMs,
      };

      try {
        const scraper = new WebScraper();
        console.log("[fetchUrl] Instantiated WebScraper");

        // Use the ScraperResult type for the result
        const result: ScraperResult = await scraper.fetchPage(
          url,
          scraperOptions,
        );
        console.log("[fetchUrl] Successfully fetched and parsed the URL:", url);

        // Validate the result against the schema
        const parsedResult = FetchUrlResultSchema.parse(result); // Ensure result matches schema

        dataStream.writeData({
          type: "fetch_url_status",
          content: "Successfully fetched and parsed the URL.",
        });
        dataStream.writeData({
          type: "fetch_url_result",
          content: JSON.stringify(parsedResult), // Stringify the valid result
        });

        return parsedResult; // Return the validated result
      } catch (error) {
        console.error("[fetchUrl] Error during processing:", error);

        // Handle both fetching and parsing errors gracefully
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        dataStream.writeData({
          type: "fetch_url_error",
          content: `Error processing URL ${url}: ${errorMessage}`,
        });

        // Return a valid, albeit potentially empty or error-containing, ScraperResult structure
        // This ensures the tool always returns the expected type, even on failure.
        // Construct a result object that conforms to ScraperResult type
        const errorResult: ScraperResult = {
          url,
          status: (error as any)?.status || 0, // Attempt to get status if available, default to 0
          title: undefined,
          description: `Error: ${errorMessage}`, // Put error message in description
          links: [], // Empty links array
          rawHtml: "", // Empty rawHtml
          rawText: "", // Empty rawText
        };

        // Although we had an error, we return a value that matches the tool's output schema (ScraperResult)
        // This is crucial for the AI framework to handle the tool output correctly.
        // We can optionally validate this errorResult against the schema too if needed,
        // but it's less critical as it's the error path.
        // FetchUrlResultSchema.parse(errorResult); // Optional: Validate error result

        return errorResult; // Return the error result object
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
        console.log("[fetchUrl] Finished processing URL:", url);
      }
    }) satisfies ExecuteFetchUrl, // Use 'satisfies' for type checking without inferring
  });
