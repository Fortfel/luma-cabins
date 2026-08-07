# Landing Page

## Status

This document maps the current landing-page composition and the conventions shared across its sections. Detailed interaction behavior remains in the section-specific feature documents linked below.

## Purpose

Use this document to add, remove, reorder, or connect landing-page sections without rediscovering the route structure, layout tokens, navigation contracts, and existing interaction infrastructure.

Product direction remains in `design/briefs/HOMEPAGE.md`. Proposed work remains in `docs/plans/` and must not be described here as shipped behavior.

## Implementation Map

- `apps/nextjs/src/app/(app)/page.tsx`
- `AppHomePage` owns section order, section-level vertical spacing, and background transitions.
- `apps/nextjs/src/app/(app)/layout.tsx`
- `AppLayout` provides the fixed application navbar and exposes `--nav-height` to landing-page content.
- `apps/nextjs/src/app/(app)/_components/`
- Landing sections and app-local section helpers live here.
- `apps/nextjs/src/app/(app)/_data/`
- Hardcoded typed landing-page content shared by multiple components lives here.
- `apps/nextjs/src/styles.css`
- Page containers, page gutters, section spacing, custom breakpoints, and fluid type utilities are defined here.
- `tooling/tailwind/theme.css`
- Semantic colors, typography families, radii, shadows, and Tailwind theme mappings are defined here.
- `apps/nextjs/src/app/_components/layout/nav/data.ts`
- `navigationDesktopLinks` and `navigationMobileLinks` define landing-page fragment links and route links.

## Current Section Order

The order below is the rendered order in `AppHomePage`.

| Order | Component                    | Rendering boundary                                     | Page-level surface                                                    |
| ----- | ---------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 1     | `HeroSection`                | Server component composition                           | Full-height primary hero; bottom separation uses `--section-gutter-y` |
| 2     | `AboutSection`               | Server component                                       | `bg-background`                                                       |
| 3     | `ModelsOverviewSection`      | Client component                                       | Gradient from `background` to `background-accent`                     |
| 4     | `InteractiveShowcaseSection` | Client component                                       | `bg-background-accent`                                                |
| 5     | `TestimonialsSection`        | Client component                                       | `bg-background`                                                       |
| 6     | `InteriorComparisonSection`  | Server section with an app-local client slider adapter | Gradient from `background-accent` to `background`                     |

When changing this order, review adjacent background transitions and confirm that the page still reads as one purchase journey rather than a list of isolated modules.

## Section Composition

- `AppHomePage` should remain a simple composition layer. Do not move section-specific state or content into the page module.
- Sections accept normal `section` props where practical so `className`, `id`, and accessibility attributes can be supplied by the page composition.
- Keep sections as Server Components by default. Add the narrowest useful client boundary for state, event handlers, observers, browser geometry, or browser-only APIs.
- Reuse `LandingSectionIntro`, `LandingSectionIntroEyebrow`, `LandingSectionIntroTitle`, and `LandingSectionIntroBody` for centered editorial intros.
- A section may use a bespoke intro when its grid or media relationship requires a different hierarchy, as `InteriorComparisonSection` does.
- Keep landing content hardcoded and typed. Use Zod only when runtime input actually requires parsing.
- Keep feature-specific helpers app-local unless more than one real consumer needs the same behavioral contract.

## Layout System

`apps/nextjs/src/styles.css` defines the landing-page layout vocabulary:

- `--page-gutter-x` provides fluid horizontal page padding.
- `--section-gutter-y` provides fluid vertical section spacing.
- `section-px` and `section-py` apply those shared gutters.
- `container-page-2xl`, `container-page-3xl`, and `container-page-4xl` center content at progressively wider caps.
- `container-bleed` removes a container's minimum page gutter when media should reach the viewport edge.
- `3xl` is `1728px`; `4xl` is `1920px`.

Choose the narrowest container that matches the content:

- Use `container-page-2xl` for focused editorial content and shared centered intros.
- Use `container-page-3xl` for wide text grids and section-level editorial layouts.
- Use `container-page-4xl` for large media surfaces.
- Combine `container-page-4xl` with `container-bleed` for media that remains edge-to-edge through `1919px` and centers at its maximum width.
- Existing full-width media sections add `16px` side gutters and `rounded-xl` framing at `4xl` rather than changing their smaller-width geometry.

Prefer existing `md`, `lg`, `xl`, `3xl`, and `4xl` breakpoints. Add a one-off breakpoint only when content geometry demonstrates a real failure at the standard boundary.

## Navbar And Anchors

The fixed navbar height is exposed as `--nav-height` by `AppLayout`. Sticky sections, anchored sections, and viewport-height calculations must account for it instead of duplicating the navbar height.

Every same-page fragment in `navigationDesktopLinks` must match a rendered section ID. Route links such as `/about` and `/contact` are not part of this fragment contract.

Current fragment status:

| Fragment   | Intended destination | Current status                                                                                                  |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `#models`  | Models overview      | Configured in navigation; no matching section ID is currently rendered                                          |
| `#process` | How it works         | Configured in navigation; section is proposed in `docs/plans/how-it-works-section-plan.md` but not yet rendered |
| `#faqs`    | FAQ                  | Configured in navigation; no FAQ section is currently rendered                                                  |

When adding or removing a fragment target, update the navigation data and this status table in the same change. Apply an appropriate scroll margin so the fixed navbar does not obscure the target heading.

## Interaction Infrastructure

Prefer existing shared infrastructure before adding section-local alternatives:

- `@workspace/ui/components/carousel` provides the shared Embla composition and keyboard navigation.
- `@workspace/ui/hooks/use-media-query` supports behavior that genuinely differs by breakpoint.
- `@workspace/ui/hooks/use-prefers-reduced-motion` gates automatic or animated behavior.
- `@workspace/ui/hooks/use-mobile` provides the shared `768px` mobile boundary where its boolean contract is sufficient.
- `@workspace/ui/lib/embla-plugins` exposes shared carousel plugins.
- `@workspace/ui/lib/utils` provides `cn(...)` for class composition.

Existing complex interaction references:

- [Models overview](./models-overview.md) covers autoplay, visibility gating, touch intent, and carousel controls.
- [Testimonials](./testimonials.md) covers coordinated geometry, portals, dismissal, and reduced motion.
- [Interior comparison](./interior-comparison.md) covers continuous pointer state, touch intent, clipping, and range accessibility.

Do not store high-frequency visual progress in React state. Use refs, CSS custom properties, or motion values for transient per-frame values, and update React state only for meaningful discrete UI changes.

## Media Conventions

- Use `next/image` for landing-page images.
- Reserve image geometry with intrinsic dimensions or an aspect-ratio container and `fill`.
- Provide a `sizes` value that matches the actual responsive container rather than defaulting every image to `100vw`.
- Do not mark below-the-fold section media as priority.
- Keep meaningful alt text with the content data; use empty alt text for genuinely decorative duplicates.
- Disable native image dragging where a pointer or carousel interaction owns the gesture.
- Store shipped landing assets under `apps/nextjs/public/images/` in a feature- or subject-specific directory.

## Adding A Section

1. Confirm the intended insertion point in `AppHomePage` and inspect both neighboring section surfaces.
2. Read `design/briefs/HOMEPAGE.md` and any relevant plan before deciding content or product claims.
3. Choose existing container, gutter, typography, and semantic theme tokens before adding local values.
4. Keep the section server-rendered unless its behavior requires a client boundary.
5. Add a matching section ID when the navbar or another control links to it.
6. Keep repeated content in a typed app-local data module when it improves readability or supports multiple responsive compositions.
7. Add or update a section-specific feature document for custom animation, state transitions, browser geometry, accessibility behavior, or important implementation rationale.
8. Update this document when the section changes landing-page composition or a shared landing convention.
9. Verify formatting, lint, type checking, and a production build for behavior that affects bundling or runtime rendering.

## Maintenance

Update this document in the same change when:

- A landing-page section is added, removed, reordered, or renamed.
- A section ID or navbar fragment is added, removed, or reassigned.
- Section ownership moves between files or server and client boundaries materially change.
- Shared container, gutter, breakpoint, background-transition, image-framing, or sticky-offset conventions change.
- A new shared landing-page interaction utility becomes the preferred pattern.

Do not update this document for isolated copy edits, asset swaps, or styling changes that do not alter a shared convention. Put detailed behavioral changes in the relevant section feature document instead.

Prefer file paths and named symbols over line numbers so this map survives routine edits.

## Verification Baseline

For changes limited to `apps/nextjs`, run:

```powershell
pnpm --filter nextjs lint
pnpm --filter nextjs typecheck
```

Run `pnpm --filter nextjs build` when changes affect client boundaries, image behavior, bundling, emitted output, or production-only rendering.

There is no configured automated test runner. Use focused browser QA for responsive layout, keyboard access, reduced motion, touch gestures, sticky behavior, and section-anchor positioning.
