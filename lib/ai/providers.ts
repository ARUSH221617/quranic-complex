import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { google } from "@ai-sdk/google";

export const myProvider = customProvider({
  languageModels: {
    "chat-model": wrapLanguageModel({
      model: google("gemini-2.5-pro-exp-03-25"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "chat-model-reasoning": wrapLanguageModel({
      model: google("gemini-2.0-flash-thinking-exp-01-21"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": google("gemini-2.0-flash-001"),
    "artifact-model": wrapLanguageModel({
      model: google("gemini-2.5-pro-exp-03-25"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "image-model": google("gemini-2.0-flash-preview-image-generation"),
    "search-model": google("gemini-2.0-flash-exp", {
      useSearchGrounding: true,
    }),
  },
});
