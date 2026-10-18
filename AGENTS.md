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

## Shared-code placement rule (no constants/types/hooks/styles in component folders)
Never keep constants, types/interfaces, hooks, or styles inside
`src/components/**`. Move them to the category folder under `src/` and name
the file after the owning component, e.g.:

- Data/constants -> `src/constants/<component>.constants.ts`
- Types/interfaces -> `src/types/<component>.types.ts`
- Hooks -> `src/hooks/<component>.hooks.ts`
- Styles -> `src/styles/` (approvals per the UI style ownership rule)
- Pure helpers/functions -> `src/utils/<component>.utils.ts`

Components then import them via absolute paths (`@/constants/...`,
`@/types/...`, ...). Never inline a new `const` value, interface, or type in a
component file — add it to the matching category file instead (create one if
it doesn't exist yet).

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
   in `src/constants/<owning-component>.constants.ts`.
3. **Special micro-behaviors (morph, draw-on, pulse) on a lucide icon** are
   allowed only with explicit human approval in the conversation. Implement
   them as CSS/Tailwind targeting the lucide component (`data-*` flags +
   arbitrary variants, `transform-box: fill-box`), record the approval in
   the active story's Spec Change Log, and never fork/re-render the icon
   markup manually.
4. **Tests.** Tests must assert the rendered asset (`img[src="..."]`), lucide
   class names/props (`lucide-menu`), or approved morph flags (`data-open`)
   — never depend on internal lucide paths or hand-written SVG geometry.
