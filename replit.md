# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
│   └── nutriscan/          # NutriScan AI — Expo mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## NutriScan AI (artifacts/nutriscan)

An India-first packaged food scanner mobile app built with Expo + React Native.

### Features
- **Barcode Scanner** — Scans and resolves Indian packaged food products
- **OCR Fallback** — Reads nutrition labels from photos
- **Health Scoring** — Transparent 0-10 score with breakdown
- **Personalized Warnings** — Based on health profile (conditions, allergens, diet)
- **Ingredient Explorer** — Detailed breakdown of every ingredient
- **Nutrition Deep Dive** — Full macro/micro nutrient view per 100g
- **Product Comparison** — Compare 2-3 products side by side
- **History** — Full scan history with filter by score/category/warnings
- **Pantry & Favorites** — Save frequent products
- **Discover** — Browse by category, collection, diet type
- **Health Profile** — Set diet type, conditions, allergens, preferences

### Screens
- `app/onboarding.tsx` — 3-slide onboarding flow
- `app/(tabs)/index.tsx` — Home dashboard
- `app/scanner.tsx` — Scanner (barcode/search/reference modes)
- `app/result.tsx` — Scan result with score, warnings, ingredients
- `app/(tabs)/history.tsx` — Scan history with filters
- `app/(tabs)/pantry.tsx` — Saved products + favorites
- `app/(tabs)/discover.tsx` — Explore products by category
- `app/(tabs)/profile.tsx` — Health profile settings
- `app/compare.tsx` — Side-by-side product comparison

### Key Files
- `types/index.ts` — All TypeScript types
- `context/AppContext.tsx` — Global app state
- `utils/scoring.ts` — Health score calculation engine
- `utils/storage.ts` — AsyncStorage persistence
- `utils/productSearch.ts` — Product lookup functions
- `data/sampleProducts.ts` — Indian product database (Maggi, Lay's, Parle-G, Amul, Red Bull)
- `components/ScoreRing.tsx` — Score display component
- `components/ConfidenceBadge.tsx` — Data confidence indicator
- `components/NutritionBar.tsx` — Nutrition bar chart
- `components/WarningCard.tsx` — Personalized warning card

### Scoring Engine
Category-aware weighted scoring system considering:
- Sugar, sodium, fat, saturated fat, trans fat
- Fiber, protein quality
- Additive count and risk levels
- Ingredient quality
- Ultra-processed penalty
- Personalization adjustment based on health conditions

### Data Sources
- In-app sample product database (Indian brands)
- Local AsyncStorage cache for repeat scans
- Supports offline viewing of cached products

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/`, uses Zod validation and Drizzle ORM.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks and fetch client.

### `scripts` (`@workspace/scripts`)
Utility scripts. Run: `pnpm --filter @workspace/scripts run <script>`
