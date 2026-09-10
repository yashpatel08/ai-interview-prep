# AI Interview Prep Kit

An AI-powered interview preparation platform that turns a job description and company website into a structured, personalized interview preparation kit.

The application researches the company, extracts role requirements, generates interview questions and flashcards, verifies requirement coverage, and creates a deterministic study schedule.

> **Core principle:** LLM generates content; the application owns IDs, validation, coverage, scheduling, retries, edits, and failures.

---

## Features

### Interview Kit Generation

Provide:

* Job description
* Company website URL
* Number of days available before the interview

The pipeline then:

1. Validates the input
2. Researches the company website
3. Discovers relevant hiring/interview/engineering pages
4. Extracts role requirements
5. Generates a company brief
6. Generates categorized interview questions
7. Checks requirement coverage
8. Generates targeted questions for uncovered requirements
9. Generates flashcards
10. Builds a deterministic study schedule
11. Validates the complete kit
12. Stores the final kit

### Question Categories

Questions are organized into:

* Technical
* Behavioral
* System Design
* Company Fit

### Requirement Coverage

Every requirement is assigned a stable ID.

The application determines which `must` requirements are covered by generated questions.

If requirements remain uncovered, the pipeline performs targeted generation passes.

Coverage checking is deterministic application code rather than an LLM decision.

### Deterministic Scheduling

The LLM does not decide the study schedule.

The application owns:

* Number of study days
* Question allocation
* Question ordering
* Difficulty-based time allocation
* Requirement priority
* Integer study minutes
* Question references

This makes scheduling reproducible and testable.

### Flashcard Practice

Users can:

* Practice one flashcard at a time
* Reveal the answer
* Record confidence
* Mark cards as covered
* Review cards again
* Prioritize uncovered and low-confidence cards

### Content Editing

Generated content can be:

* Edited
* Added
* Deleted
* Reordered
* Pinned

Content states are represented as:

* `generated`
* `edited`
* `pinned`

Pinned content preserves its previous state when unpinned.

### Section Regeneration

Individual sections can be regenerated without destroying unrelated user edits.

For example:

* Regenerate company brief
* Regenerate all question categories
* Regenerate one question category
* Regenerate flashcards

Edited and pinned content is preserved where applicable.

### Authentication

Users can:

* Register
* Login
* Logout
* Maintain a persistent session

Kits are scoped to the authenticated user.

Users cannot access another user's kits.

---

# Architecture

The project uses a **modular monolith** architecture.

```text
ai-interview-prep/
│
├── apps/
│   │
│   ├── web/                         # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   │
│   └── api/                         # Node.js + Express backend
│       └── src/
│           ├── config/
│           ├── middleware/
│           ├── routes/
│           ├── services/
│           │   ├── retrieval/
│           │   ├── research/
│           │   ├── generation/
│           │   ├── scheduling/
│           │   └── pipeline/
│           ├── models/
│           ├── validators/
│           └── server.ts
│
├── packages/
│   └── core/                        # Shared domain logic
│       ├── types/
│       ├── coverage/
│       ├── scheduling/
│       └── validation/
│
├── scripts/
│   └── evaluate.ts                  # Batch evaluator
│
├── tests/
│
├── cases.json
├── package.json
├── tsconfig.json
└── README.md
```

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Lucide React

## Backend

* Node.js
* Express
* TypeScript
* MongoDB
* Mongoose
* Zod
* bcrypt
* Cookie-based sessions

## AI

The backend uses an OpenAI-compatible chat-completions interface.

The LLM is used for content generation and extraction.

Application code remains responsible for deterministic business logic.

## Research

* HTTP fetching
* Cheerio HTML parsing
* Robots handling
* Same-domain crawling
* Link ranking
* Public discussion search abstraction

---

# Installation

## Requirements

Install:

* Node.js 20+
* npm
* MongoDB
* An OpenAI-compatible LLM provider

Check:

```bash
node --version
npm --version
```

---

# Clone

```bash
git clone <repository-url>
cd ai-interview-prep
```

Install all workspace dependencies:

```bash
npm install
```

---

# Environment Variables

Create:

```text
apps/api/.env
```

Example:

```env
NODE_ENV=development
PORT=4000

MONGODB_URI=mongodb://127.0.0.1:27017/ai-interview-prep

FRONTEND_URL=http://localhost:3000

SESSION_SECRET=replace-with-a-random-secret-at-least-32-characters

LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your-api-key
LLM_MODEL=your-model
```

Never commit `.env` files.

A template can be maintained as:

```text
.env.example
```

---

# Running the Application

Start frontend and backend together:

```bash
npm run dev
```

Or start them independently.

## Frontend

```bash
npm run dev:web
```

The frontend runs on:

```text
http://localhost:3000
```

## Backend

```bash
npm run dev:api
```

The API runs on:

```text
http://localhost:4000
```

---

# Build

Build the frontend:

```bash
npm run build:web
```

Build the backend:

```bash
npm run build:api
```

Build everything:

```bash
npm run build
```

---

# Testing

Run the test suite:

```bash
npm test
```

Tests cover important deterministic application behavior including:

* Scheduling
* Requirement coverage
* Kit validation
* Question CRUD
* Flashcard CRUD
* Flashcard progress
* Pin/unpin behavior
* Regeneration preservation
* Relationship validation

The most important business rules are intentionally tested outside the LLM.

---

# Batch Evaluation

The application includes the required batch evaluation command.

Input format:

```json
[
  {
    "id": "case-01",
    "jd": "Senior Backend Engineer...",
    "company_url": "http://localhost:8099/acme/",
    "days": 5
  },
  {
    "id": "case-02",
    "jd": "Frontend Engineer...",
    "company_url": "http://localhost:8099/acme/",
    "days": 1
  }
]
```

Run:

```bash
npm run evaluate -- --input cases.json --output kits.json
```

The evaluator:

1. Reads all cases
2. Runs the same generation pipeline used by the application
3. Uses each case's requested number of days
4. Validates the resulting kit
5. Continues processing if one case fails
6. Writes results to the output JSON file

Output:

```json
[
  {
    "id": "case-01",
    "status": "ok",
    "kit": {},
    "error": null
  }
]
```

Failed cases are represented without stopping the remaining cases.

---

# Interview Kit Structure

A generated kit follows this structure:

```json
{
  "source": {
    "company": "",
    "company_url": "",
    "role": "",
    "location": "",
    "jd_chars": 0,
    "researched_at": "",
    "pages_used": []
  },
  "company_brief": {
    "summary": "",
    "what_they_do": "",
    "sources": []
  },
  "role": {
    "title": "",
    "seniority": "",
    "responsibilities": [],
    "requirements": []
  },
  "questions": [],
  "flashcards": [],
  "schedule": {
    "days_available": 5,
    "days": []
  },
  "coverage": {
    "uncovered_requirement_ids": [],
    "passes": 1
  }
}
```

---

# LLM vs Application Responsibilities

A major architectural goal is keeping deterministic responsibilities outside the LLM.

## LLM responsibilities

The LLM generates:

* Company summaries
* Role information
* Requirements
* Interview questions
* Answer outlines
* Flashcards
* Targeted questions for coverage gaps

## Application responsibilities

Application code owns:

* Stable IDs
* Input validation
* Generated-output validation
* Requirement/question relationships
* Coverage checking
* Coverage repair loop
* Schedule allocation
* Question ordering
* Study minutes
* User ownership
* Authentication
* CRUD operations
* Pinning
* Editing
* Regeneration merging
* Retry behavior
* Failure handling

This prevents the LLM from becoming the source of truth for critical application behavior.

---

# Research Pipeline

Company research does not assume a fixed hiring URL.

Instead, the crawler:

```text
Company URL
    ↓
Fetch page
    ↓
Extract links
    ↓
Rank links
    ↓
Prioritize relevant pages
    ↓
Fetch additional pages
    ↓
Build research context
```

Relevant links can include:

* Careers
* Jobs
* Hiring
* Interview
* Engineering
* About
* Company information

The crawler uses:

* Same-domain restrictions
* Maximum page limits
* Request timeouts
* Response-size limits
* URL validation
* Private-network protection in production

---

# Security

External URLs are treated as untrusted input.

The application validates URLs before fetching them.

Production requests reject unsafe destinations such as:

* Loopback addresses
* Private IP addresses
* Internal network destinations
* URLs containing credentials

External content is also treated as **untrusted data**.

Website text and search snippets are never treated as system instructions for the LLM.

Additional protections include:

* Request size limits
* Fetch timeouts
* Response-size limits
* Content-type validation
* Authentication
* User-owned resource checks
* Generated-kit validation
* Environment-based secrets

---

# Authentication

Authentication uses secure server-side sessions.

Session tokens are:

1. Generated using cryptographically secure randomness
2. Stored in an HTTP-only cookie
3. Hashed before persistence
4. Associated with a user
5. Given an expiration time

In production, cookies use secure settings.

---

# Data Model

Main MongoDB collections:

```text
User
Session
Kit
FlashcardProgress
```

A kit contains the generated interview-preparation data.

Kits are associated with a specific user.

A compound uniqueness constraint helps prevent duplicate kit generation for the same user and source.

---

# API Overview

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Kits

```text
GET    /api/kits
POST   /api/kits
GET    /api/kits/:kitId
PATCH  /api/kits/:kitId
DELETE /api/kits/:kitId
POST   /api/kits/:kitId/regenerate
```

## Questions

```text
POST   /api/kits/:kitId/questions
PATCH  /api/kits/:kitId/questions/:questionId
DELETE /api/kits/:kitId/questions/:questionId
PATCH  /api/kits/:kitId/questions/reorder
PATCH  /api/kits/:kitId/questions/:questionId/pin
```

## Flashcards

```text
POST   /api/kits/:kitId/flashcards
PATCH  /api/kits/:kitId/flashcards/:flashcardId
DELETE /api/kits/:kitId/flashcards/:flashcardId

GET    /api/kits/:kitId/flashcards/progress

POST   /api/kits/:kitId/flashcards/:flashcardId/review
POST   /api/kits/:kitId/flashcards/:flashcardId/reset-progress

PATCH  /api/kits/:kitId/flashcards/:flashcardId/pin
```

## Health

```text
GET /api/health
```

---

# Generation Pipeline

The generation process is intentionally multi-step.

```text
Input
  │
  ├── Validate JD + company URL
  │
  ▼
Company Research
  │
  ▼
Research Context
  │
  ├── Company Brief
  │
  └── Public Discussion
  │
  ▼
Requirement Extraction
  │
  ▼
Role Extraction
  │
  ▼
Question Generation
  │
  ▼
Coverage Check
  │
  ├── Covered → Continue
  │
  └── Uncovered
        │
        ▼
    Targeted Questions
        │
        ▼
    Coverage Check
        │
        ▼
Flashcards
  │
  ▼
Deterministic Schedule
  │
  ▼
Final Validation
  │
  ▼
Ready
```

Coverage repair has a sensible maximum number of passes to prevent an endless generation loop.

---

# Failure Handling

The application is designed to handle:

* Invalid company URLs
* 404 pages
* Company websites with no hiring page
* Website timeouts
* Small job descriptions
* No public interview discussions
* Invalid LLM JSON
* LLM rate limiting
* Temporary LLM failures
* Duplicate generation attempts
* Invalid generated references
* 1-day study plans
* Long study plans up to 60 days

A failed generation is represented explicitly rather than silently producing an invalid kit.

---

# Scheduling

The scheduler is deterministic.

Each question receives a score based on factors such as:

* Requirement priority
* Difficulty
* Number of linked requirements

Question study time is derived from difficulty.

Example:

```text
Difficulty 1 → 10 minutes
Difficulty 2 → 15 minutes
Difficulty 3 → 20 minutes
```

The schedule always contains exactly the requested number of days.

Question IDs stored in the schedule must exist in the kit.

Questions are allocated by application code rather than generated by the LLM.

---

# Coverage

A requirement is considered covered when at least one question references its requirement ID.

Only `must` requirements are required for final coverage.

Example:

```json
{
  "id": "r1",
  "text": "5+ years with React",
  "kind": "experience",
  "priority": "must"
}
```

A question can cover it using:

```json
{
  "id": "q1",
  "requirement_ids": ["r1"]
}
```

The deterministic coverage checker then reports:

```json
{
  "uncovered_requirement_ids": []
}
```

---

# Content States

Generated content supports three states:

```text
generated
edited
pinned
```

When content is edited:

```text
generated → edited
```

When pinned:

```text
generated → pinned
edited    → pinned
```

The previous state is preserved so that unpinning can restore it:

```text
pinned → generated
```

or:

```text
pinned → edited
```

---

# Regeneration

Regeneration is performed at section level.

For question regeneration, edited and pinned questions are preserved.

For example:

```text
Original:

Technical
  q1 generated
  q2 edited
  q3 pinned

Behavioral
  q4 generated
```

If technical questions are regenerated:

```text
Technical
  q2 edited       ← preserved
  q3 pinned       ← preserved
  new generated questions

Behavioral
  q4 generated    ← untouched
```

The regenerated kit is then rechecked for:

* Requirement coverage
* Valid relationships
* Schedule consistency
* Final schema validity

---

# Frontend

The frontend is built with reusable components.

Main areas include:

```text
Dashboard
    │
    ├── New Kit
    │
    └── Existing Kits
            │
            └── Kit
                 ├── Company Brief
                 ├── Role
                 ├── Requirements
                 ├── Questions
                 ├── Flashcards
                 ├── Practice
                 ├── Schedule
                 └── Coverage
```

The UI supports:

* Loading states
* Empty states
* Error states
* Responsive layouts
* Keyboard-friendly controls
* Editing
* Pinning
* Regeneration

---

# Vercel Deployment

The Next.js frontend can be deployed directly to Vercel.

A `vercel.json` file is **not required** for the standard Next.js deployment.

Set the Vercel project root directory to:

```text
apps/web
```

Vercel should automatically detect Next.js.

Configure:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

The Express API should be deployed separately to a Node-compatible hosting provider.

Example architecture:

```text
                 ┌─────────────────┐
                 │     Vercel      │
                 │  Next.js Web    │
                 └────────┬────────┘
                          │
                          │ HTTPS
                          ▼
                 ┌─────────────────┐
                 │  Node / Express │
                 │      API        │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │     MongoDB     │
                 └─────────────────┘
```

Backend environment:

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=...
FRONTEND_URL=https://your-frontend.vercel.app
SESSION_SECRET=...
LLM_BASE_URL=...
LLM_API_KEY=...
LLM_MODEL=...
```

---

# Production Checklist

Before deployment:

* [ ] Configure production MongoDB
* [ ] Generate a strong `SESSION_SECRET`
* [ ] Configure LLM credentials
* [ ] Configure `FRONTEND_URL`
* [ ] Configure `NEXT_PUBLIC_API_URL`
* [ ] Enable HTTPS
* [ ] Verify secure cookies
* [ ] Verify CORS
* [ ] Verify SSRF protection
* [ ] Verify request-size limits
* [ ] Verify external fetch timeouts
* [ ] Run tests
* [ ] Run production builds
* [ ] Run batch evaluator
* [ ] Test registration/login
* [ ] Test kit generation
* [ ] Test regeneration
* [ ] Test question editing
* [ ] Test flashcard practice
* [ ] Test another user's kit cannot be accessed

---

# Development Commands

```bash
# Install dependencies
npm install

# Start everything
npm run dev

# Start frontend
npm run dev:web

# Start backend
npm run dev:api

# Test
npm test

# Build frontend
npm run build:web

# Build backend
npm run build:api

# Build everything
npm run build

# Batch evaluation
npm run evaluate -- --input cases.json --output kits.json
```

---

# Design Decisions

## Why a modular monolith?

The project has multiple logical responsibilities but does not need the operational complexity of microservices.

Separating the services internally provides clear boundaries while keeping deployment simple.

## Why deterministic scheduling?

Study scheduling is a business rule, not creative content.

Keeping it in application code makes the result:

* Predictable
* Testable
* Reproducible
* Easier to validate

## Why deterministic coverage?

The application must guarantee that mandatory requirements are represented.

An LLM should not be trusted to decide whether coverage is complete.

## Why stable IDs?

Stable IDs allow:

* Editing
* Reordering
* Pinning
* Requirement relationships
* Schedule references
* Regeneration preservation
* Flashcard progress

without depending on generated text.

## Why validate LLM output?

LLM output is untrusted external data.

Every generated section is parsed and validated before becoming part of the final kit.

---

# Future Improvements

Potential improvements include:

* Streaming generation progress
* More public interview-data providers
* Better interview-stage detection
* Weak Spots Report
* Calendar integration
* Spaced-repetition scheduling
* Resume-aware question generation
* More advanced company research
* Background job queue for high-volume deployments
* Rate limiting per user
* Observability and structured logging

---
 