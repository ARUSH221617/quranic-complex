import { tool } from "ai";
import { z } from "zod";
import { Session } from "next-auth";
import { DataStreamWriter } from "ai";
import { getProgramBySlug as getProgramBySlugAction } from "../actions/get-program-by-slug";

interface GetProgramBySlugProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const getProgramBySlug = ({
  session,
  dataStream,
}: GetProgramBySlugProps) =>
  tool({
    description: "Get a program item from the website by its slug.",
    parameters: z.object({
      slug: z
        .string()
        .describe("The unique slug identifier for the program item."),
      locale: z
        .enum(["en", "fa", "ar"])
        .optional()
        .default("en")
        .describe(
          "The locale for the program translation (must be one of: 'en', 'fa', 'ar'). Defaults to 'en'.",
        ),
    }),
    execute: async ({ slug, locale = "en" }) => {
      // Stream information about the request
      dataStream.writeData({
        type: "fetching_program_by_slug",
        content: `Fetching program for slug "${slug}" in ${locale} language...`,
      });

      try {
        const result = await getProgramBySlugAction(slug);

        if (!result.success || !result.data) {
          console.error("Error fetching program by slug:", result.error);
          dataStream.writeData({
            type: "program_fetch_status",
            content: `Failed: ${result.error}`,
          });
          return {
            success: false,
            message: `Failed to fetch program item: ${result.error}`,
            errorDetails: result.error,
          };
        }

        const translation = result.data.translations.find(
          (t) => t.locale === locale,
        );

        if (!translation) {
          dataStream.writeData({
            type: "program_fetch_status",
            content: `No translation found for locale "${locale}".`,
          });
          return {
            success: false,
            message: `No translation found for the specified locale: "${locale}".`,
          };
        }

        dataStream.writeData({
          type: "program_item",
          content: JSON.stringify({
            slug: result.data.slug,
            title: translation.title,
            description: translation.description,
            ageGroup: translation.ageGroup,
            schedule: translation.schedule,
          }),
        });

        dataStream.writeData({
          type: "program_fetch_status",
          content: "Success!",
        });

        return {
          success: true,
          message: "Successfully fetched the program item.",
          program: {
            slug: result.data.slug,
            title: translation.title,
            description: translation.description,
            ageGroup: translation.ageGroup,
            schedule: translation.schedule,
            image: result.data.image,
            metaTitle: translation.metaTitle,
            metaDescription: translation.metaDescription,
            keywords: translation.keywords,
          },
        };
      } catch (error) {
        console.error("Error fetching program by slug:", error);
        dataStream.writeData({
          type: "program_fetch_status",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        });
        return {
          success: false,
          message: `An error occurred while fetching the program item: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errorDetails: error,
        };
      } finally {
        dataStream.writeData({ type: "finish", content: "" });
      }
    },
  });
