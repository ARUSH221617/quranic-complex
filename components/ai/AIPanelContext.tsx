"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import type { Chat as DBChat, Message as DBMessage } from "@prisma/client";
import type { Session } from "next-auth";
import { useCookies } from "next-client-cookies";

interface AIPanelContextType {
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  chatId: string | null;
  chat: DBChat | null;
  messagesFromDb: DBMessage[] | null;
  chatModelFromCookie: string | undefined;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  refetchData: () => Promise<void>; // Add refetch function type
}

const AIPanelContext = createContext<AIPanelContextType | undefined>(undefined);

export const AIPanelProvider = ({ children }: { children: ReactNode }) => {
  const cookies = useCookies(); // Use useCookies for client-side cookie access
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chat, setChat] = useState<DBChat | null>(null);
  const [messagesFromDb, setMessagesFromDb] = useState<DBMessage[] | null>(
    null,
  );
  const [chatModelFromCookie, setChatModelFromCookie] = useState<
    string | undefined
  >(undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Clear previous data before fetching new data to provide immediate feedback
    setChatId(null);
    setChat(null);
    setMessagesFromDb(null);
    setChatModelFromCookie(undefined);
    // Note: We keep session here as it's often independent of the specific chat data

    try {
      const response = await fetch("/api/ai-panel");

      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          setError("Authentication required for AI Panel.");
        } else {
          setError(`Error fetching AI panel data: ${response.statusText}`);
        }
        setIsLoading(false);
        // Do not throw here, just set error state
        return;
      }

      const data = await response.json();

      setChatId(data.chatId);
      setChat(data.chat);
      setMessagesFromDb(data.messagesFromDb);
      setChatModelFromCookie(data.chatModelFromCookie);
      // Set session from API response if it was included (useful on initial load)
      if (data.session) {
        setSession(data.session);
      }

      // Update the client-side cookie if a new chat was created or the ID changed
      // The API sets the cookie header, but for immediate client-side access/sync,
      // we can also set it here based on the response data.
      // Check if the received chatId is different from the current cookie value.
      if (cookies.get("dashboard:chat") !== data.chatId) {
        cookies.set("dashboard:chat", data.chatId, { path: "/", expires: 7 }); // Set cookie with a path and expiration
      }
    } catch (err) {
      console.error("Failed to fetch AI panel data:", err);
      setError("Failed to load AI panel data.");
    } finally {
      setIsLoading(false);
    }
  }, [cookies]); // Depend on cookies to ensure it's available if fetchData is called outside useEffect

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depend on fetchData

  const refetchData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const contextValue: AIPanelContextType = {
    showAIPanel,
    setShowAIPanel,
    chatId,
    chat,
    messagesFromDb,
    chatModelFromCookie,
    session,
    isLoading,
    error,
    refetchData, // Add refetch function here
  };

  return (
    <AIPanelContext.Provider value={contextValue}>
      {children}
    </AIPanelContext.Provider>
  );
};

export const useAIPanel = () => {
  const context = useContext(AIPanelContext);
  if (!context) {
    throw new Error("useAIPanel must be used within an AIPanelProvider");
  }
  return context;
};
