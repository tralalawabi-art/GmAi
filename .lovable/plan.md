

## Rencana Implementasi: Copy/Regenerate + DeepSeek Thinking Mode

### Status Item #1 & #2: Sudah Selesai
URL-based routing (`/chat/:conversationId`) sudah diimplementasikan di update terakhir. Route, hook, dan sinkronisasi URL sudah berjalan.

---

### Item #3: Tombol Copy & Regenerate pada Pesan

**File: `src/components/chat/MessageBubble.tsx`**
- Tambahkan toolbar kecil di bawah setiap bubble assistant dengan 2 tombol:
  - **Copy**: Salin seluruh konten jawaban ke clipboard (gunakan `navigator.clipboard.writeText`)
  - **Regenerate**: Panggil callback `onRegenerate` yang dikirim dari parent
- Toolbar muncul saat hover (desktop) atau selalu visible (mobile)
- Gunakan ikon dari lucide-react: `Copy`, `Check`, `RefreshCw`

**File: `src/hooks/use-chat.ts`**
- Tambahkan fungsi `regenerate(messageId)`:
  - Cari pesan assistant berdasarkan ID
  - Hapus pesan assistant tersebut dari conversation
  - Kirim ulang pesan user terakhir sebelumnya via `sendMessage`
- Export fungsi `regenerate` dari hook

**File: `src/pages/Index.tsx`**
- Pass `onRegenerate` callback ke `MessageBubble`

---

### Item #4: DeepSeek R1 Thinking Mode

DeepSeek R1 mengirim respons dengan format `<think>...</think>` diikuti jawaban utama. Kita perlu:

**A. Parsing konten `<think>` (Frontend)**

**File: `src/lib/think-parser.ts`** (baru)
- Fungsi `parseThinkContent(raw: string)` yang mengembalikan:
  ```text
  { thinking: string | null, answer: string, isThinking: boolean }
  ```
- Logic: cari `<think>` dan `</think>` dalam string
  - Jika ada `<think>` tapi belum ada `</think>` --> sedang berpikir (`isThinking: true`)
  - Jika ada `<think>...</think>` --> selesai berpikir, pisahkan thinking dan answer
  - Jika tidak ada tag --> langsung answer biasa

**B. UI Thinking pada MessageBubble**

**File: `src/components/chat/MessageBubble.tsx`**
- Untuk pesan DeepSeek (`message.model === "deepseek"`), jalankan `parseThinkContent`
- **State 1 - Sedang Berpikir** (`isThinking: true`):
  - Tampilkan animasi khusus: ikon otak berdenyut dengan teks "Sedang berpikir..." 
  - Background gradien halus yang beranimasi (pulse)
  - Tampilkan preview teks thinking yang sedang streaming dalam font kecil italic abu-abu
- **State 2 - Selesai**:
  - Tampilkan jawaban utama dengan markdown normal
  - Di atas jawaban, tambahkan collapsible section:
    - Header: ikon otak + "Lihat proses berpikir" (klik untuk expand/collapse)
    - Konten: teks thinking dalam background abu-abu/transparan berbeda
    - Default: collapsed

**C. CSS untuk animasi thinking**

**File: `src/index.css`**
- Tambahkan animasi `thinking-pulse` untuk efek berdenyut pada ikon otak
- Tambahkan style `thinking-gradient` untuk background bergerak saat AI berpikir

---

### Detail Teknis

**Parsing `<think>` tag:**
```text
Input:  "<think>reasoning here</think>\n\nFinal answer here"
Output: { thinking: "reasoning here", answer: "Final answer here", isThinking: false }

Input:  "<think>still reasoning..."
Output: { thinking: "still reasoning...", answer: "", isThinking: true }
```

**Alur Data:**
1. DeepSeek streaming --> `onDelta` menambah chunk ke `assistantContent`
2. `MessageBubble` menerima `message.content` yang berisi raw text dengan `<think>` tag
3. `parseThinkContent()` memisahkan thinking vs answer
4. UI merender sesuai state (berpikir/selesai)

**Komponen baru yang dibutuhkan:**
- `ThinkingAnimation`: Animasi saat AI berpikir (pulse brain icon + gradient)
- `ThinkingCollapsible`: Expand/collapse untuk riwayat berpikir setelah selesai

**File yang diubah:**
1. `src/lib/think-parser.ts` -- baru, parser tag think
2. `src/components/chat/MessageBubble.tsx` -- tambah Copy/Regenerate + thinking UI
3. `src/hooks/use-chat.ts` -- tambah fungsi regenerate
4. `src/pages/Index.tsx` -- pass onRegenerate ke MessageBubble
5. `src/index.css` -- animasi thinking

