import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, Bot, RefreshCw, Brain, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MODEL_INFO, type Message } from "@/lib/chat-store";
import { parseThinkContent } from "@/lib/think-parser";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
}

export function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const modelInfo = message.model ? MODEL_INFO[message.model] : null;
  const isDeepSeek = message.model === "deepseek";

  const thinkResult = !isUser && isDeepSeek
    ? parseThinkContent(message.content)
    : null;

  const displayContent = thinkResult ? thinkResult.answer : message.content;

  return (
    <div className={cn("flex gap-3 py-4 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm"
          style={{
            backgroundColor: modelInfo ? `${modelInfo.color}20` : undefined,
            color: modelInfo?.color,
          }}
        >
          {modelInfo ? modelInfo.icon : <Bot className="h-4 w-4" />}
        </div>
      )}

      <div className={cn("max-w-[80%] flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm w-full",
            isUser
              ? "bg-primary text-primary-foreground"
              : "glass-subtle"
          )}
        >
          {message.imageBase64 && (
            <img
              src={message.imageBase64}
              alt="Uploaded"
              className="max-w-[240px] rounded-lg mb-2"
            />
          )}

          {/* DeepSeek Thinking Mode */}
          {thinkResult && thinkResult.isThinking && (
            <ThinkingAnimation thinkingText={thinkResult.thinking || ""} />
          )}

          {thinkResult && !thinkResult.isThinking && thinkResult.thinking && (
            <ThinkingCollapsible thinkingText={thinkResult.thinking} />
          )}

          {/* Content */}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : thinkResult?.isThinking ? null : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    if (match) {
                      return <CodeBlock language={match[1]} code={codeString} />;
                    }
                    return (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action toolbar for assistant messages */}
        {!isUser && !thinkResult?.isThinking && (
          <MessageActions
            content={displayContent}
            messageId={message.id}
            onRegenerate={onRegenerate}
          />
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
}

function MessageActions({
  content,
  messageId,
  onRegenerate,
}: {
  content: string;
  messageId: string;
  onRegenerate?: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      {onRegenerate && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRegenerate(messageId)}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function ThinkingAnimation({ thinkingText }: { thinkingText: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 thinking-pulse" style={{ color: "hsl(var(--model-deepseek))" }} />
        <span className="text-xs font-medium" style={{ color: "hsl(var(--model-deepseek))" }}>
          Sedang berpikir...
        </span>
      </div>
      {thinkingText && (
        <div className="thinking-gradient rounded-lg px-3 py-2">
          <p className="text-xs italic text-muted-foreground whitespace-pre-wrap line-clamp-6">
            {thinkingText}
          </p>
        </div>
      )}
    </div>
  );
}

function ThinkingCollapsible({ thinkingText }: { thinkingText: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-3">
      <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <Brain className="h-3.5 w-3.5" style={{ color: "hsl(var(--model-deepseek))" }} />
        <span>{open ? "Sembunyikan" : "Lihat"} proses berpikir</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {thinkingText}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-3 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-muted/80 px-4 py-1.5 text-xs text-muted-foreground">
        <span>{language}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8rem" }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
