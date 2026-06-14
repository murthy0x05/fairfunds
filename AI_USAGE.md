# AI_USAGE.md — Artificial Intelligence Collaboration Log

This document outlines the collaborative relationship between the software engineer and the AI coding assistant (Antigravity) in building the FairFunds Shared Expense Management Application.

---

## 1. Collaborative Roles & Scope

During the course of the project, the AI assistant was leveraged as:
1. **Product Architect & Data Engineer**: Collaborated on parsing the assignment specification, identifying 15 distinct anomaly patterns inside the messy `expenses_export.csv` file, and outlining structural design decisions.
2. **Database Architect**: Designed the PostgreSQL schema using Prisma ORM, introducing temporal memberships, index optimizations, and explicit enum boundaries.
3. **Backend Developer**: Scaffolded core service layers (caching exchange rates, calculating balances, simplifying debts, processing CSV uploads in transactions, and generating mathematical derivation proofs).
4. **Frontend Developer**: Developed styled Next.js 15 client components with Vanilla CSS and Tailwind v4, utilizing shadcn-like designs for the layout, import wizard, and balance explainability dialog.
5. **Quality & Debugging Assistant**: Resolved type mismatches, corrected Zod v4 and Prisma v7 breaking changes, fixed PostCSS tailwind compiler issues, and ensured full compilability under strict TypeScript flags.

---

## 2. Key Prompt Templates & Iterations

### 2.1 Anomaly Discovery Phase
*   **Prompt Intent**: Analyze the raw CSV file to expose formatting quirks, currency bugs, chronological issues, and identity anomalies without making initial code changes.
*   **Input**: Raw contents of `expenses_export.csv` + `assignment.pdf` description.
*   **AI Output**: A complete anomaly log classifying 18 instances of duplicates, format inconsistencies, temporal violations, missing payers, and percentage sum errors.

### 2.2 Schema & Transaction Planning
*   **Prompt Intent**: Draft a database structure capable of enforcing temporal memberships (Sam's late join, Meera's move-out, Dev's visits) and caching daily exchange rates.
*   **Engineering Iteration**: Ensured all monetary values are stored as integers representing the smallest unit of currency (paise/cents) to prevent floating-point calculation drift.

### 2.3 Explainability Engine Scaffold
*   **Prompt Intent**: Create a server-side proof engine that explains how any user balance is calculated down to individual splits, exchange rates, and transaction histories.
*   **AI Iteration**: Designed the 5-layer drill-down architecture: Summary Card → Chronological Waterfall Trail → Split Math Calculations → Exchange Rate Derivation Proof → Immutable Audit Logs.

---

## 3. Automated Debugging & Refactoring History

### 3.1 Upgrading to Next.js 15 / Next.js 16 + React 19
*   **Issue**: Compilation warnings about React 19 types, Next.js page data collection.
*   **Resolution**: Configured server actions to be fully asynchronous, typed dynamic page parameter promises, and ensured all components use standard Next.js 15/16 conventions.

### 3.2 Prisma v7 Transition
*   **Issue**: Prisma v7 introduced a TypeScript-based query compiler, making driver adapters (`@prisma/adapter-pg`) required and deprecating direct datasource URLs in the client constructor. Next.js static compilation failed when the client initialized with an empty database URL.
*   **Resolution**: 
    1. Installed `@prisma/adapter-pg` and `pg`.
    2. Updated `src/lib/db.ts` to instantiate `PrismaClient` using `PrismaPg` pool adapter.
    3. Configured a fallback mock connection string (`postgresql://postgres:postgres@localhost:5432/fairfunds?sslmode=disable`) during build time so page collection compiles without crashing.

### 3.3 Tailwind CSS v4 `@apply` Fix
*   **Issue**: Tailwind v4 threw a `Cannot apply unknown utility class glass-card` build error on `.glass-card-hover` using `@apply glass-card`.
*   **Resolution**: Restructured the styles in `src/app/globals.css` to define the base glassmorphism styles on a combined `.glass-card, .glass-card-hover` selector, applying the specific hover animations to `.glass-card-hover` separately.

---

## 4. Engineering Reflections

The collaborative loop with the AI resulted in:
*   **Speed**: Scaffolding complete business logic (e.g. debt-simplification, 14-anomaly parser) in seconds.
*   **Precision**: Catching subtle requirements such as Meera's explicit consent rule and Banker's rounding.
*   **Quality**: Resolving compilation and build issues immediately through targeted terminal runs, leading to a zero-error production build.
