import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";

export const myProvider = customProvider({
  languageModels: {
    "agent-model": google("gemini-2.5-flash-preview-04-17"),
    "chat-model": wrapLanguageModel({
      model: xai("grok-3-mini-beta"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": google("gemini-1.5-flash"),
    "artifact-model": google("gemini-2.5-pro-exp-03-25"),
    "image-model": google("gemini-2.0-flash-preview-image-generation"),
    "search-model": google("gemini-2.0-flash-exp", {
      useSearchGrounding: true,
    }),
  },
});
