# EstimateFlow - Technical Specifications

**Version**: 1.0.0
**Last Updated**: January 25, 2025
**Status**: MVP Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [Agent Architecture](#agent-architecture)
7. [Branding System](#branding-system)
8. [Security & Privacy](#security--privacy)
9. [Performance Requirements](#performance-requirements)
10. [Deployment Architecture](#deployment-architecture)

---

## Executive Summary

EstimateFlow is an AI-powered construction estimating application that transforms field assessments into professional estimates in minutes. The system leverages specialized AI agents to analyze photos, transcribe voice notes, classify work items, estimate hours, calculate pricing, and format professional estimates.

### Key Features

- **Flexible Data Capture**: Voice-first, photo-first, or combined workflows
- **AI Processing**: 8 specialized agents working in parallel/sequence
- **Full Editability**: Complete control over generated estimates
- **AI Text Rewrite**: Grammar and clarity improvements with rollback
- **Materials Flexibility**: Detailed breakdown or rolled-up pricing
- **Professional Branding**: Custom templates with company branding
- **Jobber Integration**: (Phase II) Direct quote creation in Jobber

### Target Users

- Small to medium construction contractors
- Field estimators and project managers
- Service-based trades (plumbing, electrical, HVAC, general contracting)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP (React Native)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Photo   │  │  Voice   │  │  Review  │  │   Send   │   │
│  │ Capture  │  │  Notes   │  │   Edit   │  │  Email   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
┌────────────────────▼────────────────────────────────────────┐
│                    BACKEND API (Node.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Upload     │  │  Processing  │  │   Email      │      │
│  │   Service    │  │   Queue      │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              AGENT ORCHESTRATION LAYER                       │
│              (Claude Code + Sub-Agent Framework)             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           PARALLEL PHASE 1: Analysis                 │   │
│  │  ┌─────────────────┐    ┌─────────────────┐         │   │
│  │  │ Photo Analyzer  │    │Voice Transcriber│         │   │
│  │  │     Agent       │    │      Agent      │         │   │
│  │  └─────────────────┘    └─────────────────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           PHASE 2: Classification                    │   │
│  │  ┌─────────────────────────────────────┐             │   │
│  │  │   Work Item Classifier Agent        │             │   │
│  │  └─────────────────────────────────────┘             │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       PARALLEL PHASE 3: Estimation                   │   │
│  │  ┌─────────────────┐    ┌─────────────────┐         │   │
│  │  │ Hours Estimator │    │Materials Pricer │         │   │
│  │  │     Agent       │    │      Agent      │         │   │
│  │  └─────────────────┘    └─────────────────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    PARALLEL PHASE 4: Formatting & QA                 │   │
│  │  ┌──────────────────┐   ┌─────────────────┐         │   │
│  │  │Estimate Formatter│   │  Quality Checker│         │   │
│  │  │      Agent       │   │      Agent      │         │   │
│  │  └──────────────────┘   └─────────────────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         ON-DEMAND: Text Enhancement                  │   │
│  │  ┌─────────────────────────────────────┐             │   │
│  │  │     Text Rewriter Agent             │             │   │
│  │  │  (Grammar/clarity improvements)     │             │   │
│  │  └─────────────────────────────────────┘             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  DATA & STORAGE LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   S3/R2      │  │    Redis     │      │
│  │   Database   │  │File Storage  │  │  Job Queue   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Mobile App: User captures photos + voice notes
   ↓
2. Upload to S3/R2, metadata to PostgreSQL
   ↓
3. Backend enqueues processing job (Redis)
   ↓
4. Agent Orchestrator initiates workflow
   ↓
5. Phase 1 (Parallel): Photo analysis + Voice transcription
   ↓
6. Phase 2: Work item classification
   ↓
7. Phase 3 (Parallel): Hours estimation + Materials pricing
   ↓
8. Phase 4 (Parallel): Estimate formatting + Quality check
   ↓
9. Return structured estimate to backend
   ↓
10. Backend generates PDF, stores in S3
   ↓
11. Mobile app receives estimate for review
   ↓
12. User edits (optional AI text rewrite)
   ↓
13. User approves → Email sent to client
```

---

## Technology Stack

### Mobile Application

- **Framework**: React Native (Expo)
- **UI Library**: React Native Paper + Custom components
- **State Management**: React Context + useReducer (or Zustand)
- **Camera**: Expo Camera API
- **Audio**: Expo AV (Audio/Video)
- **Storage**: Expo SecureStore (credentials) + AsyncStorage (app data)
- **HTTP Client**: Axios
- **Offline Support**: React Query with persistence

**Rationale**: React Native with Expo provides rapid development, single codebase for iOS/Android, excellent native API access, and easy deployment via EAS.

### Backend API

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **API Style**: RESTful JSON
- **File Upload**: Multer + Busboy
- **Validation**: Zod
- **Authentication**: JWT tokens + bcrypt
- **Job Queue**: BullMQ (Redis-backed)
- **Email**: SendGrid SDK
- **PDF Generation**: Puppeteer (HTML → PDF)

**Rationale**: Node.js/TypeScript provides fast development, excellent async handling for AI workflows, strong ecosystem, and JavaScript consistency across stack.

### Agent Orchestration

- **Framework**: Claude Code SDK + sub-agent-orchestration skill
- **Agent Format**: Markdown-based agent definitions (`.claude/agents/`)
- **AI Models**:
  - Claude 3.5 Sonnet (primary analysis, complex reasoning)
  - Claude 3.5 Haiku (fast classification, text rewrite)
- **Orchestration**: Custom TypeScript orchestrator using parallel-dev-automation patterns

**Rationale**: Leverages your existing sub-agent architecture, provides maximum flexibility, easy to iterate on agent prompts, cost-effective model selection.

### Database

- **Primary DB**: PostgreSQL 16
- **Hosting**: Supabase (managed PostgreSQL + realtime + auth)
- **ORM**: Prisma (type-safe, great DX)
- **Migrations**: Prisma Migrate

**Rationale**: PostgreSQL for reliability and JSON support, Supabase for managed hosting + realtime features, Prisma for excellent TypeScript integration.

### File Storage

- **Primary**: Cloudflare R2 (S3-compatible)
- **CDN**: Cloudflare CDN (included with R2)
- **SDK**: AWS SDK v3 (S3 client)

**Rationale**: R2 is cheaper than S3 ($0.015/GB vs $0.023/GB), no egress fees, S3-compatible, includes CDN.

### Job Queue

- **Queue**: BullMQ
- **Backing Store**: Redis (Upstash or Railway)
- **Features**: Job retry, priority, scheduling, monitoring

**Rationale**: BullMQ is robust, well-maintained, Redis-backed for persistence, excellent monitoring.

### DevOps

- **Hosting**: Railway (Backend + Redis) or Render
- **Mobile**: Expo EAS (Build + Submit)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (errors) + LogTail (logs)
- **Analytics**: PostHog (product analytics)

---

## Database Schema

### Core Tables

```sql
-- Users (Estimators)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'estimator',
  company_id UUID REFERENCES companies(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7), -- hex color
  secondary_color VARCHAR(7),
  phone VARCHAR(20),
  email VARCHAR(255),
  address JSONB, -- {street, city, state, zip}
  settings JSONB, -- pricing, terms, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Settings JSONB Structure
{
  "pricing": {
    "hourly_rate": 75.00,
    "materials_markup": 0.40,
    "minimum_job_charge": 150.00,
    "travel_fee": 0,
    "buffer_percentage": 0.15
  },
  "estimate_defaults": {
    "terms": "50% deposit required...",
    "payment_methods": ["Cash", "Check", "Credit Card"],
    "warranty_info": "All work guaranteed...",
    "validity_days": 30
  },
  "email_template": {
    "subject": "Your Estimate from {{company_name}}",
    "body": "Hi {{customer_name}},\n\n..."
  },
  "jobber": {
    "enabled": false,
    "api_key": null,
    "auto_create_quotes": false
  }
}

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  notes TEXT,
  jobber_client_id VARCHAR(100), -- for Phase II integration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estimates
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number VARCHAR(50) UNIQUE NOT NULL, -- EST-2025-001
  company_id UUID REFERENCES companies(id),
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id), -- estimator who created it

  -- Customer snapshot (in case customer record changes)
  customer_snapshot JSONB,

  -- Estimate data
  title VARCHAR(500),
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, approved, declined, expired

  -- Financial
  total_hours DECIMAL(10,2),
  labor_total DECIMAL(10,2),
  materials_total DECIMAL(10,2),
  grand_total DECIMAL(10,2),

  -- Display options
  materials_display VARCHAR(20) DEFAULT 'detailed', -- detailed | rolled_up

  -- Files
  pdf_url TEXT,

  -- Metadata
  quality_score INTEGER, -- 0-100
  ai_confidence VARCHAR(20), -- low | medium | high

  -- Timestamps
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Line Items
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,

  -- Organization
  sort_order INTEGER NOT NULL,
  group_name VARCHAR(255), -- "Bathroom Tile Repair"

  -- Item details
  category VARCHAR(100), -- tile_removal, tile_install, faucet_repair
  description TEXT NOT NULL,

  -- Labor
  labor_hours DECIMAL(10,2),
  labor_rate DECIMAL(10,2),
  labor_total DECIMAL(10,2),

  -- Materials
  materials_cost DECIMAL(10,2),
  materials_markup DECIMAL(10,2),
  materials_total DECIMAL(10,2),

  -- Totals
  line_total DECIMAL(10,2) NOT NULL,

  -- Metadata
  ai_generated BOOLEAN DEFAULT true,
  ai_confidence VARCHAR(20),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES line_items(id) ON DELETE SET NULL,

  -- File info
  file_url TEXT NOT NULL,
  file_size INTEGER, -- bytes
  mime_type VARCHAR(50),

  -- Metadata
  sort_order INTEGER,
  caption TEXT,

  -- AI analysis
  ai_analysis JSONB, -- photo analyzer output

  -- Timestamps
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice Notes
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,

  -- File info
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds INTEGER,

  -- Transcription
  raw_transcription TEXT,
  structured_data JSONB, -- voice transcriber output

  -- Metadata
  sort_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials (for detailed view)
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_item_id UUID REFERENCES line_items(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2),
  unit VARCHAR(50), -- sq ft, piece, gallon, etc.
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Sourcing (Phase II)
  vendor VARCHAR(100), -- "Home Depot", "Local Lumber Yard"
  sku VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit History (for AI text rewrites with rollback)
CREATE TABLE edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,

  field_type VARCHAR(50), -- line_item_description, customer_note, etc.
  field_id UUID, -- id of the specific record being edited

  previous_value TEXT,
  new_value TEXT,

  edit_type VARCHAR(50), -- manual | ai_rewrite
  user_id UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Log
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id),

  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,

  status VARCHAR(50), -- queued, sent, delivered, bounced, failed
  sendgrid_message_id VARCHAR(255),

  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_estimates_company ON estimates(company_id);
CREATE INDEX idx_estimates_customer ON estimates(customer_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_created ON estimates(created_at DESC);
CREATE INDEX idx_line_items_estimate ON line_items(estimate_id);
CREATE INDEX idx_photos_estimate ON photos(estimate_id);
CREATE INDEX idx_voice_notes_estimate ON voice_notes(estimate_id);
CREATE INDEX idx_materials_line_item ON materials(line_item_id);
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  phone         String?
  role          String    @default("estimator")
  companyId     String?   @map("company_id") @db.Uuid
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  company       Company?  @relation(fields: [companyId], references: [id])
  estimates     Estimate[]
  editHistory   EditHistory[]

  @@map("users")
}

model Company {
  id              String    @id @default(uuid()) @db.Uuid
  name            String
  logoUrl         String?   @map("logo_url")
  primaryColor    String?   @map("primary_color")
  secondaryColor  String?   @map("secondary_color")
  phone           String?
  email           String?
  address         Json?
  settings        Json?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  users           User[]
  customers       Customer[]
  estimates       Estimate[]

  @@map("companies")
}

model Customer {
  id              String    @id @default(uuid()) @db.Uuid
  companyId       String    @map("company_id") @db.Uuid
  firstName       String?   @map("first_name")
  lastName        String?   @map("last_name")
  companyName     String?   @map("company_name")
  email           String?
  phone           String?
  address         Json?
  notes           String?
  jobberClientId  String?   @map("jobber_client_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  company         Company   @relation(fields: [companyId], references: [id])
  estimates       Estimate[]

  @@map("customers")
}

model Estimate {
  id                String    @id @default(uuid()) @db.Uuid
  estimateNumber    String    @unique @map("estimate_number")
  companyId         String    @map("company_id") @db.Uuid
  customerId        String?   @map("customer_id") @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  customerSnapshot  Json?     @map("customer_snapshot")
  title             String?
  status            String    @default("draft")
  totalHours        Decimal?  @map("total_hours") @db.Decimal(10, 2)
  laborTotal        Decimal?  @map("labor_total") @db.Decimal(10, 2)
  materialsTotal    Decimal?  @map("materials_total") @db.Decimal(10, 2)
  grandTotal        Decimal?  @map("grand_total") @db.Decimal(10, 2)
  materialsDisplay  String    @default("detailed") @map("materials_display")
  pdfUrl            String?   @map("pdf_url")
  qualityScore      Int?      @map("quality_score")
  aiConfidence      String?   @map("ai_confidence")
  sentAt            DateTime? @map("sent_at")
  viewedAt          DateTime? @map("viewed_at")
  approvedAt        DateTime? @map("approved_at")
  expiresAt         DateTime? @map("expires_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  company           Company   @relation(fields: [companyId], references: [id])
  customer          Customer? @relation(fields: [customerId], references: [id])
  user              User      @relation(fields: [userId], references: [id])
  lineItems         LineItem[]
  photos            Photo[]
  voiceNotes        VoiceNote[]
  editHistory       EditHistory[]
  emailLogs         EmailLog[]

  @@map("estimates")
}

model LineItem {
  id                String    @id @default(uuid()) @db.Uuid
  estimateId        String    @map("estimate_id") @db.Uuid
  sortOrder         Int       @map("sort_order")
  groupName         String?   @map("group_name")
  category          String?
  description       String
  laborHours        Decimal?  @map("labor_hours") @db.Decimal(10, 2)
  laborRate         Decimal?  @map("labor_rate") @db.Decimal(10, 2)
  laborTotal        Decimal?  @map("labor_total") @db.Decimal(10, 2)
  materialsCost     Decimal?  @map("materials_cost") @db.Decimal(10, 2)
  materialsMarkup   Decimal?  @map("materials_markup") @db.Decimal(10, 2)
  materialsTotal    Decimal?  @map("materials_total") @db.Decimal(10, 2)
  lineTotal         Decimal   @map("line_total") @db.Decimal(10, 2)
  aiGenerated       Boolean   @default(true) @map("ai_generated")
  aiConfidence      String?   @map("ai_confidence")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  estimate          Estimate  @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  photos            Photo[]
  materials         Material[]

  @@map("line_items")
}

model Photo {
  id            String    @id @default(uuid()) @db.Uuid
  estimateId    String    @map("estimate_id") @db.Uuid
  lineItemId    String?   @map("line_item_id") @db.Uuid
  fileUrl       String    @map("file_url")
  fileSize      Int?      @map("file_size")
  mimeType      String?   @map("mime_type")
  sortOrder     Int?      @map("sort_order")
  caption       String?
  aiAnalysis    Json?     @map("ai_analysis")
  takenAt       DateTime? @map("taken_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  estimate      Estimate  @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  lineItem      LineItem? @relation(fields: [lineItemId], references: [id], onDelete: SetNull)
  voiceNotes    VoiceNote[]

  @@map("photos")
}

model VoiceNote {
  id                  String    @id @default(uuid()) @db.Uuid
  estimateId          String    @map("estimate_id") @db.Uuid
  photoId             String?   @map("photo_id") @db.Uuid
  fileUrl             String    @map("file_url")
  fileSize            Int?      @map("file_size")
  durationSeconds     Int?      @map("duration_seconds")
  rawTranscription    String?   @map("raw_transcription")
  structuredData      Json?     @map("structured_data")
  sortOrder           Int?      @map("sort_order")
  createdAt           DateTime  @default(now()) @map("created_at")

  estimate            Estimate  @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  photo               Photo?    @relation(fields: [photoId], references: [id], onDelete: SetNull)

  @@map("voice_notes")
}

model Material {
  id            String    @id @default(uuid()) @db.Uuid
  lineItemId    String    @map("line_item_id") @db.Uuid
  name          String
  quantity      Decimal?  @db.Decimal(10, 2)
  unit          String?
  unitCost      Decimal?  @map("unit_cost") @db.Decimal(10, 2)
  totalCost     Decimal?  @map("total_cost") @db.Decimal(10, 2)
  vendor        String?
  sku           String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  lineItem      LineItem  @relation(fields: [lineItemId], references: [id], onDelete: Cascade)

  @@map("materials")
}

model EditHistory {
  id            String    @id @default(uuid()) @db.Uuid
  estimateId    String    @map("estimate_id") @db.Uuid
  fieldType     String    @map("field_type")
  fieldId       String?   @map("field_id") @db.Uuid
  previousValue String?   @map("previous_value")
  newValue      String?   @map("new_value")
  editType      String    @map("edit_type")
  userId        String?   @map("user_id") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")

  estimate      Estimate  @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  user          User?     @relation(fields: [userId], references: [id])

  @@map("edit_history")
}

model EmailLog {
  id                  String    @id @default(uuid()) @db.Uuid
  estimateId          String?   @map("estimate_id") @db.Uuid
  toEmail             String    @map("to_email")
  subject             String?
  body                String?
  status              String
  sendgridMessageId   String?   @map("sendgrid_message_id")
  sentAt              DateTime? @map("sent_at")
  deliveredAt         DateTime? @map("delivered_at")
  openedAt            DateTime? @map("opened_at")
  createdAt           DateTime  @default(now()) @map("created_at")

  estimate            Estimate? @relation(fields: [estimateId], references: [id])

  @@map("email_logs")
}
```

---

## API Specifications

### Base URL

```
Production: https://api.estimateflow.app
Development: http://localhost:3000
```

### Authentication

All endpoints except `/auth/*` require JWT token:

```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

#### Estimates

```
GET    /api/estimates              # List all estimates
POST   /api/estimates              # Create new estimate
GET    /api/estimates/:id          # Get estimate details
PATCH  /api/estimates/:id          # Update estimate
DELETE /api/estimates/:id          # Delete estimate
POST   /api/estimates/:id/send     # Send estimate via email
POST   /api/estimates/:id/generate-pdf  # Regenerate PDF
GET    /api/estimates/:id/pdf      # Download PDF
```

#### Estimate Processing

```
POST   /api/estimates/process      # Main AI processing endpoint
GET    /api/estimates/:id/status   # Check processing status
POST   /api/estimates/:id/reprocess  # Reprocess with AI
```

#### Line Items

```
GET    /api/estimates/:id/line-items
POST   /api/estimates/:id/line-items
PATCH  /api/line-items/:id
DELETE /api/line-items/:id
POST   /api/line-items/:id/rewrite-text  # AI text rewrite
POST   /api/line-items/:id/rollback  # Rollback to previous text
```

#### Photos

```
POST   /api/estimates/:id/photos   # Upload photos
GET    /api/photos/:id
DELETE /api/photos/:id
PATCH  /api/photos/:id              # Update caption, line item link
```

#### Voice Notes

```
POST   /api/estimates/:id/voice-notes  # Upload voice note
GET    /api/voice-notes/:id
DELETE /api/voice-notes/:id
```

#### Customers

```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id
DELETE /api/customers/:id
```

#### Company Settings

```
GET    /api/company/settings
PATCH  /api/company/settings
PATCH  /api/company/branding       # Upload logo, set colors
```

### Request/Response Examples

#### POST /api/estimates/process

**Request:**
```json
{
  "customerInfo": {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@email.com",
    "phone": "(555) 987-6543",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip": "12345"
    }
  },
  "photos": [
    {
      "url": "https://r2.cdn.com/abc123.jpg",
      "takenAt": "2025-01-25T10:30:00Z",
      "sortOrder": 1
    }
  ],
  "voiceNotes": [
    {
      "url": "https://r2.cdn.com/voice1.m4a",
      "photoId": "photo-uuid",
      "durationSeconds": 23,
      "sortOrder": 1
    }
  ],
  "processingOptions": {
    "materialsDisplay": "detailed",
    "includePhotosInPDF": true
  }
}
```

**Response:**
```json
{
  "estimateId": "uuid",
  "status": "processing",
  "jobId": "bull-job-id",
  "estimatedCompletionSeconds": 45
}
```

#### GET /api/estimates/:id/status

**Response (Processing):**
```json
{
  "estimateId": "uuid",
  "status": "processing",
  "progress": 65,
  "currentPhase": "hours_estimation",
  "phases": {
    "photo_analysis": "completed",
    "voice_transcription": "completed",
    "classification": "completed",
    "hours_estimation": "in_progress",
    "materials_pricing": "pending",
    "formatting": "pending",
    "quality_check": "pending"
  }
}
```

**Response (Completed):**
```json
{
  "estimateId": "uuid",
  "status": "completed",
  "estimate": {
    "id": "uuid",
    "estimateNumber": "EST-2025-001",
    "customer": { /* customer snapshot */ },
    "lineItems": [
      {
        "id": "uuid",
        "groupName": "Bathroom Tile Repair",
        "category": "tile_removal",
        "description": "Remove damaged tile and inspect substrate",
        "laborHours": 2.0,
        "laborRate": 75.00,
        "laborTotal": 150.00,
        "materials": [
          {
            "name": "Tile removal tools",
            "quantity": 1,
            "unit": "set",
            "unitCost": 0,
            "totalCost": 0
          }
        ],
        "materialsCost": 0,
        "materialsMarkup": 0,
        "materialsTotal": 0,
        "lineTotal": 150.00,
        "photos": ["photo-uuid-1"],
        "aiGenerated": true,
        "aiConfidence": "high"
      }
      // ... more line items
    ],
    "photos": [
      {
        "id": "uuid",
        "url": "https://cdn.com/photo1.jpg",
        "caption": "Cracked tile in master bathroom",
        "lineItemId": "line-item-uuid",
        "aiAnalysis": {
          "issueType": "tile_damage_with_water_damage",
          "materials": ["ceramic_tile", "substrate"],
          "severity": "medium"
        }
      }
    ],
    "totals": {
      "totalHours": 12.5,
      "laborTotal": 937.50,
      "materialsTotal": 488.70,
      "grandTotal": 1426.20
    },
    "pdfUrl": "https://cdn.com/estimates/EST-2025-001.pdf",
    "qualityScore": 92,
    "qualityIssues": [
      {
        "severity": "warning",
        "message": "Photo 3 has no associated line item"
      }
    ],
    "aiConfidence": "high"
  }
}
```

#### POST /api/line-items/:id/rewrite-text

**Request:**
```json
{
  "field": "description",
  "instruction": "make more professional and clear",
  "currentText": "Fix the cracked tile in bathroom"
}
```

**Response:**
```json
{
  "originalText": "Fix the cracked tile in bathroom",
  "rewrittenText": "Remove and replace damaged ceramic tile in master bathroom, including substrate repair as needed",
  "editHistoryId": "uuid",
  "canRollback": true
}
```

#### POST /api/line-items/:id/rollback

**Request:**
```json
{
  "editHistoryId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "restoredText": "Fix the cracked tile in bathroom"
}
```

---

## Agent Architecture

### Agent File Structure

```
.claude/
└── agents/
    ├── photo-analyzer.md
    ├── voice-transcriber.md
    ├── work-item-classifier.md
    ├── hours-estimator.md
    ├── materials-pricer.md
    ├── estimate-formatter.md
    ├── quality-checker.md
    └── text-rewriter.md
```

### Agent Specifications Summary

See detailed specifications in `/project-docs/agents/` directory.

| Agent | Model | Tools | Speed | Cost | Purpose |
|-------|-------|-------|-------|------|---------|
| Photo Analyzer | Sonnet 3.5 | Read (vision) | 5-10s | $$ | Identify damage, materials, scope |
| Voice Transcriber | Sonnet 3.5 | Audio | 8-15s | $$ | Transcribe + extract structured data |
| Work Item Classifier | Haiku 3.5 | Read, Write | 2-5s | $ | Categorize into line items |
| Hours Estimator | Sonnet 3.5 | Read, Bash | 5-8s | $$ | Calculate labor hours |
| Materials Pricer | Haiku 3.5 | Read, Bash | 3-5s | $ | Estimate material costs |
| Estimate Formatter | Sonnet 3.5 | Read, Write | 10-15s | $$ | Generate PDF-ready document |
| Quality Checker | Haiku 3.5 | Read | 3-5s | $ | Review for completeness |
| Text Rewriter | Haiku 3.5 | Read, Write | 2-4s | $ | Grammar/clarity improvements |

**Total Processing Time**: 30-60 seconds per estimate

**Cost per Estimate**: ~$0.50-0.75

### Agent Orchestration Code

```typescript
// backend/src/services/agent-orchestrator.ts

import { Task } from '@claude/agent-sdk';

export async function processEstimate(estimateData: EstimateInput): Promise<EstimateOutput> {

  // PHASE 1: Parallel Photo + Voice Analysis
  const photoVoicePairs = await Promise.all(
    estimateData.photos.map(async (photo, index) => {
      const voiceNote = estimateData.voiceNotes.find(v => v.photoId === photo.id);

      const [photoAnalysis, voiceTranscription] = await Promise.all([
        Task({
          description: `Analyze construction photo ${index + 1}`,
          prompt: buildPhotoAnalysisPrompt(photo),
          subagent_type: 'photo-analyzer'
        }),

        voiceNote ? Task({
          description: `Transcribe voice note ${index + 1}`,
          prompt: buildVoiceTranscriptionPrompt(voiceNote, photo),
          subagent_type: 'voice-transcriber'
        }) : null
      ]);

      return {
        photo,
        voiceNote,
        photoAnalysis,
        voiceTranscription
      };
    })
  );

  // PHASE 2: Work Item Classification
  const classified = await Task({
    description: 'Classify work items',
    prompt: buildClassificationPrompt(photoVoicePairs),
    subagent_type: 'work-item-classifier'
  });

  // PHASE 3: Parallel Hours + Materials Estimation
  const [hoursEstimated, materialsPriced] = await Promise.all([
    Task({
      description: 'Estimate labor hours',
      prompt: buildHoursEstimationPrompt(classified, estimateData.companySettings),
      subagent_type: 'hours-estimator'
    }),

    Task({
      description: 'Price materials',
      prompt: buildMaterialsPricingPrompt(classified, estimateData.companySettings),
      subagent_type: 'materials-pricer'
    })
  ]);

  // PHASE 4: Parallel Formatting + Quality Check
  const [formatted, qualityCheck] = await Promise.all([
    Task({
      description: 'Format estimate',
      prompt: buildFormattingPrompt(hoursEstimated, materialsPriced, estimateData),
      subagent_type: 'estimate-formatter'
    }),

    Task({
      description: 'Quality check',
      prompt: buildQualityCheckPrompt(hoursEstimated, materialsPriced),
      subagent_type: 'quality-checker'
    })
  ]);

  return {
    lineItems: formatted.lineItems,
    totals: formatted.totals,
    pdfHtml: formatted.html,
    qualityScore: qualityCheck.score,
    qualityIssues: qualityCheck.issues,
    aiConfidence: qualityCheck.confidence
  };
}
```

---

## Branding System

### Directory Structure

```
backend/
└── branding/
    └── [company-id]/
        ├── logo.png
        ├── logo-white.png       # For dark backgrounds
        ├── brand-colors.json
        ├── estimate-template.html
        └── email-template.html
```

### Brand Colors JSON

```json
{
  "primary": "#1E3A8A",      // Navy blue
  "secondary": "#F59E0B",    // Amber
  "accent": "#10B981",       // Green
  "text": {
    "dark": "#1F2937",
    "light": "#6B7280",
    "inverse": "#FFFFFF"
  },
  "background": {
    "primary": "#FFFFFF",
    "secondary": "#F3F4F6"
  },
  "border": "#E5E7EB"
}
```

### Estimate Template (HTML)

```html
<!-- backend/branding/[company-id]/estimate-template.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: {{text.dark}};
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid {{primary}};
      margin-bottom: 20px;
    }

    .logo {
      max-width: 200px;
      height: auto;
    }

    .company-info {
      text-align: right;
      color: {{text.light}};
    }

    h1 {
      color: {{primary}};
      font-size: 24pt;
      margin-bottom: 10px;
    }

    h2 {
      color: {{primary}};
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid {{secondary}};
    }

    .estimate-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .customer-info, .estimate-info {
      padding: 15px;
      background: {{background.secondary}};
      border-radius: 5px;
    }

    .work-item {
      page-break-inside: avoid;
      margin-bottom: 30px;
    }

    .work-item-header {
      background: {{primary}};
      color: {{text.inverse}};
      padding: 10px 15px;
      margin-bottom: 10px;
      border-radius: 3px;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
      margin-bottom: 15px;
    }

    .photo {
      width: 100%;
      border-radius: 3px;
      border: 1px solid {{border}};
    }

    .photo-caption {
      font-size: 8pt;
      color: {{text.light}};
      margin-top: 5px;
    }

    .scope-list {
      margin-left: 20px;
      margin-bottom: 15px;
    }

    .scope-list li {
      margin-bottom: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    thead {
      background: {{primary}};
      color: {{text.inverse}};
    }

    th {
      text-align: left;
      padding: 10px;
      font-weight: 600;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid {{border}};
    }

    tbody tr:hover {
      background: {{background.secondary}};
    }

    .text-right {
      text-align: right;
    }

    .total-row {
      font-weight: bold;
      background: {{background.secondary}};
      border-top: 2px solid {{primary}};
    }

    .grand-total {
      font-size: 14pt;
      color: {{primary}};
    }

    .terms {
      margin-top: 30px;
      padding: 15px;
      background: {{background.secondary}};
      border-left: 4px solid {{secondary}};
      font-size: 9pt;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid {{border}};
      text-align: center;
      color: {{text.light}};
      font-size: 8pt;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <img src="{{logo_url}}" alt="{{company_name}}" class="logo">
    <div class="company-info">
      <div><strong>{{company_name}}</strong></div>
      <div>{{company_address}}</div>
      <div>{{company_phone}}</div>
      <div>{{company_email}}</div>
    </div>
  </div>

  <h1>ESTIMATE</h1>

  <!-- Metadata -->
  <div class="estimate-meta">
    <div class="customer-info">
      <h3>CUSTOMER INFORMATION</h3>
      <div><strong>{{customer_name}}</strong></div>
      <div>{{customer_address}}</div>
      <div>{{customer_phone}}</div>
      <div>{{customer_email}}</div>
    </div>

    <div class="estimate-info">
      <h3>ESTIMATE DETAILS</h3>
      <div><strong>Estimate #:</strong> {{estimate_number}}</div>
      <div><strong>Date:</strong> {{estimate_date}}</div>
      <div><strong>Valid Until:</strong> {{expiration_date}}</div>
      <div><strong>Prepared By:</strong> {{estimator_name}}</div>
    </div>
  </div>

  <!-- What We Found -->
  <h2>WHAT WE FOUND</h2>
  <p style="margin-bottom: 20px;">
    During our visit to your property, we identified the following items requiring attention:
  </p>

  {{#each work_items}}
  <div class="work-item">
    <div class="work-item-header">
      <strong>{{this.group_name}}</strong>
    </div>

    {{#if this.photos}}
    <div class="photo-grid">
      {{#each this.photos}}
      <div>
        <img src="{{this.url}}" alt="{{this.caption}}" class="photo">
        {{#if this.caption}}
        <div class="photo-caption">{{this.caption}}</div>
        {{/if}}
      </div>
      {{/each}}
    </div>
    {{/if}}

    <p>{{this.description}}</p>
  </div>
  {{/each}}

  <!-- Detailed Scope -->
  <h2>DETAILED SCOPE OF WORK</h2>

  {{#each work_items}}
  <div class="work-item">
    <h3>{{this.group_name}}</h3>
    <ul class="scope-list">
      {{#each this.line_items}}
      <li>{{this.description}}</li>
      {{/each}}
    </ul>
  </div>
  {{/each}}

  <!-- Investment/Pricing -->
  <h2>INVESTMENT</h2>

  {{#each work_items}}
  <h3>{{this.group_name}}</h3>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Hours</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{#each this.line_items}}
      <tr>
        <td>{{this.description}}</td>
        <td class="text-right">{{this.labor_hours}}</td>
        <td class="text-right">${{this.labor_rate}}/hr</td>
        <td class="text-right">${{this.labor_total}}</td>
      </tr>
      {{/each}}

      {{#if this.materials_display_detailed}}
      <tr>
        <td colspan="4"><strong>Materials:</strong></td>
      </tr>
      {{#each this.materials}}
      <tr>
        <td style="padding-left: 20px;">{{this.name}} ({{this.quantity}} {{this.unit}})</td>
        <td class="text-right" colspan="2">@ ${{this.unit_cost}}</td>
        <td class="text-right">${{this.total_cost}}</td>
      </tr>
      {{/each}}
      <tr>
        <td colspan="3" style="text-align: right;">Materials markup ({{markup_percentage}}%)</td>
        <td class="text-right">${{this.materials_markup}}</td>
      </tr>
      {{else}}
      <tr>
        <td>Materials (including {{markup_percentage}}% markup)</td>
        <td colspan="2"></td>
        <td class="text-right">${{this.materials_total}}</td>
      </tr>
      {{/if}}

      <tr class="total-row">
        <td colspan="3">Subtotal</td>
        <td class="text-right">${{this.subtotal}}</td>
      </tr>
    </tbody>
  </table>
  {{/each}}

  <!-- Grand Total -->
  <table style="margin-top: 30px;">
    <tbody>
      <tr class="total-row">
        <td><strong>TOTAL LABOR HOURS:</strong></td>
        <td class="text-right grand-total">{{total_hours}} hours</td>
      </tr>
      <tr class="total-row">
        <td><strong>TOTAL INVESTMENT:</strong></td>
        <td class="text-right grand-total">${{grand_total}}</td>
      </tr>
    </tbody>
  </table>

  <!-- Terms -->
  <div class="terms">
    <h3>PAYMENT & TERMS</h3>
    <p>{{company_terms}}</p>
  </div>

  <!-- Next Steps -->
  <h2>NEXT STEPS</h2>
  <p>
    To proceed with this work:
  </p>
  <ol style="margin-left: 20px; margin-top: 10px;">
    <li>Reply to approve this estimate</li>
    <li>We'll send an invoice for the deposit</li>
    <li>Once deposit is received, we'll schedule your work</li>
    <li>Typical timeline: {{estimated_timeline}}</li>
  </ol>
  <p style="margin-top: 15px;">
    Questions? Call us at {{company_phone}} or reply to this email.
  </p>
  <p style="margin-top: 10px;">
    Thank you for considering <strong>{{company_name}}</strong>!
  </p>

  <!-- Footer -->
  <div class="footer">
    Generated with EstimateFlow AI • {{generated_date}}
  </div>
</body>
</html>
```

### Template Variable Substitution

Backend service replaces `{{variable}}` placeholders with actual data using Handlebars.js:

```typescript
import Handlebars from 'handlebars';
import fs from 'fs/promises';

export async function generatePDF(estimate: Estimate, companyId: string): Promise<string> {
  // Load company branding
  const brandingPath = `./branding/${companyId}`;
  const templateHtml = await fs.readFile(`${brandingPath}/estimate-template.html`, 'utf-8');
  const brandColors = JSON.parse(await fs.readFile(`${brandingPath}/brand-colors.json`, 'utf-8'));

  // Compile template
  const template = Handlebars.compile(templateHtml);

  // Prepare data
  const data = {
    // Branding
    logo_url: `${brandingPath}/logo.png`,
    company_name: estimate.company.name,
    company_address: formatAddress(estimate.company.address),
    company_phone: estimate.company.phone,
    company_email: estimate.company.email,
    ...brandColors,  // Inject colors

    // Customer
    customer_name: `${estimate.customer.firstName} ${estimate.customer.lastName}`,
    customer_address: formatAddress(estimate.customer.address),
    customer_phone: estimate.customer.phone,
    customer_email: estimate.customer.email,

    // Estimate
    estimate_number: estimate.estimateNumber,
    estimate_date: formatDate(estimate.createdAt),
    expiration_date: formatDate(estimate.expiresAt),
    estimator_name: `${estimate.user.firstName} ${estimate.user.lastName}`,

    // Work items (grouped line items with photos)
    work_items: groupLineItemsByWork(estimate.lineItems, estimate.photos),

    // Totals
    total_hours: estimate.totalHours,
    grand_total: formatCurrency(estimate.grandTotal),

    // Settings
    company_terms: estimate.company.settings.estimate_defaults.terms,
    markup_percentage: estimate.company.settings.pricing.materials_markup * 100,
    estimated_timeline: '2-3 business days',

    // Meta
    generated_date: formatDate(new Date())
  };

  // Render HTML
  const html = template(data);

  // Convert to PDF using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'letter',
    printBackground: true,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
  });
  await browser.close();

  // Upload to S3/R2
  const pdfUrl = await uploadToStorage(pdfBuffer, `estimates/${estimate.estimateNumber}.pdf`);

  return pdfUrl;
}
```

---

## Security & Privacy

### Authentication

- **JWT Tokens**: Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- **Password Hashing**: bcrypt with salt rounds = 12
- **Token Storage**:
  - Mobile: Expo SecureStore (encrypted)
  - Backend: Redis (refresh tokens with TTL)

### Authorization

- **Role-Based Access Control (RBAC)**:
  - `owner`: Full access to company settings, billing
  - `admin`: Manage users, view all estimates
  - `estimator`: Create/edit own estimates only
  - `viewer`: Read-only access

### Data Protection

- **Encryption at Rest**: PostgreSQL with encryption enabled (via Supabase)
- **Encryption in Transit**: HTTPS/TLS 1.3 only
- **File Storage**: Private S3/R2 buckets, signed URLs with 1-hour expiration
- **PII Handling**: Customer data encrypted, GDPR-compliant data export/deletion

### API Security

- **Rate Limiting**:
  - Authentication endpoints: 5 requests/min per IP
  - API endpoints: 100 requests/min per user
  - File uploads: 10 uploads/min per user
- **Input Validation**: Zod schemas for all requests
- **SQL Injection Protection**: Prisma ORM (parameterized queries)
- **XSS Protection**: Content Security Policy headers
- **CORS**: Whitelist mobile app + admin web domains only

### AI Security

- **Prompt Injection Prevention**: Sanitize user inputs before sending to Claude
- **Output Validation**: Validate agent responses against expected schema
- **Cost Controls**: Per-estimate token limits, monthly budget alerts
- **Data Privacy**: Photos/voice notes not retained in Claude's systems (per Anthropic policy)

---

## Performance Requirements

### Response Time Targets

| Endpoint | Target | Max Acceptable |
|----------|--------|----------------|
| Authentication | < 200ms | 500ms |
| List estimates | < 300ms | 1s |
| Upload photo | < 2s | 5s |
| Upload voice note | < 3s | 8s |
| AI processing (total) | < 45s | 90s |
| Generate PDF | < 5s | 10s |
| Send email | < 3s | 8s |

### Throughput Targets

- **Concurrent users**: 50 (MVP), 500 (Year 1)
- **Estimates processed/hour**: 100 (MVP), 1000 (Year 1)
- **File uploads/hour**: 500 photos + 500 voice notes

### Scalability

- **Horizontal Scaling**: Backend API (stateless, containerized)
- **Database**: Connection pooling (Prisma + PgBouncer), read replicas for reporting
- **File Storage**: CDN for fast global delivery
- **Job Queue**: Multiple worker instances for AI processing
- **Caching**: Redis for frequently accessed data (company settings, user sessions)

### Optimization Strategies

1. **Parallel Agent Execution**: Reduce processing time by 60%
2. **Image Optimization**: Compress photos on upload (75% quality JPEG)
3. **Lazy Loading**: Mobile app loads estimates list first, details on demand
4. **PDF Caching**: Cache generated PDFs, regenerate only on edits
5. **Voice Compression**: AAC codec for smaller file sizes

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare (CDN + DNS)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   R2 Files   │  │   CDN Cache  │  │  DDoS Protect│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│            Railway / Render (Backend Hosting)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API (×3)   │  │ Workers (×2) │  │  Redis       │      │
│  │   Node.js    │  │  BullMQ      │  │  Queue       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Supabase (Database + Auth)                      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  PostgreSQL  │  │   Auth API   │                         │
│  │   Primary    │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 External Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Anthropic  │  │   SendGrid   │  │   Sentry     │      │
│  │  Claude API  │  │    Email     │  │   Errors     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Mobile Clients                             │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   iOS App    │  │ Android App  │                         │
│  │  (Expo EAS)  │  │  (Expo EAS)  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service backend

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive
      - run: eas submit --platform all --non-interactive
```

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host/db
DATABASE_POOL_SIZE=20

# Auth
JWT_SECRET=<random-256-bit-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_BUCKET_NAME=estimateflow-files
R2_PUBLIC_URL=https://files.estimateflow.app

# Redis (Queue)
REDIS_URL=redis://user:pass@host:port

# Claude API
ANTHROPIC_API_KEY=<api-key>

# Email (SendGrid)
SENDGRID_API_KEY=<api-key>
SENDGRID_FROM_EMAIL=noreply@estimateflow.app
SENDGRID_FROM_NAME=EstimateFlow

# Monitoring
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info
```

```bash
# Mobile (.env)
API_URL=https://api.estimateflow.app
EXPO_PUBLIC_API_URL=https://api.estimateflow.app
```

### Monitoring & Alerting

- **Error Tracking**: Sentry (backend + mobile)
- **Logs**: LogTail (structured JSON logs)
- **Uptime**: UptimeRobot (API health checks every 5 min)
- **Performance**: Railway metrics dashboard
- **Alerts**:
  - API error rate > 5%
  - API response time > 2s (p95)
  - Queue depth > 50 jobs
  - Database connection pool > 80%
  - Monthly Claude API spend > $500

---

## Development Environment

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 16 (or Docker)
- Redis (or Docker)
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Setup

```bash
# Clone repo
git clone <repo-url>
cd estimateflow

# Install dependencies
npm install

# Setup database
cd backend
npx prisma migrate dev
npx prisma db seed

# Setup environment
cp .env.example .env
# Edit .env with local values

# Run backend
npm run dev

# Run mobile app (separate terminal)
cd mobile
npm install
npx expo start
```

### Local Development Stack

```
Backend:  http://localhost:3000
Database: postgresql://localhost:5432/estimateflow_dev
Redis:    redis://localhost:6379
Mobile:   Expo Dev Client (scan QR code)
```

---

## Next Steps

1. ✅ Review this technical specification
2. Create detailed agent specifications (in `/project-docs/agents/`)
3. Create GitHub issues breakdown for parallel development
4. Set up project repository structure
5. Configure CI/CD and deployment infrastructure
6. Begin parallel development across feature branches

---

**Document Version**: 1.0.0
**Last Updated**: January 25, 2025
**Prepared By**: Claude Code Agent Architecture Team
