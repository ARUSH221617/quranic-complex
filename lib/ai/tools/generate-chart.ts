import { tool } from "ai";
import { z } from "zod";
import { DataStreamWriter } from "ai";
import { Session } from "next-auth";

// Supported chart types for Chart.js
const chartTypes = [
  "bar",
  "line",
  "pie",
  "doughnut",
  "radar",
  "polarArea",
  "bubble",
  "scatter",
];

const generateChartSchema = z.object({
  type: z
    .enum([
      "bar",
      "line",
      "pie",
      "doughnut",
      "radar",
      "polarArea",
      "bubble",
      "scatter",
    ])
    .describe("Type of chart to generate."),
  data: z
    .any()
    .describe("Chart.js data object containing labels, datasets, etc."),
  options: z
    .any()
    .optional()
    .default({})
    .describe("Chart.js options object (default {})."),
  width: z.number().int().min(100).max(2000).optional().default(600),
  height: z.number().int().min(100).max(2000).optional().default(400),
});

interface GenerateChartProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateChartTool = ({ dataStream }: GenerateChartProps) =>
  tool({
    description:
      "Generate a chart image (bar, line, pie, etc) from Chart.js config and data. Returns a base64 image string.",
    parameters: generateChartSchema,
    execute: async ({ type, data, options, width, height }) => {
      // No server-side chart generation, just return the parameters for frontend rendering
      // You could add some basic validation here if needed, but Zod schema handles basic structure

      try {
        // Simulate a small delay or processing if necessary, or remove
        // await new Promise(resolve => setTimeout(resolve, 500));

        return {
          success: true,
          message: "Chart parameters received for frontend rendering.",
          chart: { type, data, options, width, height },
        };
      } catch (error) {
        // This catch block might be less relevant now unless frontend passing causes issues
        return {
          success: false,
          message: "Failed to process chart parameters for rendering.",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  });
