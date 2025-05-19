import { tool } from "ai";
import { z } from "zod";
import { Transformer } from "markmap-lib";
import { DataStreamWriter } from "ai";
import { Session } from "next-auth";

const generateMarkmapSchema = z.object({
  markdown: z.string().min(1).describe("Markdown outline to convert to a Markmap diagram."),
});

interface GenerateMarkmapProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const generateMarkmapTool = ({ dataStream }: GenerateMarkmapProps) =>
  tool({
    description: "Generate a Markmap mind map diagram from a Markdown outline.",
    parameters: generateMarkmapSchema,
    execute: async ({ markdown }) => {
      dataStream.writeData({
        type: "markmap_generation_status",
        content: "Generating Markmap diagram...",
      });

      try {
        const transformer = new Transformer();
        const { root } = transformer.transform(markdown);
        // You can serialize this for client-side rendering
        const json = JSON.stringify(root);

        // Optionally, you could generate SVG here if you want static images

        dataStream.writeData({
          type: "markmap_generated",
          content: json,
        });

        return {
          success: true,
          message: "Markmap diagram generated.",
          markmap: json,
        };
      } catch (error) {
        dataStream.writeData({
          type: "markmap_generation_error",
          content: error instanceof Error ? error.message : "Unknown error",
        });
        return {
          success: false,
          message: "Failed to generate Markmap diagram.",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
