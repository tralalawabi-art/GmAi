
## Rencana Revisi: Spacing Markdown + Tambah 2 Model Baru

### 1. Perbaiki Jarak/Spacing Respon AI

**Masalah**: ReactMarkdown merender paragraf terlalu rapat karena CSS prose override menghapus margin paragraf.

**File: `src/components/chat/MessageBubble.tsx`**
- Ubah class prose container agar paragraf punya jarak:
  - Dari: `[&>*:first-child]:mt-0 [&>*:last-child]:mb-0`
  - Ke: `[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-4 [&_p:last-child]:mb-0`
- Ini memberi jarak antar paragraf (`mb-4` = ~16px) agar respons AI mudah dibaca.

### 2. Tambah Model Claude Haiku 3

**A. Backend: `supabase/functions/chat/index.ts`**
- Tambah handler `handleClaude(messages)`:
  - Gunakan API DeepAI seperti kode user: POST ke `https://api.deepai.org/hacking_is_a_serious_crime`
  - Body: `chat_style=claudeai_0`, `chatHistory=JSON.stringify(messages)`, `model=standard`, `session_uuid=uuid`, `hacker_is_stinky=very_stinky`
  - Header: api-key dinamis (`tryit-{random}-a3edf17b505349f1794bcdbc7290a045`), user-agent, referer
  - Respons: text biasa, bungkus jadi SSE `data: {"choices":[{"delta":{"content":"..."}}]}\n\ndata: [DONE]\n\n`
  - Support chat history: kirim seluruh `messages` array sebagai `chatHistory`
- Tambah routing: `if (model === "claude") return await handleClaude(messages);`

**B. Backend: `supabase/functions/chat/index.ts`**
- Tambah handler `handleGemini3Flash(messages)`:
  - POST ke `https://www.puruboy.kozow.com/api/ai/gemini`
  - Body: `{ "prompt": lastMessage }`
  - Respons: `data.result.answer` (string)
  - Bungkus jadi SSE format standar
- Tambah routing: `if (model === "gemini3flash") return await handleGemini3Flash(messages);`

**C. Frontend: `src/lib/chat-store.ts`**
- Update `ModelId` type: tambah `"claude"` dan `"gemini3flash"`
- Tambah entry di `MODEL_INFO`:
  - `claude`: name "Claude Haiku 3", icon "🟠", color baru (orange), description "Fast & smart assistant"
  - `gemini3flash`: name "Gemini 3 Flash", icon "⚡", color baru (cyan/teal), description "Gemini 3 via custom API"

**D. CSS: `src/index.css`**
- Tambah CSS variable untuk warna model baru:
  - `--model-claude`: warna orange (~25 90% 55%)
  - `--model-gemini3flash`: warna cyan (~185 80% 50%)
  - Di tema light dan dark

### 3. Detail Teknis

**Claude handler (edge function):**
```text
POST https://api.deepai.org/hacking_is_a_serious_crime
Content-Type: application/x-www-form-urlencoded
Headers:
  api-key: tryit-{random11digit}-a3edf17b505349f1794bcdbc7290a045
  user-agent: Mozilla/5.0...
  referer: https://deepai.org/chat/claude-3-haiku

Body:
  chat_style=claudeai_0
  chatHistory=[{"role":"system","content":"..."}, {"role":"user","content":"..."}, ...]
  model=standard
  session_uuid={uuid}
  hacker_is_stinky=very_stinky

Response: plain text string --> wrap ke SSE
```

**Gemini 3 Flash handler (edge function):**
```text
POST https://www.puruboy.kozow.com/api/ai/gemini
Content-Type: application/json
Body: { "prompt": "user message" }
Response: { success: true, result: { answer: "..." } }
--> extract data.result.answer, wrap ke SSE
```

**File yang diubah:**
1. `src/components/chat/MessageBubble.tsx` -- fix spacing paragraf
2. `supabase/functions/chat/index.ts` -- tambah handleClaude + handleGemini3Flash
3. `src/lib/chat-store.ts` -- tambah ModelId + MODEL_INFO untuk claude & gemini3flash
4. `src/index.css` -- tambah CSS variable warna model baru
