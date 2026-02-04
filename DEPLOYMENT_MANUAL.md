# 🚀 Panduan Deploy ke Koyeb (Web Dashboard)

Panduan lengkap untuk deploy **Telegram Bot** dan **Filestash UI** ke Koyeb menggunakan GitHub integration.

---

## 📋 Persiapan

### 1. Pastikan GitHub Repository Sudah Siap

Repository Anda: `https://github.com/arenoe-studio/telegram-documenter`

Pastikan semua file sudah ter-push:

```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

### 2. Login ke Koyeb

Buka: [https://app.koyeb.com/](https://app.koyeb.com/)

---

## 🤖 PART A: Deploy Telegram Bot

### Step 1: Create New Service

1. Di dashboard Koyeb, klik **"Create Service"**
2. Pilih **"GitHub"** sebagai deployment source
3. Pilih repository: **arenoe-studio/telegram-documenter**
4. Branch: **main**

### Step 2: Configure Builder

1. **Service Name**: `telegram-bot` (atau nama lain yang Anda suka)
2. **Builder**: Pilih **Dockerfile**
3. **Dockerfile location**: Biarkan default `Dockerfile` (di root folder)
4. **Port**: `3000`

### Step 3: Environment Variables

Klik **"Add Variable"** untuk setiap item berikut. Copy nilai dari file `.env` Anda:

| Variable Name             | Value (dari .env Anda)                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`      | `8071010053:AAHTfJx9HEew79IXAPQq6-A_J-5t7LJQGmc`                                                                             |
| `TELEGRAM_WEBHOOK_SECRET` | `e22a066f4b42fe1df07c96249c7e7d48af3582d7bbe2488af5801428ff41c340`                                                           |
| `DATABASE_URL`            | `postgresql://postgres.rgawfbtxitoudwfqhxik:2x6eh9oDyyyKACkpjfZ4yHwb@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres` |
| `B2_APPLICATION_KEY_ID`   | `0051a8771b6bcba0000000001`                                                                                                  |
| `B2_APPLICATION_KEY`      | `K005DLmd8cpK7NsJ9R6DA22EAH5Wa0o`                                                                                            |
| `B2_BUCKET_ID`            | `918ab8b7f7912b469bcc0b1a`                                                                                                   |
| `B2_BUCKET_NAME`          | `Arenoe-Studio-Documentation`                                                                                                |
| `ENCRYPTION_KEY`          | `57bb2a83d53e0c812d98876ef8f5b44a0990ef6121924ca3c0b4559ecee80948`                                                           |
| `NODE_ENV`                | `production`                                                                                                                 |
| `WEBHOOK_URL`             | _Kosongkan dulu, akan diisi setelah deploy_                                                                                  |

> **💡 Tip**: Untuk `WEBHOOK_URL`, setelah service deploy, Anda akan dapat URL seperti `https://telegram-bot-xxx.koyeb.app`. Copy URL itu, lalu masuk ke Settings -> Environment Variables -> Edit `WEBHOOK_URL` dan isi dengan URL tersebut.

### Step 4: Deploy

1. **Instance**: Pilih **Free** (0.1 vCPU, 512MB RAM)
2. **Region**: Pilih yang terdekat (Frankfurt/Singapore)
3. Klik **"Deploy"**

### Step 5: Verifikasi

1. Tunggu hingga status menjadi **"Healthy"** (sekitar 2-3 menit)
2. Copy URL public yang diberikan
3. Update `WEBHOOK_URL` di Environment Variables dengan URL tersebut
4. Service akan auto-redeploy
5. Test bot Anda di Telegram dengan `/start`

---

## 📂 PART B: Deploy Filestash UI

### Step 1: Create New Service (Lagi)

1. Klik **"Create Service"** lagi (untuk service kedua)
2. Pilih **"GitHub"**
3. Pilih repository yang sama: **arenoe-studio/telegram-documenter**
4. Branch: **main**

### Step 2: Configure Builder

1. **Service Name**: `filestash-ui` (atau nama lain)
2. **Builder**: Pilih **Dockerfile**
3. **Dockerfile location**: **PENTING!** Ubah menjadi `deploy/Dockerfile.filestash`
4. **Port**: `8334`

### Step 3: Environment Variables

Klik **"Add Variable"** untuk setiap item berikut:

| Variable Name          | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `ONLY_PLUGINS`         | `s3`                                                                |
| `S3_ENDPOINT`          | `s3.us-east-005.backblazeb2.com`                                    |
| `S3_REGION`            | `us-east-005`                                                       |
| `S3_ACCESS_KEY_ID`     | `0051a8771b6bcba0000000001`                                         |
| `S3_SECRET_ACCESS_KEY` | `K005DLmd8cpK7NsJ9R6DA22EAH5Wa0o`                                   |
| `S3_BUCKET`            | `Arenoe-Studio-Documentation`                                       |
| `INIT_ADMIN_PASSWORD`  | `25d138f89b865c602a5242c0595da851cd6d4bb5b70cb7f37352b555914745e5n` |
| `APPLICATION_URL`      | _Kosongkan dulu_                                                    |

### Step 4: Deploy

1. **Instance**: Pilih **Free**
2. **Region**: Sama dengan Bot (untuk efisiensi)
3. Klik **"Deploy"**

### Step 5: Verifikasi

1. Tunggu hingga status **"Healthy"**
2. Buka URL public yang diberikan (misal: `https://filestash-ui-xxx.koyeb.app`)
3. Jika diminta login:
   - **Backend**: S3
   - **Endpoint**: `s3.us-east-005.backblazeb2.com`
   - **Access Key**: `0051a8771b6bcba0000000001`
   - **Secret Key**: `K005DLmd8cpK7NsJ9R6DA22EAH5Wa0o`
   - **Bucket**: `Arenoe-Studio-Documentation`
4. Set password admin (gunakan password yang sama dengan `INIT_ADMIN_PASSWORD`)

---

## ✅ Checklist Akhir

- [ ] Bot Telegram berjalan dan merespons `/start`
- [ ] Filestash UI bisa diakses dan menampilkan file dari B2
- [ ] Webhook URL sudah diupdate di Bot service
- [ ] Kedua service status "Healthy"

---

## 🔧 Troubleshooting

### Bot tidak merespons

- Cek Logs di Koyeb Dashboard
- Pastikan `WEBHOOK_URL` sudah diisi dengan URL yang benar
- Pastikan `TELEGRAM_BOT_TOKEN` valid

### Filestash masih minta login manual

- Ini normal untuk deployment pertama
- Login sekali, konfigurasi akan tersimpan
- Jika restart, mungkin perlu login lagi (karena stateless)

### Service gagal build

- Cek **Dockerfile location** sudah benar
- Untuk Bot: `Dockerfile` (default)
- Untuk Filestash: `deploy/Dockerfile.filestash`

---

## 📞 Bantuan Lebih Lanjut

Jika ada error, screenshot bagian **Logs** di Koyeb Dashboard dan tanyakan ke saya!
