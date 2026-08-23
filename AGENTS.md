---
apply: always
---

# AGENTS.md

<!-- intent-skills:start -->

# Skill mappings - when working in these areas, load the linked skill file into context.

skills: []

<!-- intent-skills:end -->

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `apps/nextjs/node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

Note: `apps/nextjs/node_modules/next` may be a pnpm Windows reparse point/symlink, and file glob tools may return no matches under it. If docs appear missing, verify with `Test-Path -LiteralPath "apps/nextjs/node_modules/next/dist/docs"` or read files by exact path instead of trusting glob output.

<!-- END:nextjs-agent-rules -->

## Skills

Use relevant installed skills when they clearly match the task; do not load unrelated skills just because they are available

Repository-local skills live under .agents/skills/; treat their skill files as the detailed source of truth for those workflows

If a skill's generic instructions conflict with an explicit repo rule in this file, follow the repo-specific rule

For Playwright CLI specifically, the native-Windows launch restriction in the Browser and UI Verification section overrides generic Playwright skill instructions that tell the agent to run playwright-cli open itself

## IDE Integration

Always use the `jetbrains-index` MCP server when applicable for:

- **Finding references** — Use `ide_find_references` instead of grep/search
- **Go to definition** — Use `ide_find_definition` for accurate navigation
- **Renaming symbols** — Use `ide_refactor_rename` for safe, project-wide renames
- **Type hierarchy** — Use `ide_type_hierarchy` to understand class relationships
- **Finding implementations** — Use `ide_find_implementations` for interfaces/abstract classes
- **Diagnostics** — Use `ide_diagnostics` to check for code problems The IDE's semantic understanding is far more accurate than text-based search. Prefer IDE tools over grep, ripgrep, or manual file searching when working with code symbols.

## Snapshot

- Package manager: `pnpm`
- Monorepo tool: Turborepo
- Apps: `apps/nextjs`
- Shared packages: `packages/ui`
- Shared tooling: `tooling/typescript`, `tooling/tailwind`

## Repo Layout

- `apps/nextjs`: Next.js app
- `packages/ui`: shared UI components and hooks

## Root Commands

- Install deps: `pnpm install -r`
- Build all workspaces: `pnpm build`
- Lint all workspaces: `pnpm lint`
- Auto-fix lint issues: `pnpm lint:fix`
- Typecheck all workspaces: `pnpm typecheck`
- Check formatting: `pnpm format`
- Rewrite formatting: `pnpm format:fix`
- Workspace dependency hygiene: `pnpm lint:ws`
- Clean caches: `pnpm clean:cache`
- Clean build outputs: `pnpm clean:build`

## Single-Workspace Commands

- Prefer `pnpm turbo run <task> --filter=<package>` for tasks with generated or workspace dependencies
- Build one app/package: `pnpm turbo run build --filter=nextjs`
- Lint one app/package: `pnpm turbo run lint --filter=nextjs`
- Typecheck one app/package: `pnpm turbo run typecheck --filter=nextjs`
- Format one app/package: `pnpm --filter @workspace/ui format`
- Run one app with dependency-aware watching: `pnpm turbo watch dev --filter=nextjs`
- Direct `pnpm --filter nextjs <script>` commands are low-level and assume generated Paraglide output already exists
- Useful filters: `nextjs`, `@workspace/i18n`, `@workspace/ui`, `@workspace/tailwind-config`, `@workspace/typescript-config`

## Package-Local Scripts

- `apps/nextjs`: `dev`, `build`, `i18n:compile`, `start`, `typegen`, `with-env`, `lint`, `lint:fix`, `typecheck`, `format`, `format:fix`
- `packages/i18n`: `lint`, `lint:fix`, `typecheck`, `format`, `format:fix`
- `packages/ui`: `lint`, `lint:fix`, `typecheck`, `format`, `format:fix`
- `tooling/tailwind`: `lint`, `lint:fix`, `typecheck`, `format`, `format:fix`

## Tests

- There is no repo-wide `test` script
- No `vitest`, `jest`, `playwright`, or `cypress` config files were found
- No `*.test.*` or `*.spec.*` files were found
- Do not claim tests passed unless a test runner is added and actually executed

## Single Test Guidance

- There is currently no supported single-test command because no test framework is configured
- If tests are added later, prefer package-scoped execution: `pnpm --filter <package> test -- <path-or-pattern>`
- If Vitest is added, the likely pattern is `pnpm --filter <package> test -- run path/to/file.test.ts`
- Until then, use `lint`, `typecheck`, and targeted `build` commands as the verification baseline

## Formatting

- Formatting is centralized in `.oxfmtrc.json`
- Use the repo `oxfmt` config; do not hand-format against it
- Do not use semicolons
- Use single quotes
- Keep trailing commas enabled
- Print width is `120`
- Tailwind classes are sorted by `oxfmt` using `.oxfmtrc.json`
- Imports are sorted by `oxfmt` using `.oxfmtrc.json`
- Use English for code and documentation

## Import Rules

.oxfmtrc.json is the source of truth for import ordering; do not maintain a competing manual framework-specific order here

Prefer import type for type-only imports

Keep type-only specifiers at top level, matching the lint/formatter configuration

Use @workspace/\* for shared workspace packages and @/ for app-local imports

Use relative imports only within the same local module area when an alias/public package export is not more appropriate

Run the formatter instead of manually rearranging imports

## TypeScript Rules

- Use TypeScript for all code unless the file is intentionally `.js` or `.jsx`
- TypeScript is strict across the repo
- `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` are enabled
- Avoid `any`; use explicit types and use `unknown` if a flexible type is required
- Prefer interfaces for object shapes when they improve readability or extensibility
- Use type aliases where the existing codebase already does so or where unions/utility types fit better
- Use `Array<T>` instead of `T[]`
- Prefer `readonly` and `ReadonlyArray<T>` for immutable data where practical
- For static object/array configuration, prefer inferred literals with `as const satisfies ...` over annotating the variable with the target type
- Use `as const` for stable literals that should preserve their narrow literal/tuple types
- Use `satisfies` to validate static objects and arrays against a type without widening their inferred type
- Avoid type annotations such as `const items: ReadonlyArray<Item> = [...]` when `const items = [...] as const satisfies ReadonlyArray<Item>` preserves more useful type information
- Keep type-only specifiers at top level
- Do not use `enum`; use unions or `as const` objects instead
- Do not use non-null assertions (`!`)
- Use exhaustive `switch` statements where relevant
- Generic type parameters must start with `T` and then an uppercase letter, e.g. `TValue`
- Unused variables should either be removed or prefixed with `_`

## Naming and File Conventions

- Use PascalCase for classes, React components, and type names
- Use camelCase for variables, functions, and methods
- Use kebab-case for file and directory names unless framework conventions require otherwise
- Next.js route groups may use parentheses, e.g. `(app)` and `(public)`
- Boolean variables should start with `is`, `are`, `should`, `has`, `can`, `did`, or `will`
- Use UPPERCASE for environment variables
- Avoid magic numbers; extract constants when values are not obvious
- Route modules typically export `Route` from `createFileRoute(...)`

## Exports and Module Structure

- Prefer named exports over default exports for shared modules
- Prefer one primary export per file when practical
- Do not force the one-export rule when the existing module pattern clearly groups related exports
- Keep functions short, single-purpose, and easy to scan

## Imports and Aliases

- In frontend apps, use `@/` for app-local imports
- Use `@workspace/*` for cross-package imports
- Do not reach into another package with relative filesystem paths
- Prefer package public exports where available

## Environment Access

- ESLint restricts direct `process.env` access in normal application code
- In frontend code, import validated env from `@/env`
- `process.env` is acceptable inside env/bootstrap files such as `env.ts` where validation is defined
- When adding env vars, update the relevant env schema instead of reading raw values inline

## Error Handling

- Only throw `Error` objects, not strings or arbitrary values
- In server handlers, log full errors server-side and sanitize client-facing errors in production

## Functions and Logic

- Prefer concise arrow functions for simple cases
- Use higher-order functions like `map`, `filter`, and `reduce` when they make logic clearer
- Prefer default parameter values over extra null/undefined checks when appropriate
- Use RO-RO (Receive Object, Return Object) when multiple parameters or return values would otherwise become hard to read
- Prefer immutable transformations over mutation
- Avoid excessive use of primitive-only data; favor meaningful composite types

## React, UI, and Accessibility

- Use functional components with explicit TypeScript props
- Existing code favors small function components and named exports
- Use shared `@workspace/ui` components before creating duplicate primitives
- Use `cn(...)` from `@workspace/ui/lib/utils` for class merging
- Keep route modules aligned with Next.js App Router file-based conventions
- Promise-returning event handlers often use `void`, e.g. `void navigate(...)`, when intentionally not awaited
- Use `useEffectEvent` when appropriate
- Maintain high accessibility standards
- Use Tailwind CSS v4 for styling

## Documentation Comments

- Prefer TSDoc when documentation comments are needed
- Do not use JSDoc-only tags such as `@property` or `@extends`
- Keep comments useful and concise; avoid narrating obvious code

## Feature Documentation

- `docs/features/` contains current behavioral and architectural documentation for complex product features
- Update the relevant feature document in the same change when modifying behavior, state transitions, positioning rules, accessibility, shared component contracts, or important implementation rationale
- Styling-only and copy-only changes do not normally require feature documentation updates
- Add a feature document for complex interactions involving custom animation, state machines, manual browser geometry, browser event coordination, or shared primitive changes
- Keep proposed work in `docs/plans/`, point-in-time findings in `docs/audits/`, and current implementation truth in `docs/features/`
- Reference files and named symbols instead of unstable line numbers
- Update `docs/features/README.md` when adding, renaming, or removing feature documents
- Treat `docs/features/landing-page.md` as the current landing-page composition map; update it when sections are added, removed, reordered, or renamed, when section IDs or navbar fragments change, or when shared landing layout and responsive conventions change

## Content Conventions

- The landing page uses hardcoded typed content
- No CMS, auth, database, or API layer is currently present
- Keep content structured so it can move into shared component data later
- Validation should use Zod only where runtime parsing is actually needed

## Generated Files

- Do not commit accidental noise from `dist/`, `.cache/`, or similar generated output
- Do not manually edit generated Next.js output under `.next/`

## Browser and UI Verification

Browser verification is separate from the repo's automated test setup. Use the most context-rich browser tool that is already available for the current task; do not force Playwright for every frontend check.

Browser tool selection

OpenChamber Web/browser tool — Prefer for routine runtime verification when working from OpenChamber and the tool is available. Use it to open the running dev app, inspect rendered output, click/type/scroll, check responsive layouts, and capture screenshots when useful.

Pencil browser/MCP — Prefer when the task is centered on .pen design work, design-to-code comparison, or Pencil already provides the relevant browser context. Use pencil_browser when available instead of launching a redundant Playwright browser for the same check.

Playwright CLI — Use when a repeatable CLI-driven flow is specifically useful, when the other browser tools are unavailable or insufficient, or when explicitly requested.

Do not run multiple browser stacks for the same verification unless each one adds distinct value. If a preferred tool is unavailable, use the next appropriate tool and state the limitation rather than pretending the check was performed.

Playwright CLI on native Windows/OpenCode

Do not run playwright-cli open from OpenCode's shell on native Windows. The persistent browser process can leave the shell tool waiting indefinitely.

First use playwright-cli list to inspect existing named sessions.

Reuse a Playwright session only if it is already assigned to the current chat/task.

Never share one named Playwright session between concurrent OpenChamber/OpenCode chats.

If the current chat needs a new Playwright session, propose a short unused name such as <project_name>-<task> (add a suffix when needed) and give the user the exact command to run manually in a separate external terminal, for example: playwright-cli -s=luma-testimonials open <url>.

Do not execute that open command yourself. Wait for the user to confirm that the session is open.

After confirmation, use the same -s=<session> name for every subsequent Playwright CLI command in this chat.

Do not try to work around the launch issue with Start-Process, cmd /c, background jobs, or another detached shell launched by the agent.

Never run playwright-cli close-all or playwright-cli kill-all unless the user explicitly asks, because other concurrent chats may own other sessions.

Verification expectations

Reuse an already-running dev server when possible; do not start duplicate servers unnecessarily.

Do not assume a fixed localhost port. Discover or use the actual running URL.

For visual, responsive, animation, mask/gradient, carousel, dialog, hover, focus, or interaction changes, verify the affected behavior in a browser at the relevant viewport sizes.

For non-UI changes, browser verification is optional unless runtime behavior is affected.

Do not claim browser verification succeeded if the browser tool was unavailable, blocked, or not actually run.

## Agent Workflow

- Identify the exact workspace before editing
- Follow existing local patterns before introducing new abstractions
- Run the narrowest useful verification first
- Minimum preferred verification after code changes: `pnpm turbo run lint --filter=<workspace>` and `pnpm turbo run typecheck --filter=<workspace>`
- Run `build` when changes affect bundling, emitted types, or production behavior
- If work spans multiple packages, use root `pnpm lint` and `pnpm typecheck` when practical
- If you add a real test setup, update this file with the exact single-test command

## Pen File Rules

**Scope:** these rules apply to **spec/production `.pen` files** - `design.lib.pen`, `design/spec.pen`, finalized page specs, and any `.pen` file intended to map directly to code. They do **not** apply to **exploration `.pen` files** used for multi-variant visual exploration, where inventing variables is expected and expected to be reconciled before production handoff. Exploration files should be named or located so they are clearly distinguishable, preferably `design/explorations/` with multiple labeled variants/pages inside.

- `tooling/tailwind/theme.css` is the source of truth for shared semantic design tokens.
- `apps/nextjs/src/styles.css` is the source of truth for app-specific fluid typography roles, layout clamps, and responsive spacing utilities.
- In spec/production `.pen` files, always prefer theme tokens from `theme.css`:
  - colors: `$--background`, `$--foreground`, `$--card`, `$--popover`, `$--primary`, `$--secondary`, `$--muted`, `$--accent`, `$--destructive`, `$--border`, `$--input`, `$--ring`, `$--sidebar-*`
  - typography: `$--font-sans`, `$--font-serif`, `$--font-mono`
  - radii: `$--radius-sm`, `$--radius-md`, `$--radius-lg`, `$--radius-xl`, `$--radius-2xl`, `$--radius-3xl`, `$--radius-4xl`
- Do not invent new official `--token` variables in `.pen` files that do not exist in `theme.css`.
- If a derived token is needed for design parity, create it under `unofficial/<name>` in the relevant `.pen` file and document what it is derived from.
- Use `$--font-sans` instead of hardcoded fonts unless an existing file already has a deliberate exception.

### Pencil and Fluid Clamp Parity

Pencil frames are discrete visual snapshots, while production CSS may interpolate continuously with `clamp()` for typography, spacing, dimensions, and positioning. Treat Pencil as the source of visual intent at documented frame widths, not as the source of every intermediate CSS value.

- Treat the smallest and largest relevant Pencil frames as the primary visual anchors for each fluid range.
- Record each clamp's own endpoint values and viewport widths; do not assume every clamp uses the same mobile or desktop anchors.
- Derive the preferred `calc(...)` term mathematically from the endpoint pair. Do not estimate the `vw` coefficient by eye.
- For non-obvious clamps, add a concise endpoint comment such as `/* 42px @ 375px -> 88px @ 1536px */`.
- When transferring Pencil to code, preserve the endpoint appearance while implementing natural interpolation between those endpoints.
- When transferring code to Pencil, resolve the rendered or computed value at the exact Pencil frame width instead of copying the clamp expression or an unrelated intermediate value.
- Compare Pencil and browser output at exactly matching viewport widths. Do not compare a `1440px` browser screenshot against a `1536px` Pencil frame as though they were the same target.
- Verify both endpoint widths, at least one intermediate width, and every documented tablet frame relevant to the affected composition.
- Intermediate values do not need to match arbitrary discrete snapshots unless those snapshots are explicitly designated as visual anchors.
- If a tablet frame represents an intentional composition that natural interpolation cannot reproduce, use an explicit breakpoint or separate fluid range rather than distorting one clamp to pass through every snapshot.
- Keep semantic role names stable while tuning their fluid values. Fix repeated differences in the shared role or clamp instead of adding local arbitrary values.
- Prefer `rem` endpoints for typography so browser text scaling remains effective; use fixed units only when the value represents genuinely fixed geometry.
- Browser rendering is the final authority for production behavior. Pencil parity is complete only after visual verification in the running application.

- After editing a `.pen` file, verify:
  - the file still opens
  - no accidental hardcoded semantic colors were introduced

# context-mode
