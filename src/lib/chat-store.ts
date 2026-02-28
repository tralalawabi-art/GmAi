export type ModelId = "quillbot" | "gemini" | "deepseek";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: ModelId;
  imageBase64?: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "fmc-ai-conversations";
const THEME_KEY = "fmc-ai-theme";

export function getConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

export function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function deleteConversation(id: string) {
  const convos = getConversations().filter((c) => c.id !== id);
  saveConversations(convos);
  return convos;
}

export function updateConversation(convo: Conversation) {
  const convos = getConversations();
  const idx = convos.findIndex((c) => c.id === convo.id);
  if (idx >= 0) convos[idx] = convo;
  else convos.unshift(convo);
  saveConversations(convos);
}

export function generateTitle(firstMessage: string): string {
  return firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "…" : "");
}

export function getTheme(): "dark" | "light" {
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
}

export function setTheme(theme: "dark" | "light") {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const MODEL_INFO: Record<ModelId, { name: string; color: string; icon: string; description: string }> = {
  quillbot: {
    name: "Quillbot",
    color: "hsl(var(--model-quillbot))",
    icon: "🔵",
    description: "Fast general assistant with web search",
  },
  gemini: {
    name: "Gemini 2.5 Flash",
    color: "hsl(var(--model-gemini))",
    icon: "🟢",
    description: "Image analysis & deep reasoning",
  },
  deepseek: {
    name: "DeepSeek R1",
    color: "hsl(var(--model-deepseek))",
    icon: "🟣",
    description: "Reasoning-focused model",
  },
};
