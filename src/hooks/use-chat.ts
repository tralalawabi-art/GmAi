import { useState, useCallback, useRef } from "react";
import type { Message, ModelId, Conversation } from "@/lib/chat-store";
import {
  getConversations,
  createConversation,
  updateConversation,
  generateTitle,
} from "@/lib/chat-store";
import { streamChat } from "@/lib/chat-api";

export function useChat() {
  const [conversations, setConversations] = useState(getConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>("gemini");
  const [webSearch, setWebSearch] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const active = conversations.find((c) => c.id === activeId) || null;

  const refresh = () => setConversations(getConversations());

  const newChat = useCallback(() => {
    const convo = createConversation();
    updateConversation(convo);
    setActiveId(convo.id);
    refresh();
    return convo;
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      const convos = getConversations().filter((c) => c.id !== id);
      localStorage.setItem("fmc-ai-conversations", JSON.stringify(convos));
      if (activeId === id) setActiveId(null);
      setConversations(convos);
    },
    [activeId]
  );

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      let convo: Conversation;
      if (!active) {
        convo = createConversation();
        updateConversation(convo);
        setActiveId(convo.id);
      } else {
        convo = { ...active };
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
        ...(imageBase64 ? { imageBase64 } : {}),
      };

      convo.messages = [...convo.messages, userMsg];
      if (convo.messages.filter((m) => m.role === "user").length === 1) {
        convo.title = generateTitle(content);
      }
      convo.updatedAt = Date.now();
      updateConversation(convo);
      refresh();

      setIsLoading(true);
      const controller = new AbortController();
      abortRef.current = controller;

      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      await streamChat({
        messages: convo.messages,
        model,
        webSearch: model === "quillbot" ? webSearch : undefined,
        signal: controller.signal,
        onDelta: (chunk) => {
          assistantContent += chunk;
          const updated = { ...convo };
          const existing = updated.messages.find((m) => m.id === assistantId);
          if (existing) {
            existing.content = assistantContent;
          } else {
            updated.messages = [
              ...updated.messages,
              {
                id: assistantId,
                role: "assistant",
                content: assistantContent,
                model,
                timestamp: Date.now(),
              },
            ];
          }
          updated.updatedAt = Date.now();
          updateConversation(updated);
          convo = updated;
          refresh();
        },
        onDone: () => {
          setIsLoading(false);
        },
        onError: (error) => {
          setIsLoading(false);
          // Add error as assistant message
          const updated = { ...convo };
          const existing = updated.messages.find((m) => m.id === assistantId);
          if (!existing) {
            updated.messages = [
              ...updated.messages,
              {
                id: assistantId,
                role: "assistant",
                content: `⚠️ Error: ${error}`,
                model,
                timestamp: Date.now(),
              },
            ];
            updated.updatedAt = Date.now();
            updateConversation(updated);
            refresh();
          }
        },
      });
    },
    [active, model, webSearch]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    conversations,
    active,
    activeId,
    isLoading,
    model,
    webSearch,
    setModel,
    setWebSearch,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
    stopGeneration,
  };
}
