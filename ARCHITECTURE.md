# Frontend architecture and file organization

Status: adopted repository policy, 2026-10-20. Applies to frontend planning,
implementation, bug fixes, refactoring, and code review by humans and agents.

## Scope and existing project

Use feature-first organization for business code, keep routing separate from
implementation, and share code according to ownership and dependencies.
Consistency matters more than giving every feature identical folders.

The frontend currently uses the Next.js App Router in `src/app/`, TypeScript,
React, Tailwind, shadcn/Radix primitives, next-intl, Storybook, and Vitest.
`@/*` resolves to `src/*`. Inspect `package.json`, `tsconfig.json`, and the
installed Next.js guides before implementation; this policy does not pin
dependency versions or introduce a different router.

Current locale infrastructure lives in `src/i18n/` and `src/proxy.ts`, with
messages in `messages/en.json` and `messages/ar.json`. Preserve that ownership
and the existing unprefixed locale routing. Folder examples are not instructions
to introduce `[lang]`, another dictionary loader, or a second API client.

This document supersedes the previous global-only placement rule in
`frontend/AGENTS.md` and older frontend folder examples in BMAD artifacts.
It does not change product requirements, API contracts, or locale behavior.
The UI triple rule, style ownership rule, and icon approvals in
[AGENTS.md](AGENTS.md) still apply.

## Inspect before changing files

1. Read root and frontend `AGENTS.md` plus this document.
2. Inspect the router, folder structure, aliases, naming, and dependency boundaries.
3. Inspect a comparable feature or, until features exist, comparable legacy code.
4. Identify the owning domain and each affected file's responsibility.
5. Reuse existing UI, hooks, services, types, and infrastructure. Choose the
   smallest change consistent with the architecture.

Do not introduce a competing architecture or restructure unrelated code.

## Target structure

Paths below are relative to `frontend/`. This is a placement guide, not a
scaffolding checklist. Create only directories and files needed by real work.

```text
src/
  app/                         # Pages, layouts, metadata, route boundaries
    layout.tsx
    page.tsx
    globals.css                # Global styles and design tokens
  features/
    landing/                   # Clinic landing content and behavior
      components/              # HeroSection and other landing sections
      constants/               # Hero artwork/action configuration, if needed
      utils/                   # Landing-only helpers, if needed
    <feature>/                 # e.g. a future consultation or discount-club flow
      components/
      hooks/                   # Hooks shared within this feature
      services/                # Domain API operations and business services
      schemas/                 # Validation and parsing
      types/                   # Feature-owned types
      constants/               # Feature-owned configuration/data
      utils/                   # Feature-only pure helpers
      styles/                  # Feature-owned styles, when needed
  components/
    ui/                        # Domain-independent primitives + stories/tests
    layout/                    # Application-wide header, navigation, shell
  hooks/                       # Domain-independent cross-feature hooks
  constants/                   # Genuinely shared constants / primitive variants
  types/                       # Genuinely shared types / primitive props
  styles/                      # Genuinely shared styles
  utils/                       # Domain-independent cross-feature helpers
  lib/                         # Configured clients and infrastructure
  i18n/                        # Existing locale infrastructure
  test/                        # Shared test setup/helpers and structural checks
  proxy.ts                     # Framework request/locale boundary
messages/                      # Existing translation catalogs
public/                        # Images and approved static assets
```

## Routes and server/client boundaries

- Keep `page.tsx` and other route files focused on composition and framework
  responsibilities. Import feature components rather than building an entire
  feature inside a route.
- Use framework conventions for layouts, loading states, error boundaries,
  metadata, and route handlers. Keep genuinely route-local code close to its
  route when a feature abstraction would add no value.
- Use Server Components by default. Add `"use client"` only for interaction,
  state, effects, or browser APIs that require it; keep the boundary narrow.
- Keep server-only credentials and integrations out of client imports. Feature
  services use shared infrastructure for the existing Go API contract; Next.js
  code must not access the database directly.

## Placement by ownership

| Responsibility | Location | Placement test |
| --- | --- | --- |
| Business UI and behavior | `src/features/<feature>/` | Belongs to a specific domain or user capability |
| Generic primitives | `src/components/ui/` | Works without knowing any clinic feature |
| Application shell and navigation | `src/components/layout/` | Applies across the application |
| Feature services, schemas, types, data, helpers, styles | Corresponding folder in the feature | Changes with its owning domain |
| Shared infrastructure | `src/lib/` | Configures a technical client or integration |
| Shared hooks/types/constants/styles/utilities | Corresponding global category | Domain-independent and useful across independent features or shared UI |
| Translation copy and locale configuration | Existing `messages/` and `src/i18n/` | Uses existing next-intl infrastructure |

Reuse by two components does not automatically make code global. Business
logic stays with its domain even when multiple consumers use it. Do not create
`shared/`, `common.ts`, or `helpers.ts` as an ownership escape hatch.

For this repository:

- `HeroSection`, hero artwork/action constants, hero styles, and the hero font
  helper belong to `features/landing/` when migrated together.
- `SiteHeader`, `PrimaryNav`, `MobileNav`, and `LocalePill` belong to
  `components/layout/` when treated as the application-wide header. Header
  types and hooks may live beside a complex header grouping, or in global
  categories if they support the shared layout. Landing-only navigation data
  should be passed into the shared header rather than imported from a feature.
- `button.constants.ts` and `button.types.ts` may remain in global categories:
  they support a generic primitive. Shared Button must never import hero or
  landing configuration. A reusable variant may serve a landing consumer;
  feature data and business rules still stay out of the primitive.
- `lib/utils.ts` already owns `cn()`. Reuse it; do not create a competing helper.

## Components and hooks

Keep small and moderately sized components flat:

```text
features/landing/components/
  HeroSection.tsx
  HeroSection.test.tsx
  HeroSection.stories.tsx
  TrustBar.tsx
```

Create a component folder only when supporting subcomponents, private hooks,
types, helpers, styles, or tests make it easier to maintain:

```text
features/consultation/components/ConsultationForm/
  ConsultationForm.tsx
  ContactFields.tsx
  useConsultationForm.ts
  consultation-form.types.ts
  ConsultationForm.test.tsx
```

Do not automatically create `index.tsx`, a folder per component, or a `hooks/`
folder for a single small hook. Small local values and types can stay inline;
extract them when reuse or clarity warrants it. Component-private supporting
files may be colocated; files shared across a feature belong in that feature's
category folders.

A hook shared by several components in one feature belongs in the feature's
`hooks/`. A hook private to one complex component may live beside it. A hook
belongs in global `src/hooks/` only if genuinely domain-independent. Avoid
duplicating hooks and creating circular imports.

## Data-access architecture and server state

All data fetching and mutations in the frontend adhere to a strict layered architecture:

- **Client component interaction:** `app/component -> feature hook -> feature service -> shared API transport (@/lib/api)`.
- **Server framework reads:** `app/Server Component -> feature service -> shared API transport (@/lib/api)`.

### 1. Transport boundary exclusivity (`src/lib/api.ts`)
`frontend/src/lib/api.ts` is the sole general HTTP transport. It centralizes base URL resolution (browser-relative same-origin vs. server-side `API_BASE_URL`), header merging, JSON serialization/parsing, typed error translation (`ApiError`), timeout management, and `AbortSignal` composition. Direct `fetch` calls are forbidden outside `src/lib/api.ts` (with narrow, documented framework exceptions). No second API client or alternative transport library (Axios, SWR) is permitted.

### 2. Feature-owned services and hooks
- **Feature services (`src/features/<feature>/services/<feature>.service.ts`):** Own endpoint paths, request/response contracts, payload normalization, and domain error mapping. Services call `apiRequest`; they never maintain React component state.
- **Feature query hooks (`src/features/<feature>/hooks/use<Name>.ts`):** Own React Query options, caching policies, query key factories, invalidation, and UI return contracts. Exported hook names start with `use`.
- **Client presentation components (`"use client"`):** Must consume feature query/mutation hooks. Client components must never import data-fetching functions directly from `*.service.ts`.

### 3. Browser server state vs. local UI state
TanStack Query manages browser-side server state (caching, deduplication, loading/fetching flags, errors, refetching, and pagination results).
- Do not mirror query state or create manual fetch effects with `useState` and `useEffect`.
- Local state (`useState`/`useReducer`) is strictly reserved for ephemeral, non-server UI state:
  - Controlled form inputs and validation feedback
  - Active tab, selection index, modal/lightbox/dialog disclosure
  - Local pagination display and viewport/scroll-derived state
  - Focus management and screen-reader announcements

### 4. Query-key ownership and key factories
Every query hook must use a stable, serializable query key factory defined in the feature (e.g. `galleryKeys`, `blogKeys`, `contactKeys`, `proceduresKeys`).
- Query keys must start with the feature namespace as an array (e.g. `['gallery']`, `['blogs']`).
- Query keys must incorporate every request parameter that modifies the result (`locale`, `page`, `page_size`, filters, tags, identifiers).
- Never scatter raw string literals across components or hooks.

### 5. Server rendering, SEO, and initial data
Preserve server-rendered routes (`/blog`, `/blog/[slug]`, `/gallery`, `/sitemap.xml`, `/robots.txt`) for SEO and no-JS fallback.
- Server Components, metadata generators, and route handlers call typed feature services directly; React hooks are never invoked in Server Components.
- When hydrating interactive client components from server data (e.g. `useBlogHome`, `useGalleryCases`, `useLandingGallery`), pass `initialData` alongside an explicit freshness policy (`staleTime: 60_000` or higher) so initial data hydrates cleanly without an immediate redundant mount refetch.

### 6. Testing and structural enforcement
- Feature hooks are tested using an isolated test `QueryClient` with retries disabled (`retry: false`).
- Presentation components are tested by mocking feature hooks or providing a test `QueryClientProvider` via `ThemedRender`.
- Automated structural tests in `src/test/data-access-architecture.test.ts` verify transport exclusivity, client-hook usage, and query key invariants across all production source files.

## Imports and dependency boundaries

Dependency direction is `app → features → shared UI/infrastructure`. Routes
can also compose shared layout/UI directly. Shared modules must not import
feature-specific components, hooks, services, types, constants, or business logic.
Feature code must not import route implementations from `app/`.

Minimize imports between independent features. Prefer route composition or
explicit props; extract a common business capability into an owning domain
module only when a real need exists. Keep generic UI free of business logic.
Avoid circular imports and layers that merely forward calls.

Use existing `@/` imports across module boundaries. Relative imports within a
component grouping are acceptable. Prefer direct imports; add `index.ts` only
when it creates a useful, intentional public API. Do not add automatic barrel
exports that hide dependencies or mix client and server modules.

## Naming, styles, and tests

Follow nearby repository conventions first:

- Components: existing UI primitive names stay lowercase/kebab-case; site and
  feature components use `PascalCase.tsx`.
- Hooks: exported hooks use `useSomething`; existing extracted hook modules use
  `<owner>.hooks.ts`. A colocated private hook may use `useSomething.ts`.
- Extracted services, schemas, types, constants, and helpers:
  `<owner>.service.ts`, `<owner>.schema.ts`, `<owner>.types.ts`,
  `<owner>.constants.ts`, and `<owner>.utils.ts`.
- Tests and stories: preserve sibling `*.test.ts(x)` and `*.stories.tsx`.
- Next.js special files keep framework-required names.

Use descriptive ownership names. Preserve semantic tokens in `app/globals.css`,
the existing style approval rules, and translation catalogs for user-facing copy.
Prefer Tailwind utilities in component `className` values; keep feature CSS only
for rules that are unclear or impractical as utilities. Feature styles belong to
their feature; only global styles belong in global style locations. Do not invent
a stylesheet per component by default.

Generic UI changes still require the sibling Storybook and test coverage
described in `AGENTS.md`, including affected changes to extracted primitive
variants or types. Reuse shared test helpers in `src/test/`.

## Legacy code and incremental migration

The landing migration now places `HeroSection` (with sibling stories/tests),
`LandingPage`, hero/navigation constants, hero styles, and the hero font helper
under `src/features/landing/`. `src/app/page.tsx` composes `LandingPage`;
`src/app/layout.tsx` retains the font integration and framework responsibilities.
`SiteHeader`, `PrimaryNav`, `MobileNav`, and `LocalePill` (with their siblings)
live in `src/components/layout/`. Header/nav types, header hooks, locale/header
constants, and pure nav helpers remain in their shared global categories.

Shared navigation receives required `items` props; `SiteHeader` and `MobileNav`
also require `ctaHref`. Landing supplies these values from its own configuration.
Layout stories/tests use `src/test/header.fixtures.ts`, independent of landing.
`components/site/` and global hero implementation paths have been removed.
Older specs and historical verification commands may still mention those paths;
the owning spec's migration note records their current locations.

For new domain code, use its owning feature. For a bug fix, trace the root
cause and make the smallest appropriate change; moving the whole feature is
not a prerequisite. Move existing files when a scoped migration is requested
or when their location causes a meaningful ownership problem. Update imports,
exports, styles, stories, tests, mocks, and active spec paths together. Preserve
behavior and public interfaces unless the task changes them.

Do not leave duplicate implementations or compatibility barrels merely to
hide incomplete moves. Record necessary path deviations in the active story.
Older specs' acceptance criteria still apply; their placement examples defer
to this document.

## Implementation and completion checks

Before coding, name the route, domain owner, required files, and existing
shared modules to reuse. After a change:

1. Verify imports/exports and affected consumers, including stories and tests.
2. Check for duplicate or unused code, circular dependencies, shared-to-feature
   imports, and unnecessary nesting or unrelated moves.
3. From `frontend/`, run `pnpm lint`, `pnpm exec tsc --noEmit`, and relevant
   tests (`pnpm test -- <test-path>` selects tests in the configured UI project).
   Consult `vitest.config.ts` for tests outside that project; run build or
   Storybook checks when affected. Run any additional checks required by the
   active story or repository instructions.
4. Inspect the diff. Report files created, changed, moved, or deleted; structural
   reasons; reused UI/hooks/services; checks run; failures/skips; and remaining
   material structural problems. Never claim an unexecuted check passed.

BMAD specs and handoffs must include this document and both applicable
`AGENTS.md` files as required context, as specified in the root instructions.
`eslint.config.mjs` automatically enforces JavaScript/TypeScript dependency
boundaries for aliased and relative imports, re-exports, statically known dynamic
imports, TypeScript import types/import-equals, and CommonJS requires. Shared
source (including shared tests/fixtures) cannot import features or `app/`
implementations; features cannot import `app/` implementations. Stylesheet
import boundaries remain part of manual review. The translation audit scans
`src/features/` recursively from the frontend directory, requires the app,
components, and features roots, and tolerates absent optional global categories.
