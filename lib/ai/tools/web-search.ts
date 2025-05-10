import { tool, generateObject } from "ai";
import { z } from "zod";
import { myProvider } from "../providers";

// Schema for a single search result
const SearchResultSchema = z.object({
  title: z.string().describe("The title of the search result."),
  snippet: z.string().describe("A brief snippet or description of the search result."),
  url: z.string().describe("The URL of the search result."),
});

// Schema for the overall search response, which includes an array of results and a summary
const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema).describe("A list of search results, each containing a title, snippet, and URL."),
  summary: z.string().describe("A concise summary of the overall findings from the web search."),
});

export const webSearch = tool({
  description: "Performs a web search for a given query using a search-grounded model and returns a structured list of results and a summary. Use this to find current information or general knowledge from the internet.",
  parameters: z.object({
    query: z.string().describe("The search query or topic to look up on the internet."),
    numResults: z
      .number()
      .min(1)
      .max(10) // Limiting to a reasonable number for an LLM to process and return
      .optional()
      .default(5) // Default to 5 results if not specified
      .describe("The desired number of search results to return (between 1 and 10, defaults to 5)."),
  }),
  execute: async ({ query, numResults = 5 }) => {
    try {
      // The user prompt guides the LLM on what to search for and how many results.
      // The "search-model" is configured with useSearchGrounding: true,
      // so it should inherently perform a search based on the prompt.
      // generateObject will then structure this output.
      const userPrompt = `
      Conduct an internet search for information related to: "${query}".
      Please provide the top ${numResults} most relevant results.
      For each result, include its title, a concise snippet, and the direct URL.
      Additionally, offer a brief overall summary of the search findings.
      Ensure the output strictly conforms to the required JSON schema.
      `;

      const { object } = await generateObject({
        model: myProvider.languageModel("search-model"), // Leverages the pre-configured search model
        schema: SearchResponseSchema, // The Zod schema to structure the output
        prompt: userPrompt,
        // mode: "json" // Optional: explicitly set to JSON mode if needed, though generateObject often infers this with Zod
      });

      // The generateObject and the LLM should ideally respect numResults based on the prompt.
      // If strict enforcement is needed beyond the prompt, results could be sliced here:
      // object.results = object.results.slice(0, numResults);
      // However, trusting the prompt and LLM's capability with search grounding is often sufficient.

      return object; // `object` is guaranteed by generateObject to match SearchResponseSchema

    } catch (error) {
      console.error("[webSearch Tool Error] Failed to perform web search:", error);
      // Propagate a user-friendly error or a more detailed one for debugging
      if (error instanceof Error) {
        throw new Error(`Web search failed: ${error.message}`);
      }
      throw new Error("An unexpected error occurred during the web search.");
    }
  },
});