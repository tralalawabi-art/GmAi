
Masalah utamanya sudah bisa dilacak, dan ini bukan karena “backend belum dibuat”. Backend + frontend sudah ada dan request ke backend sebenarnya berjalan.

Ringkasan temuan dari investigasi:
1) Request ke backend untuk ketiga model berhasil (status 200) dan streaming SSE keluar.
- Quillbot: mengembalikan SSE `data: {"choices":[{"delta":{"content":{...}}}]}`
- Gemini: mengembalikan teks normal.
- DeepSeek: mengembalikan stream chunk normal.
2) Di frontend, balasan assistant tidak dirender karena komponen markdown dipanggil tanpa isi konten.
- File: `src/components/chat/MessageBubble.tsx`
- `ReactMarkdown` dipakai self-closing (`<ReactMarkdown ... />`) sehingga `message.content` tidak pernah tampil.
3) Khusus Quillbot, backend saat ini kadang mengirim object pada `delta.content` (bukan string), jadi walaupun render diperbaiki, isinya bisa jadi `[object Object]`/tidak sesuai.
- File: `supabase/functions/chat/index.ts`
- `reply` mengambil `data.response` lebih dulu, padahal nilainya bisa object `{ answer, chatId, webSearch }`.

Rencana implementasi perbaikan:

1. Perbaiki rendering pesan assistant di frontend (prioritas tertinggi)
- File: `src/components/chat/MessageBubble.tsx`
- Ubah komponen markdown agar menerima isi:
  - dari: `<ReactMarkdown ... />`
  - ke: `<ReactMarkdown ...>{message.content}</ReactMarkdown>`
- Dampak: semua model langsung bisa terlihat output-nya di UI.

2. Normalisasi output Quillbot agar selalu string
- File: `supabase/functions/chat/index.ts` pada `handleQuillbot`
- Tambahkan extractor aman:
  - jika `data.response` string → pakai itu
  - jika `data.response` object dan punya `answer` → pakai `data.response.answer`
  - fallback ke `data.message`, `data.text`, `data.result`
  - fallback terakhir `JSON.stringify(...)`
- Pastikan `delta.content` yang dikirim SSE selalu string.
- Dampak: Quillbot tidak lagi mengirim object mentah ke frontend.

3. Hardening parser stream di frontend (opsional tapi disarankan)
- File: `src/lib/chat-api.ts`
- Saat parse SSE:
  - jika `content` string → langsung kirim
  - jika `content` object dengan `answer` → kirim `answer`
  - selain itu stringify aman
- Ini jadi lapisan perlindungan jika provider lain mengubah format respons.

4. Perbaiki observability error agar tidak “silent”
- File: `supabase/functions/chat/index.ts`
- Saat provider gagal (`!resp.ok`), selain generic message, sertakan ringkasan status/provider pada log internal.
- Di frontend, pertahankan tampilan error di bubble seperti sekarang agar user tahu penyebabnya.

5. Validasi end-to-end setelah perubahan
- Uji 3 model dari UI:
  - Quillbot: pastikan teks jawaban muncul (bukan object)
  - Gemini: pastikan streaming teks muncul bertahap
  - DeepSeek: pastikan chunk bergabung jadi jawaban utuh
- Uji juga:
  - chat baru
  - percakapan lama
  - kirim gambar ke Gemini
  - tombol stop generation

Perkiraan akar masalah final:
- “Model tidak merespon” yang user rasakan terutama karena layer tampilan assistant rusak (konten tidak dirender), bukan karena backend tidak ada.
- Ditambah satu bug format data di Quillbot yang membuat konten bukan string.

Catatan teknis tambahan:
- Warning `Function components cannot be given refs` yang muncul di console kemungkinan terpisah dari issue “AI tidak muncul”, tapi tetap bisa kita rapikan setelah respons model sudah normal.
- Fokus patch awal: tampilkan konten assistant + normalisasi Quillbot string agar user langsung merasakan perbaikan.
