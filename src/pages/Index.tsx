import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useChat } from "@/hooks/use-chat";
import { getTheme, setTheme as saveTheme } from "@/lib/chat-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const Index = () => {
  const {
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
  } = useChat();

  const [isDark, setIsDark] = useState(() => getTheme() === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    saveTheme(theme);
  }, [isDark]);

  // Initialize theme on mount
  useEffect(() => {
    const theme = getTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
    setIsDark(theme === "dark");
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages]);

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const toggleTheme = () => setIsDark((p) => !p);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-72 shrink-0 p-3">
          <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            onNewChat={newChat}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-72 p-3 h-full">
            <ChatSidebar
              conversations={conversations}
              activeId={activeId}
              onNewChat={() => {
                newChat();
                setSidebarOpen(false);
              }}
              onSelectChat={(id) => {
                selectChat(id);
                setSidebarOpen(false);
              }}
              onDeleteChat={deleteChat}
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />
          </div>
          <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center gap-2 p-3 border-b border-border/50">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Fmc AI</span>
          </div>
        )}

        {/* Messages or Welcome */}
        {!active || active.messages.length === 0 ? (
          <WelcomeScreen onSuggestion={handleSuggestion} />
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4">
              {active.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && !active.messages.some(m => m.role === "assistant" && m.id === active.messages[active.messages.length - 1]?.id) && (
                <TypingIndicator />
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          model={model}
          webSearch={webSearch}
          isLoading={isLoading}
          onModelChange={setModel}
          onWebSearchChange={setWebSearch}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      </div>
    </div>
  );
};

export default Index;
