import { tool } from "ai";
import { z } from "zod";
import { DataStreamWriter } from "ai";
import { Session } from "next-auth";
import fetch from "node-fetch";

// Input parameters schema (empty for now as no parameters are needed)
const generateCryptoPriceSchema = z.object({});

// API Response schema
const generateCryptoPriceResultSchema = z.object({
  status: z.number(),
  result: z.array(
    z.object({
      // Essential fields (required)
      symbol: z.string(),
      current_price: z.number(),
      last_updated: z.string(),

      // Optional fields with nullable numbers
      id: z.string().optional(),
      name: z.string().optional(),
      market_cap: z.number().nullable().optional(),
      market_cap_rank: z.number().nullable().optional(),
      fully_diluted_valuation: z.number().nullable().optional(),
      total_volume: z.number().nullable().optional(),
      high_24h: z.number().nullable().optional(),
      low_24h: z.number().nullable().optional(),
      price_change_24h: z.number().nullable().optional(),
      price_change_percentage_24h: z.number().nullable().optional(),
      market_cap_change_24h: z.number().nullable().optional(),
      market_cap_change_percentage_24h: z.number().nullable().optional(),
      circulating_supply: z.number().nullable().optional(),
      total_supply: z.number().nullable().optional(),
      max_supply: z.number().nullable().optional(),
    })
  ),
});

// Inferred types from schemas
type CryptoPriceResponse = z.infer<typeof generateCryptoPriceResultSchema>;

// Tool return type
interface CryptoPriceResult {
  rates: Record<string, number>;
  raw: CryptoPriceResponse | { error: string };
}

interface GenerateCryptoPriceProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateCryptoPriceTool = ({
  dataStream,
}: GenerateCryptoPriceProps) => {
  const createErrorResult = (errorMessage: string): CryptoPriceResult => ({
    rates: {},
    raw: { error: errorMessage },
  });

  return tool({
    description:
      "Fetches the latest cryptocurrency prices from One-API. Returns prices and related data for a base cryptocurrency and optionally filtered target symbols.",
    parameters: generateCryptoPriceSchema,
    execute: async (): Promise<CryptoPriceResult> => {
      try {
        dataStream.writeData({
          type: "crypto_price_status",
          content: "Fetching cryptocurrency prices...",
        });

        const apiKey = process.env.ONE_API_KEY;
        if (!apiKey) {
          const error = "One-API key is not set in environment variables.";
          dataStream.writeData({
            type: "crypto_price_error",
            content: error,
          });
          return createErrorResult(error);
        }

        const response = await fetch(
          "https://one-api.ir/DigitalCurrency/?token=114375:682d81f79211c"
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const rawData = (await response.json()) as { result: any[] };

        // Filter out invalid entries before parsing
        if (Array.isArray(rawData.result)) {
          rawData.result = rawData.result.filter(
            (item: any) =>
              item &&
              typeof item.symbol === "string" &&
              typeof item.current_price === "number" &&
              typeof item.last_updated === "string"
          );
        }

        const parsedData = generateCryptoPriceResultSchema.parse(rawData);

        if (!parsedData.result.length) {
          throw new Error("No cryptocurrency data received");
        }

        const rates = parsedData.result.reduce<Record<string, number>>(
          (acc, crypto) => {
            if (crypto.symbol && crypto.current_price) {
              acc[crypto.symbol.toUpperCase()] = crypto.current_price;
            }
            return acc;
          },
          {}
        );

        const result: CryptoPriceResult = {
          rates,
          raw: parsedData,
        };

        dataStream.writeData({
          type: "crypto_price_result",
          content: JSON.stringify(result),
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";

        dataStream.writeData({
          type: "crypto_price_error",
          content: errorMessage,
        });

        return createErrorResult(errorMessage);
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
};
