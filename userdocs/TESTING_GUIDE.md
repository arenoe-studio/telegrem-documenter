# 🧪 Testing Guide: Telegram Documenter

Dokumen ini berisi panduan pengujian komprehensif untuk memverifikasi fungsionalitas Telegram Documenter v1.0.

---

## 🤖 1. Automated Tests (Unit Tests)

Project ini memiliki automated unit tests untuk memverifikasi logika inti yang kritikal (Encryption & Validation).

### Cara Menjalankan:

```bash
npm run test
```

### Scope Testing:

- **Encryption Service:** Verifikasi enkripsi/dekripsi AES-256-GCM, format access key, dan integritas data.
- **Validators:** Verifikasi format Session ID, Access Key, Master Key, dan validasi file input.

---

## 👨‍💻 2. Manual Testing (User Acceptance Testing)

Karena natura interaktif dari Telegram Bot, pengujian fungsional terbaik dilakukan secara manual. Ikuti skenario berikut:

### 🛠️ Persiapan

1. Pastikan database running dan schema sudah di-deploy: `npx prisma db push`
2. Jalankan bot: `npm run dev`
3. Siapkan 2 akun Telegram (atau 1 akun untuk simulasi kedua role):
   - **Akun A (ADMIN):** Set `TELEGRAM_ADMIN_IDS` di `.env` dengan ID akun ini.
   - **Akun B (USER):** Akun biasa.

### 📋 Skenario 1: Admin Flow (Session Management)

**Actor:** ADMIN

1. **Start Bot:**
   - Kirim: `/start`
   - Ekspektasi: Muncul menu interaktif khusus ADMIN.
2. **Create Session:**
   - Pilih: `➕ Buat Session Baru`
   - Input Prefix: Ketik `TES` (harus 2-3 huruf)
   - Input Deskripsi: Ketik `Uji Coba Lapangan`
   - Konfirmasi: Klik `✅ Ya, Buat Session`
   - **Ekspektasi:** Bot membalas dengan Detail Session (Session ID, Access Key). **CATAT Access Key ini.**
3. **Cek Status:**
   - Kirim: `/status`
   - Ekspektasi: Info "Tidak ada session aktif" (karena baru buat, belum access).
4. **Access Session Sendiri (Admin Override):**
   - Pilih: `📂 Pilih Session` -> `🔑 Input Access Key` (atau Masukkan Session ID)
   - Input Session ID: Masukkan ID yang baru dibuat (misal `TES-1005-01`).
   - Input Key: Masukan sembarang key (Admin bisa override) atau Master Key.
   - **Ekspektasi:** "Session Activated". Banner session aktif muncul.

### 📋 Skenario 2: User Flow (Access & Lockout)

**Actor:** USER

1. **Start Bot:**
   - Kirim: `/start`
   - Ekspektasi: Muncul menu USER (lebih terbatas dari Admin).
2. **Access Session (Happy Path):**
   - Pilih: `📂 Pilih Session` -> `🔑 Input Access Key`
   - Input Session ID: Masukkan ID dari Skenario 1.
   - Input Key: Masukkan **Access Key yang benar**.
   - **Ekspektasi:** "Session Activated". Menu berubah jadi mode upload.
3. **Logout/Switch:**
   - Kirim: `/end`
   - Ekspektasi: Session berakhir, kembali ke menu utama.
4. **Access Session (Failed Path - Lockout):**
   - Coba login lagi dengan Session ID yang sama.
   - Input Key: Masukkan key **SALAH** 3 kali berturut-turut.
   - **Ekspektasi:** Setelah 3x salah, Bot akan membalokir (Lockout) user selama 15 menit. Coba lagi ke-4 kali, bot harus menolak.

### 📋 Skenario 3: Upload System (Single Upload)

**Actor:** USER (sedang aktif di session)

1. **Upload Foto (Compressed):**
   - Kirim sebuah foto (checklist "Compress image" di Telegram).
   - **Ekspektasi:**
     - Progress message "⬇️ Downloading..." -> "⬆️ Uploading..."
     - Final message: "✅ Upload Complete" dengan info nama file & size.
     - Cek Backblaze B2 (opsional): File harus muncul di folder session.
2. **Upload Dokumen (Full Quality):**
   - Kirim foto sebagai **File/Document**.
   - **Ekspektasi:** Sama seperti upload foto, tapi file size lebih besar.
3. **Cek Statistik:**
   - Klik tombol `📊 Status Session` atau kirim `/status`.
   - **Ekspektasi:** Jumlah file bertambah, Total Size bertambah.

### 📋 Skenario 4: Batch Upload Mode

**Actor:** USER (sedang aktif di session)

1. **Start Batch:**
   - Kirim: `/batch`
   - Ekspektasi: "📦 Batch Mode Activated".
2. **Collect Photos:**
   - Kirim 3-5 foto berturut-turut.
   - **Ekspektasi:** Bot tidak langsung upload, tapi membalas "📦 Batch: X foto dikumpulkan".
3. **Process Batch:**
   - Kirim: `/endbatch`
   - Ekspektasi: Bot meminta deskripsi.
   - Input: Ketik `Dokumentasi Titik A`.
   - **Ekspektasi:**
     - Bot menampilkan progress bar batch "📦 Batch Upload Progress".
     - Update progress per foto (1/3, 2/3, 3/3).
     - Final report: "✅ Batch Upload Complete" dengan ringkasan sukses/gagal.
4. **Verify:**
   - Cek `/status`. Jumlah file harus bertambah sesuai jumlah batch.

### 📋 Skenario 5: Error Handling & Retry

**Actor:** USER

1. **Simulasi Error (Network/Auth):**
   - _Note: Sulit disimulasikan tanpa memutus network server._
   - Alternatif: Upload file bukan gambar (misal PDF atau ZIP).
   - **Ekspektasi:** Bot menolak "❌ File Tidak Valid".
2. **Refresh Command:**
   - Kirim: `/refresh`
   - **Ekspektasi:** Bot cek status upload pending/failed. Jika bersih: "All Good!".

---

## ✅ Checklist Deployment

Sebelum deploy ke production (Koyeb):

- [ ] Semua Environment Variables di `.env` sudah di-set di Koyeb Secrets.
- [ ] `DATABASE_URL` mengarah ke Supabase Production (Transaction Pooler).
- [ ] `NODE_ENV` set ke `production`.
- [ ] Webhook URL (`WEBHOOK_URL`) valid dan HTTPS.
