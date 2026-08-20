# Localization

## Status

English and Polish routing, metadata, navigation, and Paraglide generation are implemented. Landing-page copy is being translated section by section; until a section reaches its rollout checkpoint, its Polish route intentionally retains the existing English source copy.

## Architecture

`packages/i18n` is the human-authored source package:

- `routes.ts` defines locale codes, route keys, canonical paths, localized public paths, internal static paths, redirects, rewrites, and Paraglide URL patterns.
- `messages/en.json` and `messages/pl.json` contain flat message keys.
- `project.inlang/settings.json` configures English as the base locale and loads package-local Inlang plugins for offline and CI compilation.

`apps/nextjs` owns its generated runtime:

- `scripts/compile-paraglide.ts` compiles the shared Inlang project into `src/paraglide`.
- `src/paraglide` is generated, ignored by Git, and must not be edited manually.
- `src/i18n/server.ts` validates route params and installs Paraglide's render-scoped locale getter with React `cache()`.
- `src/i18n/routing.ts` exposes app-facing public URL, alternate-language, route-segment, and fragment helpers while delegating route knowledge to `@workspace/i18n/routes`.

The app does not use `@inlang/paraglide-next`, middleware, Proxy, cookies, local storage, browser-language detection, or a client locale provider.

## URL Contract

| Route   | English public URL | Polish public URL | Internal static output       |
| ------- | ------------------ | ----------------- | ---------------------------- |
| Home    | `/`                | `/pl`             | `/en`, `/pl`                 |
| About   | `/about`           | `/pl/o-nas`       | `/en/about`, `/pl/about`     |
| Contact | `/contact`         | `/pl/kontakt`     | `/en/contact`, `/pl/contact` |

Next redirects internal aliases to their canonical public URLs and applies `beforeFiles` rewrites from public URLs to the locale-specific static output. Application links, canonical metadata, Open Graph URLs, language alternates, and sitemap entries always use public URLs.

`/` is always English. The URL is the only locale source. Unsupported locale values and unknown localized paths return a 404.

Because invalid top-level segments are rejected before the dynamic locale layout can render, `app/global-not-found.tsx` provides a self-contained English document fallback. Unknown paths beneath valid `en` or `pl` segments continue through `app/[locale]/not-found.tsx`, which shares the same presentation and can be localized independently during the error-copy rollout.

## Static Rendering

`app/[locale]/layout.tsx` is the root layout. It exports `generateStaticParams()` for generated Paraglide locales, sets `dynamicParams = false`, validates asynchronous Next params, and derives both `<html lang>` and `<html dir>` from the validated locale. Text direction comes from Paraglide's `getTextDirection(locale)`, so adding an RTL locale later will update the document direction without a separate app-maintained mapping.

The root layout initializes render-scoped locale state before rendering descendants. Metadata and server layouts independently resolve locale from their own params and call message functions with explicit locale options, so they do not depend on layout execution order during concurrent static generation.

All known English and Polish pages are prerendered. `app/[locale]/[...rest]/page.tsx` is only a 404 guard for unknown paths and does not represent indexable content.

## Navigation

`AppLayout` translates navbar labels on the server and passes plain strings plus the validated locale into `AppNavbar`. The client navbar uses `useSelectedLayoutSegments()` to identify the canonical route without rendering a rewritten pathname.

Both desktop and mobile controls render real EN and PL anchors for the equivalent public route. Before pointer, auxiliary, or context-menu activation, the app updates the anchor itself with `window.location.search` and `window.location.hash`, preserving native middle-click, modified-click, copy-link, and context-menu behavior. An unmodified locale selection then performs full-document navigation so document language, metadata, Server Component output, and client state cannot diverge.

The shared `LanguageSwitcherLanguage<TLocale>` model keeps locale keys typed across `AppNavbar`, `NavbarMobile`, and the framework-neutral switcher. Switcher props accept immutable language arrays and propagate the same locale-key type to selection callbacks.

Components and app-local data use the framework-facing factories in `app-link-options.ts`. Those factories delegate to `getLocalizedHref()` and accept an explicit locale when the caller already has one, preserving the shared boilerplate convention without duplicating localized route strings. Home-link options also accept a fragment, keeping links such as `#models` and `#process` on the localized home route even when the navbar is rendered on About or Contact.

## Metadata And Discovery

`createSeoMetadata()` requires a route key and locale. It emits localized title and description values, canonical public URLs, EN/PL and `x-default` alternates, and localized Open Graph locale and URL fields.

`app/sitemap.ts` derives every entry and language alternate from the shared route map. It includes both public locale variants and excludes all internal paths and aliases.

## Build Workflow

The `nextjs` workspace owns `i18n:compile`. Its package-level `turbo.json` makes `build`, `dev`, `lint`, and `typecheck` depend on generation without adding i18n tasks to unrelated workspaces. The task declares the compiler, route map, messages, and Inlang settings as inputs and `src/paraglide/**` as its output.

The root `pnpm dev` command uses `turbo watch`. `watchUsingTaskInputs` allows shared message changes to rerun only the generation task while the existing Next development server remains running.

Turbo is the generation orchestrator. Scoped app commands must use `pnpm turbo run <task> --filter=nextjs` so task dependencies and cached generated output remain part of the graph. Direct `pnpm --filter nextjs <script>` commands are low-level package operations and assume `src/paraglide` already exists. Run only one persistent Turbo development watcher per worktree; other sessions should reuse that server or use an isolated worktree.

## Translation Boundaries

- Translate Server Component content on the server and pass strings or typed localized data into existing Client Components.
- Existing Client Components may import tree-shakable Paraglide message functions when passing translated props would make the boundary less clear.
- Do not call message functions at module scope.
- Add English source messages before Polish drafts, keep keys flat, and preserve stable IDs, model names, asset paths, section IDs, dimensions, and route keys.
- Use explicit locale message options in metadata and other code that can execute independently of the root layout.

## Verification

For localization infrastructure changes, run:

```powershell
pnpm --filter @workspace/i18n format
pnpm --filter @workspace/i18n lint
pnpm --filter @workspace/i18n typecheck
pnpm turbo run format --filter=nextjs
pnpm turbo run lint --filter=nextjs
pnpm turbo run typecheck --filter=nextjs
pnpm turbo run build --filter=nextjs
```

Inspect both locale variants for `<html lang>`, translated initial HTML, canonical and alternate URLs, navbar links, full-document locale navigation, and the absence of mixed metadata. Verify mobile and desktop switchers, keyboard focus, query and fragment preservation, redirects, rewrites, 404s, and browser console output.
