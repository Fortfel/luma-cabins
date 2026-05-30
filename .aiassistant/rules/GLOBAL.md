---
apply: always
---

# AGENTS.md

<!-- intent-skills:start -->

# Skill mappings - when working in these areas, load the linked skill file into context.

skills:

- task: "best practices on how to use TanStack Start overall"
  load: "apps/tanstack-start/node_modules/@tanstack/react-start/skills/react-start/SKILL.md"
- task: "best practices on how to use TanStack Start server functions"
  # To load this skill, run: npx @tanstack/intent@latest list | grep server-functions
- task: "best practices on how to use TanStack Start server routes"
  # To load this skill, run: npx @tanstack/intent@latest list | grep server-routes
- task: "best practices on how to use TanStack Router data loading, preloading, and SSR"
  # To load this skill, run: npx @tanstack/intent@latest list | grep data-loading
- task: "best practices on how to use TanStack Router auth guards, redirects, and protected routes"
  # To load this skill, run: npx @tanstack/intent@latest list | grep auth-and-guards
- task: "best practices on how to use Next.js with tRPC + React Query"
  load: "apps/nextjs/node_modules/@trpc/tanstack-react-query/skills/react-query-setup/SKILL.md"

<!-- intent-skills:end -->

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `apps/nextjs/node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Snapshot

- Package manager: `pnpm`
- Monorepo tool: Turborepo
- Apps: `apps/nextjs`, `apps/tanstack-start`
- Shared packages: `packages/api`, `packages/auth`, `packages/db`, `packages/ui`, `packages/validators`
- Shared tooling: `tooling/eslint`, `tooling/prettier`, `tooling/typescript`, `tooling/tailwind`

## Repo Layout

- `apps/nextjs`: Next.js app
- `apps/tanstack-start`: TanStack Start app
- `packages/api`: tRPC routers, services, and error mapping
- `packages/auth`: Better Auth server/client setup and auth schema generation
- `packages/db`: Drizzle schema, client, migrations, and seed utilities
- `packages/ui`: shared UI components and hooks
- `packages/validators`: shared validation definitions

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

## Database and Auth Commands

- Generate auth schema: `pnpm auth:schema:generate`
- Generate Drizzle files: `pnpm db:generate`
- Run DB migrations: `pnpm db:migrate`
- Push schema directly: `pnpm db:push`
- Seed DB: `pnpm db:seed`
- Open Drizzle Studio: `pnpm db:studio`

## Single-Workspace Commands

- Prefer `pnpm --filter <package> <script>` when only one workspace changes
- Build one app/package: `pnpm --filter nextjs build`
- Lint one app/package: `pnpm --filter @workspace/api lint`
- Typecheck one app/package: `pnpm --filter nextjs typecheck`
- Format one app/package: `pnpm --filter @workspace/ui format`
- Run one app in dev: `pnpm --filter tanstack-start dev`
- Useful filters: `nextjs`, `tanstack-start`, `@workspace/api`, `@workspace/auth`, `@workspace/db`, `@workspace/ui`, `@workspace/validators`

## Package-Local Scripts

- `apps/nextjs`: `dev`, `build`, `start`, `with-env`, `lint`, `typecheck`, `format`
- `apps/tanstack-start`: `dev`, `build`, `preview`, `deploy`, `cf-typegen`, `lint`, `typecheck`, `format`
- `packages/api`: `build`, `dev`, `lint`, `typecheck`, `format`
- `packages/db`: `build`, `dev`, `db:generate`, `db:migrate`, `db:push`, `db:seed`, `db:studio`, `lint`, `typecheck`, `format`
- `packages/auth`: `auth:schema:generate`, `lint`, `typecheck`, `format`
- `packages/ui`: `lint`, `typecheck`, `format`
- `packages/validators`: `build`, `dev`, `lint`, `typecheck`, `format`

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

- Formatting is centralized in `tooling/prettier/index.js`
- Use the repo Prettier config; do not hand-format against it
- Do not use semicolons
- Use single quotes
- Keep trailing commas enabled
- Print width is `120`
- Tailwind classes are sorted by `prettier-plugin-tailwindcss`
- Imports are sorted by `@ianvs/prettier-plugin-sort-imports`
- Use English for code and documentation

## Import Rules

- Type imports first
- React / React Native next
- Next / Expo next
- Third-party packages next
- `@workspace/*` next
- Local aliases like `~/`, `@/`, `#/` next
- Relative imports (`../`, `./`) last
- Prefer `import type` for type-only imports
- When importing/exporting types, use named type imports

## TypeScript Rules

- Use TypeScript for all code unless the file is intentionally `.js` or `.jsx`
- TypeScript is strict across the repo
- `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, and `noImplicitReturns` are enabled
- Avoid `any`; use explicit types and use `unknown` if a flexible type is required
- Prefer interfaces for object shapes when they improve readability or extensibility
- Use type aliases where the existing codebase already does so or where unions/utility types fit better
- Use `Array<T>` instead of `T[]`
- Prefer `readonly` and `ReadonlyArray<T>` for immutable data where practical
- Use `as const` for stable literals
- Use `satisfies` when validating object shapes without widening
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
- Route files may use TanStack route naming like `$`, `_auth`, `_app`, and `routeTree.gen.ts`
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
- `packages/api` uses `neverthrow`; do not ignore `Result` values
- Service-layer DB work commonly returns `ResultAsync` and maps failures with helpers like `dbError(...)`
- Router boundaries unwrap results with `unwrapResult(...)` and convert them to `TRPCError`
- In server handlers, log full errors server-side and sanitize client-facing errors in production
- The one explicit non-`Error` throw exception allowed by linting is TanStack `Redirect`

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
- Keep route modules aligned with TanStack Router file-based conventions
- Promise-returning event handlers often use `void`, e.g. `void navigate(...)`, when intentionally not awaited
- Use `useEffectEvent` when appropriate
- Maintain high accessibility standards
- Use Tailwind CSS v4 for styling

## Documentation Comments

- Prefer TSDoc when documentation comments are needed
- Do not use JSDoc-only tags such as `@property` or `@extends`
- Keep comments useful and concise; avoid narrating obvious code

## Data and DB Conventions

- tRPC routers live in `packages/api/src/server/router`
- Business logic belongs in service modules, not directly inside router procedures
- Validation should use shared Zod schemas where practical
- Database access should go through `@workspace/db` exports
- Drizzle delete operations must include `where`; lint enforces this

## Generated Files

- `routeTree.gen.ts` is generated; avoid manual edits
- Auth schema output is generated into `packages/db/src/schemas/auth.ts`
- Do not commit accidental noise from `dist/`, `.cache/`, or similar generated output

## Agent Workflow

- Identify the exact workspace before editing
- Follow existing local patterns before introducing new abstractions
- Run the narrowest useful verification first
- Minimum preferred verification after code changes: `pnpm --filter <workspace> lint` and `pnpm --filter <workspace> typecheck`
- Run `build` when changes affect bundling, emitted types, or production behavior
- If work spans multiple packages, use root `pnpm lint` and `pnpm typecheck` when practical
- If you add a real test setup, update this file with the exact single-test command

# context-mode
