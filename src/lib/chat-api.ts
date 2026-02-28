import type { Message, ModelId } from "./chat-store";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface StreamOptions {
  messages: Message[];
  model: ModelId;
  webSearch?: boolean;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamChat({ messages, model, webSearch, onDelta, onDone, onError, signal }: StreamOptions) {
  try {
    const body: Record<string, unknown> = {
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.imageBase64 ? { imageBase64: m.imageBase64 } : {}),
      })),
      model,
    };
    if (model === "quillbot" && webSearch) {
      body.webSearch = true;
    }

    const resp = await fetch(`${FUNCTIONS_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
      onError(errorData.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const rawContent = parsed.choices?.[0]?.delta?.content;
          if (rawContent) {
            const text = typeof rawContent === "string"
              ? rawContent
              : typeof rawContent === "object" && rawContent.answer
                ? rawContent.answer
                : JSON.stringify(rawContent);
            onDelta(text);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const rawContent = parsed.choices?.[0]?.delta?.content;
          if (rawContent) {
            const text = typeof rawContent === "string"
              ? rawContent
              : typeof rawContent === "object" && rawContent.answer
                ? rawContent.answer
                : JSON.stringify(rawContent);
            onDelta(text);
          }
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") return;
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}
