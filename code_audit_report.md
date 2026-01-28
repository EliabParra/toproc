# Codebase Audit Report

**Date:** 2026-01-27
**Status:** Post-DI Migration

## 1. Executive Summary

The codebase has successfully transitioned to a Dependency Injection (DI) architecture. The core infrastructure (`src`), business logic (`BO`), and API layer (`Dispatcher`) are decoupled. However, significant "legacy glue" remains to support backward compatibility, and strict type safety is compromised in several definition files.

## 2. Architecture & Legacy Glue

The following issues were identified as high-priority architectural debt that can now be safely removed following the completion of Phase 4.

### 2.1. Global Variable Assignments (`src/foundation.ts`)

- **Location:** `src/foundation.ts` (Lines 87-90)
- **Issue:** Explicitly assigns `db`, `log`, `config`, and `validator` to `globalThis`.
- **Context:** Marked as "Required until Phase 2".
- **Recommendation:** **REMOVE IMMEDIATELY.** All identified consumers (`AuthBO`, `AuthService`, `AuthRepository`) now use DI.

### 2.2. Global Fallbacks in Base Business Object (`src/core/base/BaseBO.ts`)

- **Location:** `src/core/base/BaseBO.ts` (Lines 90-96)
- **Issue:** Constructor mocks dependency injection by falling back to `globalThis` if `deps` are missing.
- **Recommendation:** Remove the fallback logic. Make `deps` mandatory in the constructor or default to empty (throwing error on property access) to enforce DI discipline.

## 3. Type Safety (The `any` Problem)

Loose typing is prevalent in the auxiliary definition files, undermining TypeScript's benefits.

### 3.1. Definition Files

- **`src/types/vendor.d.ts`:**
    - `const express: any`
    - `const cors: any`
    - `const helmet: any`
    - `const session: any`
- **`src/types/globals.d.ts`:**
    - `const queries: any`
    - `const msgs: any`
    - `const v: any`
    - `const require: any`
- **`src/types/core.ts`:**
    - `IDatabase` interfaces often return `{ rows: any[] }`.
    - `IValidator` optional methods accept `opts: any`.

### 3.2. Session Manager

- `src/session/SessionManager.ts`: Uses `any` for `req` and `res` in `createSession` and other methods.

## 4. Code Principles & Modernization

### 4.1. CommonJS in TypeScript

- **`src/foundation.ts`**: Uses `createRequire(import.meta.url)` to load `queries.json`.
- **Recommendation:** While valid, modern Node.js supports JSON modules (`import queries from './config/queries.json' with { type: "json" }`) or `fs/promises`.

### 4.2. Placeholder Code

- **`BO/Auth/Auth.SocialAuth.ts`**: Contains placeholder classes throwing errors.
- **Recommendation:** Keep if imminent use is planned, otherwise move to a `docs/future` folder to keep `BO` clean.

## 5. Security & Best Practices

- **`Auth.Repository.ts`**: Now uses proper parameterized queries (GOOD).
- **`Security.ts`**: Permissions logic relies on `any` typed `getDataTx`.

## 6. Action Plan

1.  **Cleanup (High):** Remove global assignments in `foundation.ts`.
2.  **Cleanup (High):** Remove global fallback in `BaseBO.ts`.
3.  **Refactor (Medium):** install `@types/express`, `@types/cors`, etc., and delete `vendor.d.ts`.
4.  **Refactor (Medium):** Define strict types for `IQueries` and `IMsgs` instead of `any`.
