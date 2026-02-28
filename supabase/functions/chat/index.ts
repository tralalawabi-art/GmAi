import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, webSearch } = await req.json();

    if (model === "quillbot") {
      return await handleQuillbot(messages, webSearch);
    } else if (model === "gemini") {
      return await handleGemini(messages);
    } else if (model === "deepseek") {
      return await handleDeepSeek(messages);
    }

    return new Response(JSON.stringify({ error: "Unknown model" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ---- Quillbot (FmcStore API) — GET with query params ----
async function handleQuillbot(messages: any[], webSearch?: boolean) {
  const lastMsg = messages[messages.length - 1]?.content || "";

  const targetUrl = new URL("https://api.fmcstore.web.id/api/ai/quillbot");
  targetUrl.searchParams.set("query", lastMsg);
  targetUrl.searchParams.set("webSearch", webSearch ? "true" : "false");

  const resp = await fetch(targetUrl.toString());

  if (!resp.ok) {
    const text = await resp.text();
    console.error("FmcStore error:", resp.status, text);
    return new Response(JSON.stringify({ error: "Quillbot API error" }), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await resp.json();
  const reply = data.response || data.message || data.text || data.result || JSON.stringify(data);

  // Convert to SSE format for consistent frontend handling
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chunk = JSON.stringify({
        choices: [{ delta: { content: reply } }],
      });
      controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// ---- Gemini 2.5 Flash ----
async function handleGemini(messages: any[]) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Build Gemini contents from conversation history
  const contents = messages.map((m: any) => {
    const parts: any[] = [];

    if (m.imageBase64) {
      // Extract base64 data and mime type
      const match = m.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    if (m.content) {
      parts.push({ text: m.content });
    }

    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Gemini error:", resp.status, text);
    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Gemini API error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Transform Gemini SSE to OpenAI-compatible SSE
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ") || line.trim() === "") continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (text) {
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: text } }],
                });
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch {
              // skip
            }
          }
        }
      } catch (e) {
        console.error("Stream error:", e);
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// ---- DeepSeek R1 (SambaNova) ----
async function handleDeepSeek(messages: any[]) {
  const SAMBANOVA_API_KEY = Deno.env.get("SAMBANOVA_API_KEY");
  if (!SAMBANOVA_API_KEY) {
    return new Response(JSON.stringify({ error: "SambaNova API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resp = await fetch("https://api.sambanova.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SAMBANOVA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "DeepSeek-R1-Distill-Llama-70B",
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("SambaNova error:", resp.status, text);
    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "DeepSeek API error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // SambaNova uses OpenAI-compatible SSE, pass through
  return new Response(resp.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}
