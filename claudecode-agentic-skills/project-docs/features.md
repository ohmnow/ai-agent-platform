# EstimateFlow - Feature Specifications

## Core Features Overview

### 1. Flexible Data Capture Workflows

**Problem**: Estimators need flexibility in how they capture job site information - sometimes voice is easier (while talking to client), sometimes photos first (client not present).

**Solution**: Support three workflows:

#### Workflow A: Voice-First
```
1. Talk with customer on-site
2. Record voice notes describing all issues
3. Take photos afterward
4. Link photos to voice recordings
5. Submit for AI processing
```

**Use Case**: Estimator walking through with customer, discussing issues in real-time.

#### Workflow B: Photo-First
```
1. Take photos of all issues
2. Later (in car/office), review each photo
3. Record voice note for each photo
4. Submit for AI processing
```

**Use Case**: Quick site visit without customer present, narrate details later while fresh.

#### Workflow C: Combined/Paired
```
1. Take photo of issue
2. Immediately record voice note for that photo
3. Move to next issue, repeat
4. Submit for AI processing
```

**Use Case**: Methodical approach, ensuring each photo has context.

**Technical Implementation**:
- Mobile app tracks capture mode (voice-first, photo-first, paired)
- Backend accepts photos + voice notes in any combination
- Agent orchestrator handles missing data gracefully
- UI adapts based on selected workflow

---

### 2. AI-Powered Estimate Generation

**8 Specialized Agents Working in Concert:**

```
PHASE 1 (Parallel):
├─> Photo Analyzer Agent (10s)
│   Analyzes each photo for damage type, materials, scope
└─> Voice Transcriber Agent (15s)
    Transcribes voice → structured work scope data

PHASE 2 (Sequential):
└─> Work Item Classifier Agent (5s)
    Categorizes into standard line items

PHASE 3 (Parallel):
├─> Hours Estimator Agent (8s)
│   Calculates labor hours with buffer
└─> Materials Pricer Agent (5s)
    Estimates material costs + markup

PHASE 4 (Parallel):
├─> Estimate Formatter Agent (15s)
│   Generates professional document
└─> Quality Checker Agent (5s)
    Reviews for completeness

ON-DEMAND:
└─> Text Rewriter Agent (3s)
    Improves grammar/clarity with rollback
```

**Total Processing Time**: 30-60 seconds
**User Experience**: Real-time progress updates, see each phase completing

---

### 3. Comprehensive Editing Capabilities

**Philosophy**: AI generates the draft, human refines it to perfection.

**Editable Fields**:
- ✅ Line item descriptions
- ✅ Hours estimates
- ✅ Material quantities
- ✅ Pricing (labor rate, material costs, markup)
- ✅ Add/remove line items
- ✅ Reorder line items (drag & drop)
- ✅ Customer information
- ✅ Estimate title and notes

**Edit Features**:

#### Real-Time Recalculation
```
Edit hours: 5 → 6
  ↓
Labor total: $375 → $450 (auto-update)
  ↓
Grand total: $1,426 → $1,501 (auto-update)
```

#### AI Text Rewrite with Rollback
```
Original: "Fix the cracked tile in bathroom"
  ↓ [Tap "Improve Text"]
Rewritten: "Remove and replace damaged ceramic tile in master bathroom, including substrate repair as needed"
  ↓ [Accept or Rollback]
If rollback: Returns to "Fix the cracked tile in bathroom"
```

#### Edit History Tracking
- All changes saved to `edit_history` table
- Can rollback multiple steps
- See who edited what and when
- Distinguish manual edits from AI rewrites

---

### 4. Materials Display Flexibility

**Two Display Modes:**

#### Detailed View (Itemized)
```
BATHROOM TILE REPAIR
  Labor (6.5 hours @ $75/hr)        $488.00
  Materials:
    - Ceramic tile (6 sq ft @ $7.50) $45.00
    - Thinset                         $35.00
    - Grout                           $18.00
    - Sealant                         $12.00
  Materials markup (40%)               $44.00
                           Subtotal: $642.00
```

**Benefits**:
- Transparency for customer
- Easy to adjust specific materials
- Shows exactly what's included

#### Rolled-Up View (Simplified)
```
BATHROOM TILE REPAIR
  Labor (6.5 hours @ $75/hr)        $488.00
  Materials (including 40% markup)   $154.00
                           Subtotal: $642.00
```

**Benefits**:
- Cleaner presentation
- Faster to read
- Customer focuses on total, not line items

**Toggle**: User can switch between modes in review screen, affects PDF output.

**Technical**: Stored in `estimates.materials_display` field, template renders accordingly.

---

### 5. Professional Branding System

**Company Branding Assets**:
```
branding/
└── [company-id]/
    ├── logo.png (primary logo)
    ├── logo-white.png (for dark backgrounds)
    ├── brand-colors.json (color scheme)
    ├── estimate-template.html (custom template)
    └── email-template.html (email design)
```

**Configurable Elements**:
- Company logo (uploaded via settings)
- Primary color (used for headers, accents)
- Secondary color (used for highlights)
- Company contact info
- Estimate terms & conditions
- Payment methods accepted
- Warranty information
- Validity period (default 30 days)

**Template Variables**:
All templates use `{{variable}}` syntax, replaced at PDF generation:
- `{{company_name}}`
- `{{logo_url}}`
- `{{primary}}` (color)
- `{{customer_name}}`
- `{{estimate_number}}`
- `{{work_items}}` (array)
- `{{grand_total}}`
- etc.

**Admin Interface**:
- Upload logo
- Set brand colors (color picker)
- Edit terms/payment methods
- Preview estimate template
- Test email template

---

### 6. Quality Assurance System

**Quality Checker Agent Output**:

```json
{
  "qualityScore": 92,
  "issues": [
    {
      "severity": "warning",
      "field": "photo_3",
      "message": "Photo 3 has no voice note description"
    },
    {
      "severity": "info",
      "field": "materials",
      "message": "Consider adding tile brand/color for matching"
    }
  ],
  "suggestions": [
    "Add estimated project timeline to scope",
    "Include before/after care instructions"
  ],
  "readyToSend": true
}
```

**Quality Score Factors** (0-100):
- All photos have descriptions: +20
- Customer contact complete: +20
- All line items have pricing: +20
- Calculations are correct: +20
- Professional tone throughout: +10
- No spelling/grammar errors: +10

**Warning vs Error**:
- **Error** (score < 70): Blocks sending, must fix
- **Warning** (score 70-89): Can send, but issues flagged
- **Good** (score 90+): Ready to send

**User Experience**:
```
Quality Score: 92% ✓

⚠️ 1 Warning:
- Photo 3 needs description

💡 Suggestions:
- Add estimated timeline
- Include care instructions

[Fix Issues] [Send Anyway]
```

---

### 7. Photo Organization & Management

**Photo Metadata**:
```json
{
  "id": "uuid",
  "url": "https://cdn.com/photo1.jpg",
  "estimateId": "uuid",
  "lineItemId": "uuid",
  "sortOrder": 1,
  "caption": "Cracked tile in master bathroom",
  "takenAt": "2025-01-25T10:30:00Z",
  "fileSize": 2458623,
  "aiAnalysis": {
    "issueType": "tile_damage_with_water_damage",
    "materials": ["ceramic_tile", "substrate"],
    "severity": "medium",
    "estimatedScope": "6-8 sq ft",
    "needsMorePhotos": false
  }
}
```

**Photo Features**:
- Automatic compression (75% quality JPEG)
- Link to specific line items
- Reorder by drag & drop
- Delete unwanted photos
- Add/edit captions
- Multiple photos per line item
- Group photos by work area

**In Estimate PDF**:
- Photos appear with their line items
- Captions displayed below each photo
- Grid layout (2-3 photos per row)
- High quality but optimized size

---

### 8. Email Delivery System

**Email Template Structure**:
```
Subject: Your Estimate from {{company_name}}

Hi {{customer_name}},

Thank you for the opportunity to assess your project at
{{property_address}}.

I've prepared a detailed estimate for the work we discussed.
Please review the attached PDF estimate.

[Attached: EST-2025-001.pdf]

This estimate includes:
• Complete scope of work
• Detailed pricing
• Photos of all items
• Our terms and next steps

This estimate is valid for 30 days from {{estimate_date}}.

To proceed, simply reply to this email or give me a call at
{{company_phone}}.

Best regards,
{{estimator_name}}
{{company_name}}
```

**Email Features**:
- PDF automatically attached
- Template customizable in settings
- Variables auto-populated
- Professional formatting (HTML + plain text)
- Delivery tracking (via SendGrid webhooks)
- Open tracking (knows when customer viewed)
- Reply-to set to estimator's email

**Email Log**:
Tracks:
- Sent timestamp
- Delivered timestamp
- Opened timestamp (first open)
- Bounced (if email invalid)
- Status (queued → sent → delivered → opened)

---

### 9. Offline Support

**Problem**: Job sites often have poor cell signal.

**Solution**: Offline-first architecture

**Capabilities**:
- ✅ Take photos without internet
- ✅ Record voice notes offline
- ✅ Enter customer info offline
- ✅ Store everything locally (encrypted)
- ✅ Auto-sync when connection restored
- ✅ Visual indicator when offline
- ✅ Queued uploads show progress

**Technical Implementation**:
- Photos: Stored in device filesystem
- Voice: Stored in device filesystem
- Data: AsyncStorage (React Native)
- Sync: Queue uploads to BullMQ when online
- Conflicts: Last-write-wins (simple for MVP)

**User Experience**:
```
[Offline Mode Indicator: "📡 Offline"]

Photos: 12 (Waiting to upload)
Voice: 12 (Waiting to upload)

[Will sync when online]
```

When connection restored:
```
[Syncing: 12 photos, 12 voice notes...]

[✓ All data synced]
```

---

### 10. Real-Time Progress Tracking

**Problem**: AI processing takes 30-60 seconds, user needs feedback.

**Solution**: Real-time progress updates via polling

**Progress Screen**:
```
Creating Your Estimate...

✓ Photos analyzed (12 photos)
✓ Voice notes transcribed (12 recordings)
✓ Work items identified (5 line items)
⚡ Calculating hours...
  • Formatting estimate
  • Running quality check

Estimated time: 25 seconds
```

**Backend Implementation**:
```
POST /api/estimates/process
  ↓ Enqueue job
  ↓ Return jobId

Mobile polls:
GET /api/estimates/:id/status (every 2 seconds)

Returns:
{
  "status": "processing",
  "progress": 65,
  "currentPhase": "hours_estimation",
  "phases": {
    "photo_analysis": "completed",
    "voice_transcription": "completed",
    "classification": "completed",
    "hours_estimation": "in_progress",
    ...
  }
}
```

**Auto-navigation**: When status = "completed", navigate to review screen

---

## Feature Roadmap

### MVP (Week 1-6)
- ✅ All core features above
- ✅ Single user/company
- ✅ Email delivery only
- ✅ Manual pricing configuration

### Phase II (Week 7-12)
- Multi-user support
- Jobber API integration
- Dynamic materials pricing (Home Depot API)
- Customer acceptance portal (unique URLs)
- Before/after photo galleries
- SMS delivery option
- Estimate analytics dashboard

### Phase III (Month 4-6)
- Multi-language support
- Materials auto-ordering
- Calendar integration
- Advanced CRM features
- Team collaboration
- Mobile app for customers

---

**Last Updated**: January 25, 2025
**Status**: MVP Specification
