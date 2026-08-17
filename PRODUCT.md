# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is design-conscious city professionals, couples, and small families who want a compact premium weekend retreat in nature. They are looking for a calmer second place, a simpler alternative to a fully custom build, and a beautiful low-maintenance cabin for weekends, longer stays, or focused remote work.

## Product Purpose

Luma Cabins is a fictional European-inspired brand for premium pre-designed modular cabins. It helps people choose a resolved cabin model, shape it through a focused set of finish and system choices, prepare the site, and move toward delivery and installation.

Product success means making the cabin offer easy to understand, helping visitors identify a suitable model and direction, reducing uncertainty around the process, and giving serious visitors a clear path to contact Luma.

## Positioning

Luma Cabins sits between a fully custom architecture project and a generic prefab catalog. Its mechanism is a fixed set of pre-designed cabin models with curated customization and optional add-ons. Clients choose the architectural base, then refine selected finishes, energy systems, and outdoor options rather than starting from an unlimited design brief.

The cabins are positioned as premium retreat spaces with compact footprints, high-performance construction, solar-ready systems, and optional off-grid packages. They are not cheap tiny homes, survivalist housing, fully custom architecture, or mass-market prefab housing.

## Operating Context

Visitors typically move through this workflow:

1. Browse the cabin models and their intended use cases.
2. Compare the Niva, Aster, and Veyra models.
3. Explore exterior finishes, interior palettes, and the active model floor plan.
4. Understand the guided process from model selection through site preparation, delivery, and installation.
5. Contact Luma to discuss the model, setting, and next steps.

The current website is a content-first homepage concept. The rendered landing page contains Hero, About, Models Overview, Interactive Showcase, Testimonials, Interior Comparison, and How It Works sections. The contact and about routes exist as shells, while richer model, portfolio, consultation, and FAQ routes remain future work.

## Capabilities and Constraints

- The current source of truth for model facts is `apps/nextjs/src/app/(app)/_data/cabins.ts`.
- Niva is `20 m2` with a sleeping loft.
- Aster is `39 m2` with a studio layout.
- Veyra is `56 m2` with one bedroom.
- The homepage showcase supports model switching, exterior finish selection, interior palette selection, and a floor plan view. Exterior finish changes update the visible cabin imagery. Interior palette controls exist, but do not currently map to a separate visible image.
- The current showcase starting prices are Niva `EUR 130,000`, Aster `EUR 170,000`, and Veyra `EUR 210,000`, plus installation. These prices are provisional concept content and must not be treated as approved commercial pricing.
- Energy setup and add-ons such as a sauna, plunge pool, and deck lounge are product direction, not current homepage controls.
- The process descriptions and detail bullets in `apps/nextjs/src/app/(app)/_data/process-steps.ts` are provisional and must be reviewed against the final service scope.
- Avoid unsupported permit, delivery, installation, or sustainability promises. Prefer specific claims such as compact footprint, high-performance insulation, responsibly sourced timber, low-waste prefabrication, solar-ready setup, and durable repairable materials.
- Content is hardcoded and typed. There is no CMS, authentication, database, or API layer.
- The project is a web application built with Next.js, React, TypeScript, Tailwind CSS, shadcn-style shared UI, and Turborepo. It is intended for Vercel deployment.
- The current implementation should preserve keyboard access, meaningful image descriptions, reduced-motion behavior, and usable touch interactions for interactive landing-page controls.

## Brand Commitments

- The name is Luma Cabins.
- The brand is European-inspired but should not be tied to one specific country or legal region.
- The voice is calm, minimal, premium, nature-focused, warm, quietly confident, architectural without feeling cold, sustainable without being preachy, refined, and human.
- The offer should feel premium and considered while remaining approachable.
- The project is a fictional concept. Client identities, testimonials, and review content are fictional portfolio content and are not verified customer proof.
- Existing brand and media assets include the Luma logo component at `apps/nextjs/src/app/_components/layout/logo.tsx`, cabin imagery under `apps/nextjs/public/images/huts/`, process media under `apps/nextjs/public/images/process/` and `apps/nextjs/public/videos/process/`, and the hero media under `apps/nextjs/public/images/` and `apps/nextjs/public/videos/`.

## Evidence on Hand

- Current product and homepage direction: `design/briefs/HOMEPAGE.md`.
- Current model data and imagery mapping: `apps/nextjs/src/app/(app)/_data/cabins.ts`.
- Current guided process content: `apps/nextjs/src/app/(app)/_data/process-steps.ts`.
- Current landing-page composition and interaction contracts: `docs/features/landing-page.md` and the linked feature documents under `docs/features/`.
- Current homepage and interactive media assets exist in `apps/nextjs/public/`.
- No verified customer testimonials, approved pricing sheet, CMS content, or commercial service scope is present in the repository. Future work must not invent these.

## Product Principles

1. Start with a resolved cabin model, then offer focused choices rather than unlimited customization.
2. Make the promise of a calmer nature retreat concrete through clear models, specifications, materials, and process steps.
3. Reduce the uncertainty of a construction project without implying a turnkey scope that has not been confirmed.
4. Use specific, credible performance and sustainability language instead of broad environmental claims.
5. Keep the product premium and considered while making the path to contact approachable.

## Accessibility & Inclusion

The web experience should preserve keyboard-operable controls, meaningful alternative text for content media, reduced-motion behavior, visible focus states, and touch interactions that do not prevent normal page scrolling.
