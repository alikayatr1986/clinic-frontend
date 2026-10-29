<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI component triple rule (shadcn + Storybook + test)
Creating or editing `src/components/ui/*` requires updating the sibling
`*.stories.tsx` (variants × Light/Dark × LTR/RTL) and `*.test.tsx`
(render + variant + axe). Use `cn()` + CVA + semantic vars only.

## UI style ownership rule (ask before custom classes)
Never pass custom styling classes (`className`, style overrides, arbitrary
variants) to a `src/components/ui/*` component from a consumer (site code,
stories, tests). Component-level styling belongs in the `ui/*` component
itself — extend it with a CVA variant, size, or prop instead. Any exception
requires asking the human first and recording the approval in the active
story's Spec Change Log before editing. Composing existing public props
(`variant`, `size`, `asChild`, layout-only wrappers around the component) is
allowed without asking.

## Navigation presented as buttons

Use the shared `Button` with `asChild` for navigation presented as a button,
including CTAs, category filters, and pagination. Choose public `variant` and
`size` props; put layout spacing on wrappers and do not add styling classes to
Button consumers or their slotted anchors.

```tsx
<Button asChild variant="outline"><Link href="/blog">Articles</Link></Button>
```

Keep ordinary text links, breadcrumbs, article titles, linked content cards,
and table-of-contents entries as anchors.

## Feature-first architecture — required reading

Read [ARCHITECTURE.md](ARCHITECTURE.md) before planning, implementing, fixing,
refactoring, or reviewing frontend code. It governs file placement and dependency
direction, including BMAD work. Follow the repository root's
[AGENTS.md](../AGENTS.md) for BMAD context/handoff requirements and human-owned
commits.

- Keep routes in `src/app/` focused on framework concerns and composition.
- Put domain implementation and its constants, types, hooks, services, schemas,
  helpers, and styles in `src/features/<feature>/`, creating only needed folders.
- Keep components flat by default. Colocate private supporting files with a
  complex component when useful. Never declare types or interfaces inside
  components or pages; all types belong in dedicated `*.types.ts` files.
- Keep generic UI in `src/components/ui/` and application-wide layout in
  `src/components/layout/`. Shared modules must not import feature code.
- Promote code to global category folders only when ownership and dependencies
  justify cross-feature reuse. Prefer `@/` imports and existing naming patterns.
- Inspect existing code first. Migrate legacy `components/site/` and global
  domain files only within a justified task; update affected imports and tests.

## Types and interfaces placement rule (strictly separate types files)

Never declare `interface` or `type` (including component props, page/route props,
state interfaces, or inline parameter object types) directly inside `.tsx`
components, pages, layouts, or error boundaries. All types and interfaces must
be defined in dedicated `*.types.ts` files:
- Feature components & pages: `src/features/<feature>/types/<feature>.types.ts`
  (or colocated `<component>.types.ts` for private types).
- Shared/primitive components & layout: `src/types/<owner>.types.ts`.
Components and pages must strictly import their props, params, and domain models
from their owning types files. Only primitive literal values (strings, numbers,
booleans) may remain inline.

## Data-access architecture and server state (React Query)

All data access in the frontend must follow the permanent layered architecture:
- **Client component reads and writes:** `app/component -> feature hook -> feature service -> shared API transport (@/lib/api)`.
- **Server framework reads:** `app/Server Component -> feature service -> shared API transport (@/lib/api)`.

### 1. Shared transport exclusivity (`@/lib/api`)
`frontend/src/lib/api.ts` is the single general HTTP transport boundary. Direct `fetch` calls are forbidden outside `src/lib/api.ts` (and narrow documented framework exceptions). Do not introduce Axios, SWR, or secondary API clients.

### 2. Browser server state managed by TanStack Query
All browser-side remote reads and mutations must use TanStack Query feature hooks:
- Feature hooks reside in `src/features/<feature>/hooks/` (or colocated beside a complex component when private to it).
- Exported hook names must begin with `use` (e.g. `useGalleryCases`, `useLandingGallery`, `useBlogHome`, `useConsent`, `useSubmitContact`, `useProcedures`).
- Mutation hooks (e.g. `useSubmitContact`) must disable automatic retries (`retry: false`) on non-idempotent operations.
- Forward TanStack Query's `signal` through queries and mutations to `apiRequest` so superseded requests can be aborted.
- Client presentation components (`"use client"`) must consume feature hooks and must never import data-fetching functions from `*.service.ts`.

### 3. Allowed local UI state vs. server state
TanStack Query owns remote server state (caching, in-flight state, errors, refetching). Never mirror query state into component `useState` or create manual fetch effects with `useEffect`.
Local React state (`useState`/`useReducer`) is strictly reserved for ephemeral UI state:
- Controlled form values, field inputs, and validation feedback
- Selection indices, active tabs, modal/lightbox disclosure, dialog visibility
- Local pagination display and viewport/scroll-derived state
- Client-side focus management and accessible announcements

### 4. Query-key ownership and key factories
Query keys must be stable, serializable arrays owned by the feature and exposed via a query key factory (e.g. `galleryKeys`, `blogKeys`, `contactKeys`, `proceduresKeys`).
- Query keys must include all request dimensions that affect the response: `locale`, `page`, `page_size`, filters, and entity identifiers.
- Never scatter raw string literals across components or hooks.

### 5. Server rendering and initial data
Preserve server-rendered routes (`/blog`, `/blog/[slug]`, `/gallery`, `/sitemap.xml`, `/robots.txt`) for SEO and resilience.
- Server Components, metadata generators, and route handlers may call typed feature services directly.
- When hydrating interactive client components from server data, provide `initialData` with an intentional freshness policy (`staleTime: 60_000` or higher) to prevent duplicate mount refetches.

### 6. Testing and verification
- Feature hooks must be tested with an isolated test `QueryClient` (`retry: false`).
- Component tests must mock feature hooks or wrap components with `ThemedRender` / `QueryClientProvider`.
- Automated structural tests in `src/test/data-access-architecture.test.ts` enforce transport exclusivity, client-hook usage, and query key invariants.

## Tailwind-first styling

Use Tailwind CSS utility classes in component `className` values for frontend
layout and visual styling whenever practical. Prefer existing design tokens and
Tailwind responsive, dark, RTL, state, and arbitrary-value utilities before
adding a stylesheet. Keep `src/app/globals.css` for Tailwind imports, shared
tokens, and genuinely global base rules. Add feature CSS only when utilities
would make the behavior unclear or cannot express it; explain that exception
in the change report. Remove obsolete feature stylesheets and imports after
migrating their rules. This does not override the UI style ownership rule above.

This replaces the former blanket ban on constants/types/hooks/styles inside
component folders. The UI triple rule, style ownership approvals, and icon
approvals remain in force. Editing a shared primitive's extracted styling or
types also requires checking/updating its stories and tests as affected.

## Icon rule (lucide-react only — stop and ask before placing any icon)
All UI icons come from [`lucide-react`](https://lucide.dev). Never write
inline `<svg>` markup, hand-rolled icon components, or icon fonts, and never
delete/replace a lucide icon with a custom one without approval.

1. **Stop and ask before adding any icon.** Whenever an icon is needed for
   any UI, STOP and ask the human first. Propose 1–3 candidate `lucide-react`
   icons by exact export name (e.g. `ArrowRight`, `Globe`, `ChevronDown`,
   `Menu`) and wait for confirmation before importing.
2. **If the icon is unique and does not exist in lucide-react** (custom
   brand marks, shapes lucide doesn't have), tell the human, and ask them to
   download/provide the SVG themselves. The human will place the file in
   `public/icons/` or `public/images/`. Do not create, trace, reconstruct,
   or "approximate" the SVG yourself. Render via `next/image` (`.svg` srcs
   skip optimization automatically); reference the path through a constant
   in its owning feature's `constants/<component>.constants.ts`, or
   `src/constants/<component>.constants.ts` for genuinely shared assets.
3. **Special micro-behaviors (morph, draw-on, pulse) on a lucide icon** are
   allowed only with explicit human approval in the conversation. Implement
   them as CSS/Tailwind targeting the lucide component (`data-*` flags +
   arbitrary variants, `transform-box: fill-box`), record the approval in
   the active story's Spec Change Log, and never fork/re-render the icon
   markup manually.
4. **Tests.** Tests must assert the rendered asset (`img[src="..."]`), lucide
   class names/props (`lucide-menu`), or approved morph flags (`data-open`)
   — never depend on internal lucide paths or hand-written SVG geometry.
