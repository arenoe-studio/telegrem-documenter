# 📸 Telegram Documenter

**Telegram Documenter** adalah bot Telegram pintar yang dirancang untuk mengumpulkan foto dan dokumen gambar dari Telegram dan mengunggahnya secara otomatis ke penyimpanan awan **Backblaze B2**. Ideal untuk mendokumentasikan proyek, survei lapangan, atau pengumpulan data visual secara massal dengan struktur folder yang rapi dan keamanan akses yang terjamin.

## ✨ Fitur Utama

- 🚀 **Manajemen Session**: Buat session unik dengan deskripsi untuk setiap proyek pengumpulan data.
- 🔑 **Akses Terproteksi**: Masuk ke session menggunakan _Access Key_ unik (AES-bit encrypted).
- 📦 **Mode Batch Upload**: Kirim banyak foto sekaligus, beri deskripsi kolektif, dan biarkan bot memprosesnya di latar belakang.
- 📂 **Organisasi Folder Otomatis**: Secara otomatis membuat struktur folder yang bersih di Backblaze B2 berdasarkan nama session.
- 🛡️ **Panel Admin Modern**: Fitur admin untuk melihat daftar session, detail statistik, dan menghapus session beserta file terkait di cloud.
- 🔐 **Master Key**: Keamanan tingkat lanjut bagi admin untuk memvalidasi akses tanpa input manual kunci session.
- 🔄 **Refresh Flow**: Mekanisme untuk memantau status upload dan memicu retry pada file yang gagal.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) v20+
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bot Framework**: [grammY](https://grammy.dev/)
- **Database ORM**: [Prisma](https://www.prisma.io/) (SQLite/PostgreSQL)
- **Cloud Storage**: [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
- **Server**: [Express](https://expressjs.com/) (Webhook Support)
- **Validation**: [Zod](https://zod.dev/)

## 📂 Struktur Proyek

Codebase ini menggunakan arsitektur modular dengan prinsip **Separation of Concerns**:

```text
src/
├── bot/                # Logika utama Bot
│   ├── handlers/       # Modular command & action handlers
│   │   ├── admin/      # Handle fitur admin
│   │   ├── batch/      # Handle pengiriman foto massal
│   │   ├── session/    # Handle pembuatan & akses session
│   │   ├── start/      # Handle menu utama & start/help
│   │   └── upload/     # Handle upload foto/dokumen satu per satu
│   ├── keyboards/      # Definisi menu tombol inline
│   ├── middlewares/    # Auth, Session, & Error handling middleware
│   ├── bot.ts          # Integrasi bot grammY
│   └── handlers-register.ts # Registrasi semua handler terpusat
├── config/             # Konfigurasi aplikasi
│   ├── database.ts     # Koneksi Prisma
│   └── env.ts          # Validasi environment vars (Zod)
├── services/           # Business logic & integrations
│   ├── b2/             # Integrasi Backblaze B2 service
│   ├── session/        # Logika CRUD & Auth session
│   ├── upload/         # Logika download Telegram & B2 orchestration
│   └── encryption.service.ts # AES-256 encryption utils
├── utils/              # Helper functions
│   ├── formatters/     # Format pesan teks & indikator progress
│   ├── admin.seeder.ts # Seeding admin dari environment
│   ├── logger.ts       # Logging system
│   └── validators.ts   # Validasi file & input
└── index.ts            # Entry point aplikasi & Express server
```

## 🚀 Instalasi & Pengoperasian

### 1. Prasyarat

- Node.js installed.
- Akun Backblaze B2 dengan Bucket dan Application Key.
- Bot Token dari [@BotFather](https://t.me/botfather).

### 2. Setup Database & Depedensi

```bash
# Clone repository
git clone <repository-url>
cd telegram-documenter

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan kredensial Anda

# Inisialisasi Database
npx prisma db push
```

### 3. Menjalankan Aplikasi

```bash
# Mode Development (Long Polling)
npm run dev

# Mode Produksi (Build & Run)
npm run build
npm start
```

## ⚙️ Konfigurasi Environment

Pastikan `.env` Anda berisi variabel berikut:

- `TELEGRAM_BOT_TOKEN`: Token dari BotFather.
- `TELEGRAM_ADMIN_IDS`: Daftar ID user Telegram admin (pisahkan dengan koma).
- `B2_APPLICATION_KEY_ID`: ID kunci dari Backblaze B2.
- `B2_APPLICATION_KEY`: Kunci aplikasi Backblaze B2.
- `B2_BUCKET_NAME`: Nama bucket Backblaze B2.
- `ENCRYPTION_KEY`: Kunci heksadesimal 32-byte (Gunakan panduan di .env.example untuk generate).
- `DATABASE_URL`: Link database (mendukung SQLite file atau PostgreSQL).

## 📖 Panduan Penggunaan

### Untuk Pengguna Umum

1. Klik `/start` dan pilih **Buat Session Baru**.
2. Masukkan prefix (misal: PROJ) dan deskripsi.
3. Simpan **Access Key** yang diberikan bot.
4. User lain dapat masuk dengan klik `/start` -> **Pilih Session Aktif** -> Masukkan Session ID & Access Key.
5. Kirim foto atau gunakan perintah `/batch` untuk mengirim banyak file sekaligus.

### Untuk Admin

1. Perintah `/admin` akan membuka panel kontrol.
2. Gunakan `/masterkey` untuk bypass validasi kunci session secara manual jika diperlukan.
3. Pantau status session dan hapus data yang sudah tidak diperlukan melalui menu admin.

## 📄 Lisensi

Distribusi di bawah lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
