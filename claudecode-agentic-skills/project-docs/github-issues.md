# EstimateFlow - GitHub Issues Breakdown

This document provides a comprehensive breakdown of development tasks organized as GitHub issues for parallel development using the `parallel-dev-automation` skill.

## Issue Organization

Issues are tagged with:
- **Priority**: `p0` (critical), `p1` (high), `p2` (medium), `p3` (low)
- **Complexity**: `complexity:low`, `complexity:medium`, `complexity:high`
- **Type**: `feat`, `fix`, `docs`, `refactor`, `test`, `infra`
- **Automation**: `claude-task` (triggers automated Claude Code development)
- **Dependencies**: Listed in issue body using `Depends on #X` notation

## Phase Organization

### Foundation Phase (Week 1)
Core infrastructure, database, authentication - **must complete before other work**

### Backend Phase (Week 1-2)
API endpoints, agent orchestration, file handling - **can parallelize**

### Agent Phase (Week 1-2)
Create all specialized agents - **highly parallelizable**

### Mobile Phase (Week 3-4)
React Native app development - **can parallelize by screen**

### Integration Phase (Week 5-6)
Connect all pieces, testing, polish - **some parallelization possible**

---

## Foundation Phase Issues (Week 1)

### INFRA-001: Project Repository Setup
```yaml
Title: Initialize project repository structure and tooling
Labels: infra, p0, complexity:low, claude-task
Assignee: claude-agent

Description:
Create base project structure for monorepo with backend and mobile apps.

Tasks:
- Initialize git repository
- Create directory structure (backend/, mobile/, shared/)
- Set up package.json with workspaces
- Configure TypeScript (tsconfig.json)
- Set up ESLint + Prettier
- Add .gitignore
- Create README.md with setup instructions
- Initialize backend package (Express + TypeScript)
- Initialize mobile package (Expo)

Acceptance Criteria:
- ✅ Clean directory structure
- ✅ npm install works in root and all packages
- ✅ TypeScript compiles without errors
- ✅ Linting passes
- ✅ README has clear setup steps

Dependencies: None
Estimated Hours: 2-3
```

### INFRA-002: Database Setup with Prisma
```yaml
Title: Set up PostgreSQL database with Prisma ORM
Labels: infra, p0, complexity:medium, claude-task

Description:
Configure PostgreSQL database and Prisma ORM with initial schema.

Tasks:
- Install Prisma dependencies
- Initialize Prisma (npx prisma init)
- Create complete Prisma schema (see technical-specs.md)
- Set up database connection
- Create initial migration
- Set up Prisma Client
- Add seed script for development data
- Document database setup in README

Acceptance Criteria:
- ✅ Prisma schema matches technical spec
- ✅ Migration runs successfully
- ✅ Seed script creates test data
- ✅ Can query database using Prisma Client
- ✅ All indexes created

Dependencies: INFRA-001
Estimated Hours: 3-4
```

### INFRA-003: Authentication System
```yaml
Title: Implement JWT-based authentication system
Labels: infra, feat, p0, complexity:medium, claude-task

Description:
Build authentication system with JWT tokens, password hashing, and user session management.

Tasks:
- Install bcrypt, jsonwebtoken, zod
- Create auth middleware for Express
- Implement password hashing utilities
- Create JWT token generation/verification
- Implement refresh token logic
- Add rate limiting for auth endpoints
- Create auth endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout
  - GET /api/auth/me
- Add input validation with Zod
- Add tests for auth flows

Acceptance Criteria:
- ✅ Users can register with email/password
- ✅ Users can login and receive JWT
- ✅ Refresh token flow works
- ✅ Protected routes require valid JWT
- ✅ Password is hashed with bcrypt
- ✅ Tests pass for all auth scenarios

Dependencies: INFRA-002
Estimated Hours: 4-5
```

### INFRA-004: File Upload Service
```yaml
Title: Set up Cloudflare R2 file storage with upload service
Labels: infra, feat, p0, complexity:medium, claude-task

Description:
Configure Cloudflare R2 for file storage and create upload service for photos and audio.

Tasks:
- Set up Cloudflare R2 bucket
- Install AWS SDK v3 (S3 client)
- Create upload service with multipart support
- Implement signed URL generation (1-hour expiry)
- Add file type validation (images: jpg/png, audio: m4a/mp3)
- Add file size limits (images: 25MB, audio: 50MB)
- Create upload endpoints:
  - POST /api/upload/photo
  - POST /api/upload/voice
- Add image compression (75% quality JPEG)
- Add error handling and cleanup
- Add tests

Acceptance Criteria:
- ✅ Can upload photos to R2
- ✅ Can upload audio files to R2
- ✅ File size limits enforced
- ✅ Only allowed file types accepted
- ✅ Signed URLs work and expire
- ✅ Images are compressed on upload

Dependencies: INFRA-001
Estimated Hours: 4-5
```

### INFRA-005: Job Queue with BullMQ
```yaml
Title: Set up BullMQ job queue with Redis for async processing
Labels: infra, p0, complexity:medium, claude-task

Description:
Configure Redis and BullMQ for asynchronous estimate processing jobs.

Tasks:
- Set up Redis connection (Upstash or local)
- Install BullMQ
- Create queue configuration
- Create worker process for estimate processing
- Add job monitoring/logging
- Implement retry logic (3 attempts, exponential backoff)
- Create queue management utilities
- Add health check endpoint for queue
- Document queue architecture

Acceptance Criteria:
- ✅ Can enqueue jobs
- ✅ Worker processes jobs
- ✅ Failed jobs retry automatically
- ✅ Can monitor queue status
- ✅ Health check endpoint works

Dependencies: INFRA-001
Estimated Hours: 3-4
```

---

## Backend API Phase Issues (Week 1-2)

### API-001: Company Settings Endpoints
```yaml
Title: Create company settings CRUD endpoints
Labels: feat, backend, p1, complexity:low, claude-task

Description:
Build API endpoints for managing company settings (pricing, branding, terms).

Tasks:
- Create company settings controller
- Implement endpoints:
  - GET /api/company/settings
  - PATCH /api/company/settings
  - PATCH /api/company/branding (logo upload)
- Add validation for settings schema
- Add authorization (only owner/admin)
- Create seed data for development
- Add tests

Acceptance Criteria:
- ✅ Can retrieve company settings
- ✅ Can update pricing configuration
- ✅ Can upload company logo
- ✅ Settings validation works
- ✅ Non-admin users cannot edit settings

Dependencies: INFRA-002, INFRA-003
Estimated Hours: 3-4
```

### API-002: Customer Management Endpoints
```yaml
Title: Create customer CRUD endpoints
Labels: feat, backend, p1, complexity:low, claude-task

Description:
Build API endpoints for customer management.

Tasks:
- Create customer controller
- Implement endpoints:
  - GET /api/customers (list with pagination)
  - POST /api/customers (create)
  - GET /api/customers/:id (details)
  - PATCH /api/customers/:id (update)
  - DELETE /api/customers/:id (soft delete)
- Add search/filter functionality
- Add validation with Zod
- Add tests

Acceptance Criteria:
- ✅ Can create customers
- ✅ Can list customers with pagination
- ✅ Can search customers by name/email
- ✅ Can update customer info
- ✅ Validation prevents invalid data

Dependencies: INFRA-002, INFRA-003
Estimated Hours: 3-4
```

### API-003: Estimate CRUD Endpoints
```yaml
Title: Create estimate management endpoints
Labels: feat, backend, p1, complexity:medium, claude-task

Description:
Build core estimate CRUD endpoints (without AI processing).

Tasks:
- Create estimate controller
- Implement endpoints:
  - GET /api/estimates (list with filters)
  - POST /api/estimates (create draft)
  - GET /api/estimates/:id (details with relations)
  - PATCH /api/estimates/:id (update)
  - DELETE /api/estimates/:id (soft delete)
- Add estimate number generation (EST-YYYY-###)
- Add status management (draft, sent, viewed, approved, etc.)
- Include line items, photos, voice notes in responses
- Add pagination and filtering
- Add tests

Acceptance Criteria:
- ✅ Can create draft estimates
- ✅ Can list estimates with filters (status, date range)
- ✅ Estimate number auto-generates
- ✅ Can update estimate details
- ✅ Relations (line items, photos) load correctly

Dependencies: INFRA-002, INFRA-003, API-002
Estimated Hours: 4-5
```

### API-004: Line Item Management Endpoints
```yaml
Title: Create line item CRUD endpoints with edit history
Labels: feat, backend, p1, complexity:medium, claude-task

Description:
Build endpoints for managing estimate line items with full edit capabilities and history tracking.

Tasks:
- Create line item controller
- Implement endpoints:
  - GET /api/estimates/:id/line-items
  - POST /api/estimates/:id/line-items
  - PATCH /api/line-items/:id
  - DELETE /api/line-items/:id
  - POST /api/line-items/:id/reorder
- Create edit history tracking
- Implement rollback functionality
- Add materials sub-items management
- Recalculate estimate totals on changes
- Add tests

Acceptance Criteria:
- ✅ Can add/edit/delete line items
- ✅ Can reorder line items
- ✅ Edit history is tracked
- ✅ Can rollback to previous values
- ✅ Estimate totals update automatically

Dependencies: API-003
Estimated Hours: 4-5
```

### API-005: Photo and Voice Note Management
```yaml
Title: Create photo and voice note management endpoints
Labels: feat, backend, p1, complexity:medium, claude-task

Description:
Build endpoints for managing uploaded photos and voice notes with linking to estimates/line items.

Tasks:
- Create photo controller
- Create voice note controller
- Implement endpoints:
  - POST /api/estimates/:id/photos (attach uploaded photo)
  - GET /api/photos/:id
  - PATCH /api/photos/:id (update caption, link to line item)
  - DELETE /api/photos/:id
  - POST /api/estimates/:id/voice-notes
  - GET /api/voice-notes/:id
  - DELETE /api/voice-notes/:id
  - PATCH /api/voice-notes/:id/link-photo
- Implement photo-line item linking
- Implement voice-photo pairing
- Add soft delete for safety
- Add tests

Acceptance Criteria:
- ✅ Can attach photos to estimates
- ✅ Can update photo captions
- ✅ Can link photos to line items
- ✅ Can pair voice notes with photos
- ✅ Deleted files don't break estimates

Dependencies: API-003, INFRA-004
Estimated Hours: 4-5
```

### API-006: AI Processing Orchestration Endpoint
```yaml
Title: Create main AI processing orchestration endpoint
Labels: feat, backend, p0, complexity:high, claude-task

Description:
Build the core endpoint that orchestrates all AI agents to process estimates.

Tasks:
- Create processing service
- Implement POST /api/estimates/process endpoint
- Enqueue processing job to BullMQ
- Create worker that orchestrates agents:
  - Phase 1: Parallel photo analysis + voice transcription
  - Phase 2: Work item classification
  - Phase 3: Parallel hours estimation + materials pricing
  - Phase 4: Parallel formatting + quality check
- Implement progress tracking
- Create GET /api/estimates/:id/status for real-time updates
- Store agent outputs in database
- Handle errors and retries
- Add comprehensive logging
- Add tests

Acceptance Criteria:
- ✅ Can enqueue estimate processing
- ✅ All agent phases execute in correct order
- ✅ Parallel phases actually run in parallel
- ✅ Progress updates work in real-time
- ✅ Errors are caught and logged
- ✅ Final estimate data stored correctly

Dependencies: API-003, API-005, INFRA-005, All Agent Issues
Estimated Hours: 6-8
```

### API-007: PDF Generation Service
```yaml
Title: Create PDF generation service with branded templates
Labels: feat, backend, p1, complexity:medium, claude-task

Description:
Build service to generate professional PDFs from estimates using Puppeteer.

Tasks:
- Install Puppeteer
- Create branding directory structure
- Implement template system (Handlebars)
- Create default estimate template HTML/CSS
- Implement PDF generation function
- Create POST /api/estimates/:id/generate-pdf endpoint
- Add photo embedding in PDF
- Implement materials display toggle (detailed vs rolled-up)
- Upload generated PDF to R2
- Add caching (regenerate only on edits)
- Add tests

Acceptance Criteria:
- ✅ Generates professional-looking PDF
- ✅ Company branding applied correctly
- ✅ Photos embedded properly
- ✅ Materials display toggle works
- ✅ PDF uploaded to R2 and URL returned

Dependencies: API-003, INFRA-004
Estimated Hours: 5-6
```

### API-008: Email Delivery Service
```yaml
Title: Create email delivery service with SendGrid
Labels: feat, backend, p1, complexity:medium, claude-task

Description:
Build service to send estimates to customers via email using SendGrid.

Tasks:
- Install SendGrid SDK
- Create email service
- Design email template (HTML + plain text)
- Implement POST /api/estimates/:id/send endpoint
- Attach PDF to email
- Store email log in database
- Implement SendGrid webhooks for tracking (delivered, opened)
- Add email validation
- Handle SendGrid errors gracefully
- Add tests

Acceptance Criteria:
- ✅ Can send email with PDF attachment
- ✅ Email template looks professional
- ✅ Email delivery tracked in database
- ✅ Bounced emails logged
- ✅ Email opened events tracked

Dependencies: API-007
Estimated Hours: 4-5
```

### API-009: AI Text Rewrite Endpoint
```yaml
Title: Create AI text rewrite endpoint with rollback
Labels: feat, backend, p2, complexity:medium, claude-task

Description:
Build endpoint for on-demand AI text improvements with history and rollback.

Tasks:
- Create text rewriter service (using Claude Haiku)
- Implement POST /api/line-items/:id/rewrite-text endpoint
- Accept field name and improvement instructions
- Save original text to edit_history table
- Call text-rewriter agent
- Return both original and rewritten text
- Implement POST /api/line-items/:id/rollback endpoint
- Add tests for rewrite and rollback

Acceptance Criteria:
- ✅ Can rewrite line item descriptions
- ✅ Can rewrite customer notes
- ✅ Edit history saved properly
- ✅ Can rollback to previous version
- ✅ Multiple rollbacks work (history chain)

Dependencies: API-004, AGENT-008
Estimated Hours: 3-4
```

---

## Agent Phase Issues (Week 1-2)

All agent issues can be developed **in parallel** as they're independent.

### AGENT-001: Photo Analyzer Agent
```yaml
Title: Create photo analyzer agent for construction damage assessment
Labels: feat, agent, p0, complexity:medium, claude-task

Description:
Build specialized agent that analyzes construction photos to identify issues, materials, and scope.

Tasks:
- Create .claude/agents/photo-analyzer.md
- Define agent frontmatter (name, description, tools, model)
- Write comprehensive prompt for photo analysis
- Include instructions for:
  - Damage type identification (crack, leak, rot, etc.)
  - Material detection (tile, wood, drywall, etc.)
  - Scope estimation (affected area)
  - Severity assessment (cosmetic, functional, safety)
  - Photo quality check
- Define output JSON schema
- Test with sample construction photos
- Document usage examples

Acceptance Criteria:
- ✅ Agent accurately identifies common construction issues
- ✅ Output matches defined JSON schema
- ✅ Works with various photo quality levels
- ✅ Provides useful metadata for estimation

Dependencies: None
Estimated Hours: 3-4
File: .claude/agents/photo-analyzer.md
```

### AGENT-002: Voice Transcriber Agent
```yaml
Title: Create voice transcription agent with construction terminology
Labels: feat, agent, p0, complexity:medium, claude-task

Description:
Build agent that transcribes voice notes and extracts structured work scope data.

Tasks:
- Create .claude/agents/voice-transcriber.md
- Write prompt for accurate transcription
- Include construction jargon/terminology handling
- Define extraction rules for:
  - Work scope description
  - Materials mentioned
  - Measurements and quantities
  - Customer preferences/concerns
  - Special requirements
- Define output JSON schema
- Test with sample audio transcriptions
- Document usage examples

Acceptance Criteria:
- ✅ Accurately transcribes construction terminology
- ✅ Extracts structured data from narration
- ✅ Handles measurements (sq ft, linear ft, etc.)
- ✅ Identifies customer concerns

Dependencies: None
Estimated Hours: 3-4
File: .claude/agents/voice-transcriber.md
```

### AGENT-003: Work Item Classifier Agent
```yaml
Title: Create work item classifier agent
Labels: feat, agent, p0, complexity:medium, claude-task

Description:
Build agent that categorizes construction work into standardized line items.

Tasks:
- Create .claude/agents/work-item-classifier.md
- Define standard work categories (tile, plumbing, doors, etc.)
- Write classification logic
- Include task breakdown rules (complex → multiple line items)
- Define dependency identification
- Create output schema for line items
- Test with various work descriptions
- Document category taxonomy

Acceptance Criteria:
- ✅ Accurately categorizes common construction tasks
- ✅ Breaks complex work into multiple line items
- ✅ Identifies task dependencies
- ✅ Output format matches database schema

Dependencies: None
Estimated Hours: 3-4
File: .claude/agents/work-item-classifier.md
```

### AGENT-004: Hours Estimator Agent
```yaml
Title: Create hours estimation agent with industry standards
Labels: feat, agent, p0, complexity:high, claude-task

Description:
Build agent that calculates accurate labor hour estimates using industry standards and company rates.

Tasks:
- Create .claude/agents/hours-estimator.md
- Research industry standard hour estimates for common tasks
- Incorporate company-specific productivity rates
- Add buffer calculation logic (15% default)
- Include setup/cleanup time
- Factor in job complexity
- Define confidence scoring (low/medium/high)
- Create output schema
- Test with various scenarios
- Document estimation methodology

Acceptance Criteria:
- ✅ Provides reasonable hour estimates
- ✅ Applies buffer for unknowns
- ✅ Adjusts for complexity
- ✅ Includes confidence score
- ✅ Learning mechanism for improvement

Dependencies: None
Estimated Hours: 4-5
File: .claude/agents/hours-estimator.md
```

### AGENT-005: Materials Pricer Agent
```yaml
Title: Create materials pricing agent
Labels: feat, agent, p0, complexity:medium, claude-task

Description:
Build agent that estimates material quantities and typical costs.

Tasks:
- Create .claude/agents/materials-pricer.md
- Define material estimation logic
- Include common material costs (approximate)
- Add markup calculation (from company settings)
- Group materials by category
- Handle quantity calculations
- Define output schema
- Test with various projects
- Document pricing methodology

Acceptance Criteria:
- ✅ Estimates material quantities accurately
- ✅ Provides realistic cost estimates
- ✅ Applies company markup correctly
- ✅ Groups related materials

Dependencies: None
Estimated Hours: 3-4
File: .claude/agents/materials-pricer.md
```

### AGENT-006: Estimate Formatter Agent
```yaml
Title: Create estimate formatting agent
Labels: feat, agent, p0, complexity:high, claude-task

Description:
Build agent that generates professional estimate documents with proper formatting and structure.

Tasks:
- Create .claude/agents/estimate-formatter.md
- Define document structure sections:
  - Header (company info)
  - Customer info
  - "What We Found" (photos + descriptions)
  - Detailed scope of work
  - Pricing table
  - Terms & conditions
  - Next steps
- Implement photo organization logic
- Create materials display toggle handling
- Define HTML output format (for PDF generation)
- Test with various estimates
- Document formatting rules

Acceptance Criteria:
- ✅ Generates well-structured estimates
- ✅ Photos organized logically
- ✅ Professional presentation
- ✅ Both materials display modes work
- ✅ Output ready for PDF conversion

Dependencies: None
Estimated Hours: 4-5
File: .claude/agents/estimate-formatter.md
```

### AGENT-007: Quality Checker Agent
```yaml
Title: Create quality assurance agent
Labels: feat, agent, p1, complexity:medium, claude-task

Description:
Build agent that reviews estimates for completeness, accuracy, and professionalism.

Tasks:
- Create .claude/agents/quality-checker.md
- Define quality check criteria:
  - All photos have descriptions
  - All line items have pricing
  - Customer details complete
  - Calculations correct
  - Professional tone
  - No missing information
- Implement scoring system (0-100)
- Create issue flagging (warning vs error)
- Add improvement suggestions
- Test with good and bad estimates
- Document quality standards

Acceptance Criteria:
- ✅ Identifies missing information
- ✅ Flags calculation errors
- ✅ Scores estimate quality
- ✅ Provides actionable suggestions
- ✅ Distinguishes warnings from blockers

Dependencies: None
Estimated Hours: 3-4
File: .claude/agents/quality-checker.md
```

### AGENT-008: Text Rewriter Agent
```yaml
Title: Create text rewriting agent for grammar and clarity
Labels: feat, agent, p2, complexity:low, claude-task

Description:
Build fast agent (Haiku) that improves text clarity and fixes grammar.

Tasks:
- Create .claude/agents/text-rewriter.md
- Write prompt for text improvement
- Maintain original meaning/facts
- Fix grammar, spelling, punctuation
- Improve clarity and professionalism
- Handle construction terminology properly
- Preserve technical details/measurements
- Test with various text samples
- Document rewrite guidelines

Acceptance Criteria:
- ✅ Fixes grammar errors
- ✅ Improves clarity without changing meaning
- ✅ Preserves technical accuracy
- ✅ Maintains professional tone
- ✅ Fast processing (< 3 seconds)

Dependencies: None
Estimated Hours: 2-3
File: .claude/agents/text-rewriter.md
```

---

## Mobile App Phase Issues (Week 3-4)

These issues can be largely parallelized by screen/feature.

### MOBILE-001: Project Setup and Navigation
```yaml
Title: Initialize React Native project with navigation
Labels: feat, mobile, p0, complexity:medium, claude-task

Description:
Set up React Native (Expo) project with navigation, theming, and core dependencies.

Tasks:
- Initialize Expo project
- Install dependencies:
  - React Navigation
  - React Native Paper (UI)
  - Axios (HTTP)
  - React Query (data fetching)
  - Zustand (state management)
  - Expo Camera, Expo AV, Expo SecureStore
- Set up navigation structure (stack + tabs)
- Configure theme (colors, fonts)
- Create base layout components
- Add environment configuration
- Set up TypeScript
- Add tests

Acceptance Criteria:
- ✅ App runs on iOS and Android
- ✅ Navigation works
- ✅ Theme applied
- ✅ TypeScript configured
- ✅ Can make API calls (test endpoint)

Dependencies: None
Estimated Hours: 4-5
```

### MOBILE-002: Authentication Screens
```yaml
Title: Create login and registration screens
Labels: feat, mobile, p0, complexity:medium, claude-task

Description:
Build authentication screens with validation and token management.

Tasks:
- Create login screen
- Create registration screen
- Implement form validation
- Connect to auth API endpoints
- Store JWT in SecureStore
- Set up axios interceptors for auth headers
- Add error handling
- Create auth context/state
- Add loading states
- Add tests

Acceptance Criteria:
- ✅ Users can register
- ✅ Users can login
- ✅ Token stored securely
- ✅ Protected routes require auth
- ✅ Validation errors shown clearly

Dependencies: MOBILE-001, API (auth endpoints)
Estimated Hours: 4-5
```

### MOBILE-003: Job Setup Screen
```yaml
Title: Create new estimate job setup screen
Labels: feat, mobile, p1, complexity:low, claude-task

Description:
Build screen for entering customer info before photo/voice capture.

Tasks:
- Create job setup form screen
- Add input fields:
  - Customer name
  - Phone (with formatting)
  - Email (with validation)
  - Property address
- Implement customer search/autocomplete
- Add validation
- Store draft data locally (offline support)
- Create "Start Photos" / "Start Voice" buttons
- Add tests

Acceptance Criteria:
- ✅ Can enter customer details
- ✅ Phone and email validated
- ✅ Can search existing customers
- ✅ Data persists if app closes
- ✅ Can proceed to photo or voice capture

Dependencies: MOBILE-001, API-002
Estimated Hours: 3-4
```

### MOBILE-004: Photo Capture Screen
```yaml
Title: Create photo capture screen with Expo Camera
Labels: feat, mobile, p0, complexity:medium, claude-task

Description:
Build camera screen for capturing job site photos.

Tasks:
- Create camera screen using Expo Camera
- Implement photo capture
- Add photo preview thumbnails
- Show photo count
- Allow photo deletion
- Implement photo compression before upload
- Store photos locally (offline)
- Upload photos to API when online
- Add "Done with Photos" button
- Add tests

Acceptance Criteria:
- ✅ Can take multiple photos
- ✅ Can preview photos taken
- ✅ Can delete unwanted photos
- ✅ Photos compressed appropriately
- ✅ Works offline (uploads when connected)

Dependencies: MOBILE-001, API-005, INFRA-004
Estimated Hours: 5-6
```

### MOBILE-005: Voice Note Recording Screen
```yaml
Title: Create voice note recording screen (photo-paired)
Labels: feat, mobile, p0, complexity:high, claude-task

Description:
Build screen for recording voice notes paired with each photo (Whispr Flow style).

Tasks:
- Create voice recording screen
- Display current photo being narrated
- Implement hold-to-record button
- Add waveform visualization
- Display recording duration
- Allow re-record
- Show skip option
- Navigate through photos
- Upload voice notes to API
- Add offline support
- Add tests

Acceptance Criteria:
- ✅ Hold-to-record works smoothly
- ✅ Waveform shows while recording
- ✅ Can re-record if needed
- ✅ Can skip photos without voice
- ✅ Uploads when online

Dependencies: MOBILE-001, API-005
Estimated Hours: 6-7
```

### MOBILE-006: Voice-First Recording Screen (Alternative)
```yaml
Title: Create standalone voice recording screen (no photos yet)
Labels: feat, mobile, p2, complexity:medium, claude-task

Description:
Build alternative workflow: record voice notes first, add photos later.

Tasks:
- Create voice-only recording screen
- Multi-part recording (multiple issues)
- Label/organize recordings
- Add photo linking later
- Upload recordings
- Add offline support
- Add tests

Acceptance Criteria:
- ✅ Can record multiple voice notes
- ✅ Can organize/label notes
- ✅ Can add photos to notes later
- ✅ Flexible workflow works

Dependencies: MOBILE-001, API-005
Estimated Hours: 4-5
```

### MOBILE-007: AI Processing Status Screen
```yaml
Title: Create AI processing progress screen
Labels: feat, mobile, p1, complexity:medium, claude-task

Description:
Build screen showing real-time AI processing progress.

Tasks:
- Create processing screen
- Show loading animation
- Display current phase (photo analysis, transcription, etc.)
- Show progress percentage
- Poll status endpoint every 2 seconds
- Handle processing errors
- Auto-navigate to review screen when complete
- Add estimated time remaining
- Add tests

Acceptance Criteria:
- ✅ Shows real-time progress
- ✅ Phase labels update
- ✅ Progress bar accurate
- ✅ Navigates on completion
- ✅ Handles errors gracefully

Dependencies: MOBILE-001, API-006
Estimated Hours: 4-5
```

### MOBILE-008: Estimate Review & Edit Screen
```yaml
Title: Create estimate review and edit screen
Labels: feat, mobile, p0, complexity:high, claude-task

Description:
Build main screen for reviewing and editing generated estimates.

Tasks:
- Create scrollable estimate view
- Display customer info (editable)
- Show quality score
- List line items grouped by work area
- Show photos linked to line items
- Display hours, pricing, totals
- Implement inline editing for all fields:
  - Line item descriptions
  - Hours
  - Materials
  - Pricing
- Add line item reorder (drag & drop)
- Add/remove line items
- Implement materials display toggle (detailed/rolled-up)
- Auto-recalculate totals on edits
- Add save draft
- Add tests

Acceptance Criteria:
- ✅ Estimate displays clearly
- ✅ All fields editable
- ✅ Can add/remove line items
- ✅ Totals recalculate automatically
- ✅ Materials toggle works
- ✅ Changes saved as draft

Dependencies: MOBILE-001, API-003, API-004
Estimated Hours: 7-8
```

### MOBILE-009: AI Text Rewrite Feature
```yaml
Title: Add AI text rewrite button with rollback
Labels: feat, mobile, p2, complexity:medium, claude-task

Description:
Add feature to rewrite text fields using AI with ability to rollback.

Tasks:
- Add "Improve Text" button to description fields
- Show loading state during rewrite
- Display original and rewritten text side-by-side
- Add "Use Rewrite" and "Keep Original" buttons
- Implement rollback to previous version
- Show edit history (optional)
- Add tests

Acceptance Criteria:
- ✅ Can trigger AI rewrite
- ✅ Shows before/after comparison
- ✅ Can accept or reject rewrite
- ✅ Can rollback to earlier versions
- ✅ UX is intuitive

Dependencies: MOBILE-008, API-009
Estimated Hours: 3-4
```

### MOBILE-010: Send Estimate Screen
```yaml
Title: Create email sending screen
Labels: feat, mobile, p1, complexity:medium, claude-task

Description:
Build screen for sending estimate to customer via email.

Tasks:
- Create send screen
- Pre-fill customer email
- Allow email editing
- Show email subject (editable)
- Show email body (editable with template)
- Show PDF attachment preview
- Add "Send Email" button
- Show sending progress
- Handle send errors
- Navigate to success screen
- Add tests

Acceptance Criteria:
- ✅ Email pre-filled from customer data
- ✅ Can edit email content
- ✅ PDF preview works
- ✅ Sending progress shown
- ✅ Success/error states handled

Dependencies: MOBILE-001, API-008
Estimated Hours: 3-4
```

### MOBILE-011: Estimates List Screen
```yaml
Title: Create estimates list and dashboard
Labels: feat, mobile, p1, complexity:medium, claude-task

Description:
Build home screen showing list of all estimates.

Tasks:
- Create list screen with pull-to-refresh
- Show estimate cards with:
  - Customer name
  - Address
  - Status (draft, sent, approved, etc.)
  - Total amount
  - Date
- Add filtering by status
- Add search
- Implement pagination (infinite scroll)
- Add status badges with colors
- Tap to view details
- Add tests

Acceptance Criteria:
- ✅ Lists all estimates
- ✅ Can filter by status
- ✅ Search works
- ✅ Pagination loads more
- ✅ Tap navigates to details

Dependencies: MOBILE-001, API-003
Estimated Hours: 4-5
```

### MOBILE-012: Offline Support
```yaml
Title: Implement offline-first architecture
Labels: feat, mobile, p2, complexity:high, claude-task

Description:
Add offline support for capturing data without internet connection.

Tasks:
- Set up local storage with AsyncStorage
- Queue API calls when offline
- Sync when connection restored
- Store photos locally before upload
- Store voice notes locally
- Cache estimate data
- Show offline indicator
- Handle conflicts on sync
- Add tests

Acceptance Criteria:
- ✅ Can capture photos offline
- ✅ Can record voice offline
- ✅ Data syncs when online
- ✅ Offline indicator shown
- ✅ No data loss

Dependencies: MOBILE-004, MOBILE-005
Estimated Hours: 6-7
```

---

## Integration & Polish Phase Issues (Week 5-6)

### INTEGRATION-001: End-to-End Testing
```yaml
Title: Create comprehensive E2E test suite
Labels: test, p1, complexity:high, claude-task

Description:
Build end-to-end tests covering full user workflows.

Tasks:
- Set up testing framework (Detox for mobile, Jest for backend)
- Create test scenarios:
  - Complete estimate creation (photo + voice → AI → review → send)
  - Edit existing estimate
  - Customer management
  - Settings configuration
- Add API integration tests
- Add mobile UI tests
- Set up CI/CD test automation
- Document test coverage

Acceptance Criteria:
- ✅ All major workflows have E2E tests
- ✅ Tests pass in CI/CD
- ✅ Coverage > 80%
- ✅ Tests are maintainable

Dependencies: All Mobile and Backend issues
Estimated Hours: 8-10
```

### INTEGRATION-002: Error Handling & Logging
```yaml
Title: Implement comprehensive error handling and logging
Labels: infra, p1, complexity:medium, claude-task

Description:
Add robust error handling and logging throughout the application.

Tasks:
- Set up Sentry for error tracking
- Add structured logging (Winston)
- Implement global error handlers
- Add user-friendly error messages
- Create error boundaries in React
- Log all API errors
- Log agent failures
- Set up alerts for critical errors
- Document error codes
- Add tests

Acceptance Criteria:
- ✅ All errors logged to Sentry
- ✅ User sees helpful error messages
- ✅ Critical errors trigger alerts
- ✅ Logs are searchable
- ✅ No sensitive data in logs

Dependencies: All issues
Estimated Hours: 4-5
```

### INTEGRATION-003: Performance Optimization
```yaml
Title: Optimize application performance
Labels: refactor, p2, complexity:medium, claude-task

Description:
Improve application performance across backend and mobile.

Tasks:
- Profile API endpoints
- Optimize slow database queries
- Add database indexes where needed
- Implement API response caching
- Optimize image sizes
- Lazy load mobile screens
- Reduce bundle size
- Implement pagination everywhere
- Add performance monitoring
- Document optimizations

Acceptance Criteria:
- ✅ API p95 response time < 500ms
- ✅ Mobile app launch time < 3s
- ✅ Estimate processing < 60s
- ✅ No memory leaks
- ✅ Performance metrics tracked

Dependencies: All issues
Estimated Hours: 5-6
```

### INTEGRATION-004: Security Audit & Hardening
```yaml
Title: Conduct security audit and implement hardening
Labels: infra, p1, complexity:medium, claude-task

Description:
Review and improve application security.

Tasks:
- Audit authentication/authorization
- Review API input validation
- Test for SQL injection
- Test for XSS vulnerabilities
- Implement rate limiting
- Add CORS configuration
- Review file upload security
- Audit sensitive data handling
- Add security headers
- Document security measures

Acceptance Criteria:
- ✅ No critical security vulnerabilities
- ✅ Rate limiting in place
- ✅ Input validation comprehensive
- ✅ File uploads secured
- ✅ Security best practices followed

Dependencies: All issues
Estimated Hours: 4-5
```

### INTEGRATION-005: Documentation & Onboarding
```yaml
Title: Create user documentation and onboarding
Labels: docs, p2, complexity:low, claude-task

Description:
Build user guides and onboarding materials.

Tasks:
- Write user guide (how to create estimates)
- Create video tutorials (optional)
- Build in-app onboarding flow
- Add tooltips for key features
- Create FAQ
- Document troubleshooting steps
- Write API documentation (if needed for Phase II)
- Create admin guide for settings

Acceptance Criteria:
- ✅ User guide is clear and comprehensive
- ✅ New users can complete first estimate
- ✅ In-app help is accessible
- ✅ FAQ covers common issues

Dependencies: All features complete
Estimated Hours: 6-8
```

---

## Summary

**Total Issues**: 39
**Highly Parallelizable**: 28 (all agent and most mobile issues)
**Estimated Total Hours**: 180-220 hours
**With Parallel Execution**: 6-8 weeks → 4-6 weeks

### Parallel Development Strategy

1. **Week 1**: Foundation (sequential) + Start agents (parallel)
2. **Week 2**: Backend APIs (parallel) + Continue agents + Start mobile setup
3. **Week 3**: Mobile screens (parallel) + Backend integration
4. **Week 4**: Mobile features (parallel) + Integration work
5. **Week 5**: Testing + Polish (some parallel)
6. **Week 6**: Final integration + Documentation

### Using parallel-dev-automation

After creating these issues in GitHub:

1. Label foundation issues (INFRA-*) with `claude-task`
2. Wait for those to complete
3. Label all agent issues (AGENT-*) with `claude-task` → 8 parallel Claude instances
4. Label backend issues (API-*) with `claude-task` → parallel development
5. Label mobile issues (MOBILE-*) with `claude-task` → parallel development
6. Monitor PRs, handle conflicts, merge when tests pass

---

**Last Updated**: January 25, 2025
**Ready for GitHub Issue Creation**
