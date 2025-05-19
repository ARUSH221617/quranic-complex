import { tool } from "ai";
import { z } from "zod";
import { DataStreamWriter } from "ai";
import { Session } from "next-auth";
import fetch from "node-fetch";

// Schema for tool parameters
const generateCurrencyPriceSchema = z.object({
  base: z
    .string()
    .length(3)
    .toUpperCase()
    .default("USD")
    .describe("The base currency code (ISO 4217, e.g., USD, EUR, GBP)."),
  symbols: z
    .array(z.string().length(3).toUpperCase())
    .optional()
    .describe("Optional list of target currency codes to filter the results."),
});

// Schema for tool result
const generateCurrencyPriceResult = z.object({
  base: z.string(),
  rates: z.record(z.string(), z.number()),
  time_last_update_utc: z.string(),
  time_next_update_utc: z.string(),
  raw: z.any(),
});

interface GenerateCurrencyPriceProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateCurrencyPriceTool = ({
  dataStream,
}: GenerateCurrencyPriceProps) =>
  tool({
    description:
      "Fetches the latest currency conversion rates from ExchangeRate-API. Returns rates from a base currency to all or selected target currencies.",
    parameters: generateCurrencyPriceSchema,
    execute: async ({ base, symbols }) => {
      dataStream.writeData({
        type: "currency_price_status",
        content: `Fetching currency prices for base: ${base}...`,
      });

      const apiKey = process.env.EXCHANGERATE_API_KEY;
      if (!apiKey) {
        dataStream.writeData({
          type: "currency_price_error",
          content: "ExchangeRate-API key is not set in environment variables.",
        });
        return {
          base,
          rates: {},
          time_last_update_utc: "",
          time_next_update_utc: "",
          raw: {
            error: "ExchangeRate-API key is not set in environment variables.",
          },
        };
      }

      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
      try {
        const response = await fetch(url);
        const data: any = await response.json();

        if (data.result !== "success") {
          throw new Error(
            data["error-type"] || "Unknown error from ExchangeRate-API",
          );
        }

        let rates = data.conversion_rates;
        if (symbols && Array.isArray(symbols) && symbols.length > 0) {
          rates = Object.fromEntries(
            Object.entries(rates).filter(([code]) => symbols.includes(code)),
          );
        }

        const result = {
          base: data.base_code,
          rates,
          time_last_update_utc: data.time_last_update_utc,
          time_next_update_utc: data.time_next_update_utc,
          raw: data,
        };

        dataStream.writeData({
          type: "currency_price_result",
          content: JSON.stringify(result),
        });

        return result;
      } catch (error) {
        dataStream.writeData({
          type: "currency_price_error",
          content: error instanceof Error ? error.message : "Unknown error",
        });
        return {
          base,
          rates: {},
          time_last_update_utc: "",
          time_next_update_utc: "",
          raw: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
