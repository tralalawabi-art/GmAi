

## Implementasi URL-based Conversation Routing

Saat ini, conversation ID hanya disimpan di state React (memori) dan localStorage. Ketika user refresh halaman, chat aktif hilang. Kita akan menambahkan routing berbasis URL agar setiap percakapan punya alamat unik.

### Perubahan yang akan dilakukan:

**1. Tambah route `/chat/:conversationId` di App.tsx**
- Route baru: `/chat/:id` mengarah ke halaman Index
- Route `/` tetap sebagai landing (welcome screen)

**2. Update `useChat` hook untuk sinkron dengan URL**
- Saat `newChat()` dipanggil, navigasi ke `/chat/{uuid}`
- Saat user membuka `/chat/{id}`, otomatis set conversation aktif berdasarkan ID di URL
- Saat `selectChat(id)` dipanggil, navigasi ke `/chat/{id}`
- Saat `deleteChat(id)` dipanggil dan itu chat aktif, navigasi kembali ke `/`

**3. Update Index.tsx**
- Baca `conversationId` dari `useParams()`
- Kirim ke `useChat` sebagai initial active ID
- Saat user mengirim pesan pertama tanpa conversation (dari welcome screen), otomatis buat conversation baru dan redirect ke `/chat/{id}`

**4. Backend tetap sama**
- Backend edge function sudah menerima full message history dari frontend
- Tidak perlu perubahan di backend karena context/memory sudah dikirim dari frontend via `messages` array

### Detail Teknis

**App.tsx:**
- Tambah `<Route path="/chat/:conversationId" element={<Index />} />`

**useChat hook:**
- Terima `useNavigate()` dan `conversationId` param
- `newChat()`: buat conversation, lalu `navigate(/chat/{id})`
- `selectChat(id)`: set active + `navigate(/chat/{id})`
- `deleteChat(id)`: hapus, jika aktif `navigate(/)`
- Inisialisasi: jika ada `conversationId` di URL, set sebagai `activeId`

**Index.tsx:**
- Gunakan `useParams()` untuk ambil `conversationId`
- Pass ke hook atau gunakan untuk sinkronisasi

### Alur User Setelah Implementasi
1. User buka `/` -- melihat welcome screen
2. Klik "New Chat" -- redirect ke `/chat/550e8400-...`
3. Ketik pesan -- dikirim dengan conversation ID, AI merespon dengan konteks
4. Refresh halaman -- tetap di `/chat/550e8400-...`, chat history muncul dari localStorage
5. Klik chat lain di sidebar -- URL berubah ke `/chat/{id-lain}`
6. Share URL ke tab lain -- langsung buka percakapan yang sama

