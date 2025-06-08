import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { systemPrompt } from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { createDocument } from "@/lib/ai/tools/create-document";
import { generateSpeechTool } from "@/lib/ai/tools/generate-speech";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { webSearch } from "@/lib/ai/tools/web-search";
import { fetchUrl as fetchUrlTool } from "@/lib/ai/tools/fetch-url";
import { createNews } from "@/lib/ai/tools/create-news";
import { getDocument } from "@/lib/ai/tools/get-document";
import { isProductionEnvironment } from "@/lib/constants";
import { myProvider } from "@/lib/ai/providers";
import { getServerSession } from "next-auth";
import { MessageRole } from "@prisma/client";
import { getLatestNews } from "@/lib/ai/tools/get-latest-news";
import { getNewsBySlug } from "@/lib/ai/tools/get-news-by-slug";
import { updateNews } from "@/lib/ai/tools/update-news";
import { searchNewsByTitle } from "@/lib/ai/tools/search-news-by-title";
import { createNewsTranslation } from "@/lib/ai/tools/create-news-translation";
import { generateImageTool } from "@/lib/ai/tools/generate-image";
import { generateChartTool } from "@/lib/ai/tools/generate-chart";
import { generateMarkmapTool } from "@/lib/ai/tools/generate-markmap";
import { generateCurrencyPriceTool } from "@/lib/ai/tools/generate-currency-price";
import { generateCryptoPriceTool } from "@/lib/ai/tools/generateCryptoPrice";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response("No user message found", { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id: id, userId: session.user.id, title: title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          role: MessageRole.USER,
          parts: JSON.parse(JSON.stringify(userMessage.parts)),
          attachments: JSON.parse(
            JSON.stringify(userMessage.experimental_attachments ?? []),
          ),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === "chat-model"
              ? []
              : [
                  "getWeather",
                  "createDocument",
                  "updateDocument",
                  "getDocument",
                  "requestSuggestions",
                  "createNews",
                  "getLatestNews",
                  "getNewsBySlug",
                  "updateNews",
                  "searchNewsByTitle",
                  "createNewsTranslation",
                  "generateImage",
                  "generateChart",
                  "generateCurrencyPrice",
                  "generateCryptoPrice",
                  "webSearch",
                  "fetchUrl",
                  "generateMarkmap",
                  "generateSpeech",
                ],
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            getDocument,
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            createNews: createNews({ session, dataStream }),
            getLatestNews: getLatestNews({ session, dataStream }),
            getNewsBySlug: getNewsBySlug({ session, dataStream }),
            updateNews: updateNews({ session, dataStream }),
            searchNewsByTitle: searchNewsByTitle({ session, dataStream }),
            createNewsTranslation: createNewsTranslation({
              session,
              dataStream,
            }),
            generateImage: generateImageTool({ session, dataStream }),
            generateChart: generateChartTool({ session, dataStream }),
            generateCurrencyPrice: generateCurrencyPriceTool({
              session,
              dataStream,
            }),
            generateCryptoPrice: generateCryptoPriceTool({
              session,
              dataStream,
            }),
            webSearch,
            fetchUrl: fetchUrlTool({ session, dataStream }),
            generateMarkmap: generateMarkmapTool({ session, dataStream }),
            generateSpeech: generateSpeechTool({ session, dataStream }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === "assistant",
                  ),
                });

                if (!assistantId) {
                  throw new Error("No assistant message found!");
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      chatId: id,
                      role: assistantMessage.role.toUpperCase() as MessageRole,
                      parts: JSON.parse(JSON.stringify(assistantMessage.parts)),
                      attachments: JSON.parse(
                        JSON.stringify(
                          assistantMessage.experimental_attachments ?? [],
                        ),
                      ),
                    },
                  ],
                });
              } catch (_) {
                console.error(`Failed to save chat ${_}`);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });
  } catch (error) {
    console.log(error);
    return new Response("An error occurred while processing your request!", {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat?.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response("An error occurred while processing your request!", {
      status: 500,
    });
  }
}
