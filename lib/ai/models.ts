export const DEFAULT_CHAT_MODEL: string = "agent-model";

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: "agent-model",
    name: "Agent model",
    description: "AI agent that can take actions to accomplish tasks",
  },
  {
    id: "chat-model",
    name: "Chat model",
    description: "Language model optimized for conversation and dialogue",
  },
];
