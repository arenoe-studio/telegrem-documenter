# PROJECT REQUIREMENTS: TELEGRAM DOCUMENTER

## 📋 Project Overview

**Project Name:** telegram-documenter  
**Version:** 1.0.0  
**Type:** Telegram Bot - Cloud Photo Storage & Documentation System  
**Target Users:** Survey teams, project documentation teams, field workers  
**Deployment:** Free-tier infrastructure (Koyeb + Supabase + Backblaze B2)

---

## 🎯 Application Context

### Purpose
Bot Telegram untuk sistem penyimpanan foto/dokumentasi yang handal dengan manajemen session terenkripsi, upload tracking, dan logging metadata otomatis untuk keperluan survey dan dokumentasi proyek.

### Target Users
- **ADMIN**: Team leaders, project managers (dapat membuat session, melihat keys)
- **USER**: Field workers, surveyors (dapat upload foto ke session yang authorized)

### Core Features
1. **Session Management**: Create/access sessions dengan encrypted access keys
2. **Photo Upload**: Upload dari gallery atau camera Telegram ke Backblaze B2
3. **Batch Upload**: Upload multiple photos dengan single description
4. **Metadata Extraction**: Extract EXIF (GPS, timestamp) dan log ke Google Sheets
5. **Progress Tracking**: Real-time upload status dan error handling
6. **Role-Based Access**: ADMIN (full control) vs USER (restricted access)

### Key Workflows

**ADMIN Flow:**
```
/start → Create New Session → Generate Key → Set Prefix → Add Description 
→ Session Created → Share Key with Users
```

**USER Flow:**
```
/start → Choose Existing Session → Input Session ID → Input Access Key 
→ Upload Photos → /status (check progress) → /end (finish session)
```

**Log Mode Flow:**
```
/settings → Enable Log Dokumentasi → Google OAuth → Send Photo (as Document) 
→ Auto-extract EXIF → Input Description → Upload + Log to Sheets
```

### Out of Scope (v1.0)
- ❌ Video upload
- ❌ Document files (PDF, DOCX)
- ❌ Photo editing features
- ❌ Web interface (Telegram only)
- ❌ Multi-language support (Indonesian only)
- ❌ Real-time collaboration

---

## 🤖 AI Model / Provider

**Not Required** - This application does not use AI features.

---

## 🔧 Backend / Server-side

### Language & Runtime
- **Language:** TypeScript (Strict mode)
- **Runtime:** Node.js 20+
- **Framework:** Express.js (Lightweight HTTP server for webhooks)

### Authentication
- **Method:** Role-based access via Telegram User ID
- **Session Access:** Encrypted access keys (9-char) + Master key (12-char)
- **Encryption:** `crypto` module (AES-256-GCM) for key storage
- **Admin Registration:** Pre-configured Telegram User IDs in database

### API Architecture
- **Type:** REST API (internal - webhook receiver only)
- **Webhook:** Telegram Bot API webhooks
- **External APIs:**
  - Backblaze B2 API (file upload)
  - Google Sheets API (metadata logging)
  - Google Maps Geocoding API (reverse geocoding)

### Hosting/Deployment
- **Platform:** Koyeb (Free tier)
- **Deployment:** Docker container from GitHub auto-deploy
- **Build Command:** `npm run build` (tsc + prisma generate)
- **Start Command:** `npm start` (node dist/src/index.js)
- **Environment:** Production (single environment for MVP)

---

## 💾 Database

### Database Type
- **Type:** SQL (Relational)
- **Technology:** PostgreSQL
- **Hosting:** Supabase (Free tier - 500MB)

### ORM/Query Builder
- **ORM:** Prisma (Type-safe queries)
- **Migrations:** Prisma Migrate
- **Schema Location:** `prisma/schema.prisma`

### Database Schema

```prisma
model Admin {
  id              String   @id @default(uuid())
  telegramUserId  BigInt   @unique
  username        String?
  phoneNumber     String?
  masterKey       String   // Encrypted (AES-256)
  createdAt       DateTime @default(now())
}

model Session {
  id              String   @id @default(uuid())
  sessionId       String   @unique // PREFIX-MMDD-NN
  prefix          String
  dateCode        String
  sequenceNumber  String
  description     String
  accessKey       String   // Encrypted (AES-256)
  createdBy       BigInt   // Telegram User ID
  createdAt       DateTime @default(now())
  status          SessionStatus @default(ACTIVE)
  b2FolderPath    String?
  totalFiles      Int      @default(0)
  totalSizeMB     Decimal  @default(0)
  uploads         Upload[]
}

model Upload {
  id            String       @id @default(uuid())
  sessionId     String
  session       Session      @relation(fields: [sessionId], references: [id])
  filename      String
  originalName  String
  fileSizeMB    Decimal
  b2FileId      String?
  b2FileUrl     String?
  uploadStatus  UploadStatus @default(PENDING)
  uploadedBy    BigInt       // Telegram User ID
  uploadedAt    DateTime     @default(now())
  errorLog      String?
  metadata      Json?        // EXIF data
}

model GoogleAuth {
  id              String   @id @default(uuid())
  telegramUserId  BigInt   @unique
  googleEmail     String
  accessToken     String   // Encrypted
  refreshToken    String   // Encrypted
  tokenExpiry     DateTime
  sheetId         String?
  authorizedAt    DateTime @default(now())
}

model MetadataLog {
  id              String   @id @default(uuid())
  uploadId        String   @unique
  sessionId       String
  photoName       String
  dateTaken       DateTime?
  latitude        Decimal?
  longitude       Decimal?
  address         String?
  userDescription String?
  cloudLink       String
  sheetRowNumber  Int?
  createdAt       DateTime @default(now())
}

enum SessionStatus {
  ACTIVE
  CLOSED
  ARCHIVED
}

enum UploadStatus {
  PENDING
  UPLOADING
  COMPLETED
  FAILED
  RETRYING
}
```

---

## 🎨 Frontend Framework

**Not Applicable** - Telegram Bot interface (no web frontend)

### Bot UI Framework
- **Library:** `grammy` (Modern Telegram Bot Framework)
- **Features:**
  - Inline keyboards for menu navigation
  - Conversation state management
  - File handling (photo uploads)
  - Progress messages
  - Error notifications

### UI Components
- Inline buttons for menu selection
- Progress indicators (text-based with emoji)
- Status messages with formatting
- Command-based navigation (`/start`, `/end`, `/status`, `/settings`, `/batch`, `/refresh`)

---

## 📁 Project Structure

### Organization
```
telegram-documenter/
├── src/
│   ├── bot/
│   │   ├── handlers/
│   │   │   ├── start.handler.ts
│   │   │   ├── session.handler.ts
│   │   │   ├── upload.handler.ts
│   │   │   ├── settings.handler.ts
│   │   │   └── batch.handler.ts
│   │   ├── keyboards/
│   │   │   ├── main.keyboard.ts
│   │   │   ├── session.keyboard.ts
│   │   │   └── settings.keyboard.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── session.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── bot.ts
│   ├── services/
│   │   ├── session.service.ts
│   │   ├── upload.service.ts
│   │   ├── b2.service.ts
│   │   ├── metadata.service.ts
│   │   ├── google.service.ts
│   │   └── encryption.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   ├── config/
│   │   └── env.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

### Package Manager
- **Manager:** npm (comes with Node.js)
- **Alternative:** pnpm (faster, optional)

### Environment Variables
```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Backblaze B2
B2_APPLICATION_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=your_bucket_name

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key
MASTER_KEY_SALT=your_master_key_salt

# Geocoding
GEOCODING_API_KEY=your_geocoding_api_key

# Server
PORT=3000
NODE_ENV=production
WEBHOOK_URL=https://your-app.koyeb.app
```

---

## 🔐 Authentication & Authorization

### Authentication Method
- **Primary:** Telegram User ID (automatic via Telegram)
- **Session Access:** Encrypted access key (9-char: ABC:DEF:GHI)
- **Admin Access:** Master key (12-char) for emergency override

### Authorization Levels
1. **ADMIN**
   - Create sessions
   - Generate access keys
   - View all keys via database
   - Use master key
   - All USER permissions

2. **USER**
   - Access sessions with valid key
   - Upload photos
   - Check status
   - End sessions
   - Enable Log Mode

### Session Security
- **Access Key Format:** ABC:DEF:GHI (9 chars, colon-separated)
- **Encryption:** AES-256-GCM
- **Failed Attempts:** Max 3 attempts, then 15-min lockout
- **Key Storage:** Encrypted in database
- **Master Key:** 12 chars, highest security encryption

### Protected Actions
- Creating sessions → ADMIN only
- Viewing keys → ADMIN only (via database)
- Uploading files → Authenticated session users only
- Google OAuth → Per-user authentication

---

## 📤 File Upload & Storage

### Storage Provider
- **Provider:** Backblaze B2 (S3-compatible object storage)
- **SDK:** `@backblaze-b2/backblaze-b2` (official)
- **Pricing:** Free tier: 10GB storage, 1GB/day download

### File Types & Limits
- **Accepted:** JPG, JPEG, PNG
- **Max Size:** 20 MB per file
- **For Metadata:** Send as DOCUMENT (not compressed) to preserve EXIF

### Upload Process
1. User sends photo via Telegram
2. Bot downloads to temporary buffer
3. Extract metadata (if Log Mode enabled)
4. Upload to B2 with SHA-1 hash verification
5. Store file metadata in database
6. Delete temporary file
7. Send confirmation to user

### Folder Structure in B2
```
bucket-name/
├── DCM-0914-01-Project-Alpha/
│   ├── IMG_20240914_143022.jpg
│   ├── IMG_20240914_143105.jpg
│   └── ...
├── DCM-0914-02-Liburan-ke-Surabaya/
│   ├── IMG_20240914_144522.jpg
│   └── ...
└── ID-0915-01-Client-Meeting/
    └── ...
```

### Upload Features
- **Progress Tracking:** Real-time progress updates
- **Retry Logic:** Auto-retry up to 3 times on failure
- **Batch Upload:** Queue multiple files
- **Error Logging:** Store error details in database
- **Resume:** Not supported in v1.0 (planned for v1.1)

---

## 🔌 External APIs & Integrations

### 1. Backblaze B2 API
- **Purpose:** Cloud storage for photos
- **Endpoints Used:**
  - `b2_authorize_account`
  - `b2_get_upload_url`
  - `b2_upload_file`
  - `b2_list_file_names`
- **Rate Limits:** 1000 calls/day (free tier)
- **Authentication:** Application Key ID + Key

### 2. Google Sheets API
- **Purpose:** Log metadata for documentation
- **Scope:** `https://www.googleapis.com/auth/spreadsheets`
- **Operations:**
  - Create spreadsheet
  - Append rows
  - Format cells
- **Rate Limits:** 100 requests/100 seconds
- **Authentication:** OAuth 2.0

### 3. Google OAuth 2.0
- **Purpose:** Authenticate user for Sheets access
- **Flow:** Authorization Code Flow
- **Library:** `google-auth-library`
- **Redirect:** Telegram deep link or custom webhook

### 4. Google Maps Geocoding API
- **Purpose:** Reverse geocoding (coordinates → address)
- **Alternative:** OpenStreetMap Nominatim (free, no API key)
- **Rate Limits:** 50 requests/min (Google)
- **Input:** Latitude, Longitude
- **Output:** Formatted address

### 5. Telegram Bot API
- **Purpose:** Bot interface
- **Method:** Webhooks (not polling)
- **Features Used:**
  - sendMessage
  - sendPhoto
  - editMessageText
  - getFile
  - downloadFile

---

## 📧 Email Service

**Not Required** - All notifications via Telegram messages.

---

## ⚡ Real-time Features

### Technology
- **Method:** Telegram Webhook (pseudo real-time)
- **Push Notifications:** Telegram native notifications
- **Progress Updates:** Manual refresh via `/status` command
- **Live Upload:** Not implemented (polling-based status check)

### Future Consideration
- WebSocket for true real-time progress (v2.0)
- Server-Sent Events for upload status stream

---

## 📊 Analytics & Monitoring

### Error Tracking
- **Method:** Console logging + Database error_log field
- **Future:** Sentry integration (v1.1)

### Analytics
- **Method:** Database queries (upload counts, session stats)
- **Metrics Tracked:**
  - Total uploads per session
  - Upload success/failure rate
  - User activity
  - Storage usage

### Monitoring
- **Uptime:** Koyeb dashboard
- **Database:** Supabase monitoring
- **Logs:** Koyeb logs viewer

---

## 🔍 SEO & Meta Tags

**Not Applicable** - Telegram Bot (no web interface)

---

## 🧪 Testing Strategy

### Unit Testing
- **Framework:** Vitest
- **Coverage:** Services, utilities, validators
- **Target:** 70% coverage

### Integration Testing
- **Framework:** Supertest (API endpoints)
- **Scope:** Session creation, upload flow, key validation

### Manual Testing
- **Scope:** Full user flows (ADMIN + USER)
- **Checklist:**
  - [ ] Session creation
  - [ ] Access key validation
  - [ ] Photo upload (single & batch)
  - [ ] Metadata extraction
  - [ ] Google Sheets logging
  - [ ] Error scenarios
  - [ ] Master key override

### E2E Testing
- **Future:** Playwright for critical flows (v1.1)

---

## 🚀 Deployment & CI/CD

### Hosting Platform
- **Frontend:** N/A (Telegram Bot)
- **Backend:** Koyeb (Free tier Docker deployment)
- **Database:** Supabase (Free tier PostgreSQL)
- **Storage:** Backblaze B2 (Free tier 10GB)

### Domain
- **Not Required** - Koyeb provides subdomain
- **Webhook URL:** `https://your-app.koyeb.app/webhook`

### SSL
- **Automatic** via Koyeb (Let's Encrypt)

### CI/CD Pipeline
- **Source:** GitHub repository
- **Trigger:** Push to `main` branch
- **Auto-Deploy:** Koyeb auto-rebuild on push
- **Build Steps:**
  1. `npm install`
  2. `npm run build` (TypeScript → JavaScript)
  3. `prisma generate`
- **Start Command:** `npm start`

### Environment Setup
- **Development:** Local `.env` file
- **Production:** Koyeb environment variables UI

### Deployment Checklist
- [ ] Set all environment variables in Koyeb
- [ ] Run Prisma migrations on Supabase
- [ ] Configure Telegram webhook URL
- [ ] Test webhook with dummy update
- [ ] Verify database connection
- [ ] Test B2 upload
- [ ] Test Google OAuth flow

---

## 📱 Mobile Considerations

### Responsive Design
- **Not Required** - Telegram handles all UI
- **Native Features:**
  - Camera access (Telegram built-in)
  - Gallery picker (Telegram built-in)
  - Push notifications (Telegram native)

### PWA
- **Not Applicable** - No web interface

### Mobile-Specific Features
- ✅ Camera capture (via Telegram)
- ✅ GPS extraction (from photo EXIF)
- ❌ Background upload (not supported by Telegram Bot API)

---

## ⚡ Performance & Optimization

### Image Optimization
- **Not Applied** - Store original files as-is
- **Reason:** Documentation purposes require originals
- **Future:** Optional compression toggle (v1.2)

### Upload Optimization
- **Parallel Uploads:** Max 5 concurrent uploads per user
- **Chunking:** Not implemented (handled by B2)
- **Compression:** Not applied (preserve quality)

### Caching Strategy
- **Session Data:** In-memory cache (grammy session)
- **Database Queries:** No caching (always fresh data)
- **B2 URLs:** Cached in database (expires after 24h)

### Loading States
- **Progress Messages:**
  - "📤 Uploading... 45% ▓▓▓▓▓▓▓▓▓░░░░░"
  - "⏳ Processing metadata..."
  - "✅ Upload complete!"

---

## 🌐 Internationalization (i18n)

**Not Implemented** - Indonesian language only (v1.0)

### Future Plans (v2.0)
- Support English
- Library: `i18next`
- Auto-detect from Telegram language settings

---

## ♿ Accessibility (a11y)

**Not Applicable** - Telegram handles accessibility

### Telegram Native A11y
- Screen reader support (OS-level)
- Voice commands (OS-level)
- Large text support (Telegram settings)

---

## 🔒 Security Considerations

### Input Validation
- **Library:** Zod (schema validation)
- **Applied To:**
  - Session ID format
  - Access key format
  - File type validation
  - File size validation
  - User input sanitization

### Encryption
- **Algorithm:** AES-256-GCM
- **Keys Encrypted:**
  - Session access keys
  - Master key
  - Google OAuth tokens
- **Key Storage:** Environment variable (32-byte key)

### Rate Limiting
- **Method:** In-memory counter per Telegram User ID
- **Limits:**
  - Upload: 50 files/hour per user
  - Session creation: 10/day per ADMIN
  - Failed key attempts: 3 attempts → 15-min lockout

### CORS
- **Not Required** - No browser-based API access

### XSS Prevention
- **Not Applicable** - No HTML output

### CSRF Protection
- **Method:** Telegram webhook secret token verification

### SQL Injection
- **Prevention:** Prisma ORM (parameterized queries)

### Security Headers
- **Applied:** None (no web interface)
- **Future:** Helmet.js for admin dashboard (v2.0)

---

## 🛡️ Data Privacy & GDPR

### Data Collection
- **Collected:**
  - Telegram User ID (automatic)
  - Username (optional)
  - Upload timestamps
  - Photo metadata (EXIF)
- **NOT Collected:**
  - Phone numbers (except ADMIN pre-registered)
  - Personal messages
  - Location tracking (only from photo EXIF)

### Privacy Policy
- **Required:** Yes (link in `/start` message)
- **Contents:**
  - Data collected
  - Data usage
  - Data retention
  - User rights

### Cookie Consent
- **Not Required** - No cookies used

### Data Rights
- **Export:** User can request all data via ADMIN
- **Deletion:** User can request full data deletion
- **Retention:** 90 days after session closure (configurable)

### GDPR Compliance
- **Applicable:** If serving EU users
- **Requirements Met:**
  - Data minimization ✅
  - Purpose limitation ✅
  - Storage limitation ✅ (90-day retention)
  - Security measures ✅ (encryption)
  - User rights ✅ (export, deletion)

---

## 📚 Documentation Requirements

### README.md
- **Contents:**
  - Project overview
  - Tech stack
  - Setup instructions
  - Environment variables
  - Deployment guide
  - Usage examples
  - Contributing guidelines

### Code Documentation
- **Standard:** JSDoc comments
- **Scope:**
  - All service methods
  - Complex utility functions
  - API endpoints

### API Documentation
- **Not Required** - Internal webhook only
- **Future:** Swagger/OpenAPI for admin API (v2.0)

### Changelog
- **Format:** Keep a Changelog
- **Location:** `CHANGELOG.md`
- **Updated:** On each release

---

## 🤝 Version Control & Collaboration

### Git Platform
- **Platform:** GitHub
- **Repository:** Private (contains sensitive config)

### Branching Strategy
- **Main Branch:** `main` (production)
- **Development:** `develop` (staging)
- **Features:** `feature/feature-name`
- **Fixes:** `fix/bug-description`

### Commit Convention
- **Standard:** Conventional Commits
- **Format:**
  - `feat: add batch upload mode`
  - `fix: resolve B2 upload timeout`
  - `docs: update README setup guide`
  - `refactor: simplify session validation`
  - `test: add metadata extraction tests`

### Code Review
- **Not Required** - Solo project (MVP)
- **Future:** Require 1 approval for PR (when team grows)

---

## 💰 Budget & Cost Estimation

### Free Tier Services
- ✅ **Koyeb:** 1 free web service (512MB RAM, 2GB disk)
- ✅ **Supabase:** 500MB database, 1GB file storage
- ✅ **Backblaze B2:** 10GB storage, 1GB/day download
- ✅ **Telegram Bot API:** Unlimited (free)
- ✅ **Google Sheets API:** 100 requests/100s (free)

### Paid Services (Optional)
- **Geocoding API:** 
  - Google Maps: $5/1000 requests (after free tier)
  - Alternative: Nominatim (free, rate-limited)
- **Domain:** ~$12/year (if custom domain needed)

### Estimated Monthly Cost
- **Minimal Usage (<100 users):** $0/month (all free tier)
- **Medium Usage (100-500 users):** ~$5-10/month (geocoding API)
- **High Usage (500+ users):** ~$20-30/month (upgrade Koyeb + Supabase)

### Scaling Costs
- **Storage:** $0.005/GB/month (B2) after 10GB
- **Bandwidth:** $0.01/GB (B2) after 1GB/day
- **Database:** $25/month for Supabase Pro (8GB)
- **Compute:** $7/month for Koyeb Hobby plan

### Total Estimated (MVP - 6 months)
- **Setup:** $0
- **Monthly:** $0-5
- **Total:** ~$0-30 for first 6 months

---

## 📦 Key Dependencies

### Production Dependencies
```json
{
  "grammy": "^1.23.0",
  "express": "^4.19.0",
  "@prisma/client": "^5.19.0",
  "@backblaze-b2/backblaze-b2": "^1.8.0",
  "googleapis": "^140.0.0",
  "google-auth-library": "^9.14.0",
  "zod": "^3.23.0",
  "exifreader": "^4.23.0",
  "dotenv": "^16.4.0"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.5.0",
  "@types/node": "^22.0.0",
  "@types/express": "^4.17.0",
  "prisma": "^5.19.0",
  "ts-node": "^10.9.0",
  "vitest": "^2.0.0",
  "tsx": "^4.17.0"
}
```

---

## ✅ MVP Checklist

### Phase 1: Core Setup (Week 1)
- [ ] Initialize Node.js + TypeScript project
- [ ] Setup Prisma with Supabase
- [ ] Create database schema
- [ ] Configure environment variables
- [ ] Setup grammy bot framework
- [ ] Implement Telegram webhook

### Phase 2: Session Management (Week 2)
- [ ] Implement session creation (ADMIN)
- [ ] Generate & encrypt access keys
- [ ] Session ID auto-generation
- [ ] Session access validation
- [ ] Master key override
- [ ] Failed attempt lockout

### Phase 3: Photo Upload (Week 2-3)
- [ ] Integrate Backblaze B2
- [ ] Implement single photo upload
- [ ] Upload progress tracking
- [ ] Error handling & retry logic
- [ ] Batch upload mode
- [ ] `/status` command

### Phase 4: Metadata & Logging (Week 3-4)
- [ ] EXIF extraction implementation
- [ ] GPS coordinate parsing
- [ ] Reverse geocoding integration
- [ ] Google OAuth 2.0 flow
- [ ] Google Sheets integration
- [ ] Log Dokumentasi mode

### Phase 5: Testing & Deployment (Week 4)
- [ ] Manual testing (all flows)
- [ ] Unit tests for services
- [ ] Deploy to Koyeb
- [ ] Configure production webhook
- [ ] Database migration to prod
- [ ] Final end-to-end testing

### Phase 6: Documentation (Week 4)
- [ ] Complete README.md
- [ ] Setup guide for developers
- [ ] User manual (Telegram messages)
- [ ] Privacy policy
- [ ] CHANGELOG.md

---

## 🎯 Success Criteria

### Performance Metrics
- Upload time: <30 seconds for 5MB photo
- Metadata extraction: <2 seconds
- Session creation: <2 seconds
- Response time: <1 second for commands

### Reliability Metrics
- Uptime: >99%
- Upload success rate: >98%
- Data loss: 0%
- Encryption failure: 0%

### User Satisfaction
- Intuitive commands and flow
- Clear error messages
- Helpful status updates
- Fast response times

---

**Document Version:** 1.0  
**Last Updated:** February 4, 2026  
**Status:** Development Ready  
**Approved By:** [Your Name]

---

**END OF REQUIREMENTS DOCUMENT**
