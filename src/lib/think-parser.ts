export interface ThinkResult {
  thinking: string | null;
  answer: string;
  isThinking: boolean;
}

export function parseThinkContent(raw: string): ThinkResult {
  const openTag = "<think>";
  const closeTag = "</think>";

  const openIdx = raw.indexOf(openTag);

  // No think tag at all
  if (openIdx === -1) {
    return { thinking: null, answer: raw, isThinking: false };
  }

  const closeIdx = raw.indexOf(closeTag);

  // Has <think> but no </think> yet — still thinking
  if (closeIdx === -1) {
    const thinkContent = raw.slice(openIdx + openTag.length);
    return { thinking: thinkContent, answer: "", isThinking: true };
  }

  // Both tags present — finished thinking
  const thinkContent = raw.slice(openIdx + openTag.length, closeIdx);
  const answer = raw.slice(closeIdx + closeTag.length).trim();

  return { thinking: thinkContent, answer, isThinking: false };
}
