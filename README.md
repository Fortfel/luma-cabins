# Luma Cabins

A premium modular cabin website concept built with **Next.js**, **TypeScript**, **Tailwind CSS**, **Shadcn**, **Turborepo**, and **Vercel**.

Luma Cabins is a fictional European modular cabin brand offering pre-designed, high-performance cabins with curated customization and optional add-on modules. All client identities and testimonials are fictional and were created for this concept. The project demonstrates landing page strategy, premium visual direction, reusable frontend architecture, responsive implementation, and deployment-ready code.

## Concept

Luma Cabins offers compact modular cabins for slower living, weekend retreats, remote work, and simple sustainable living.

The brand focuses on:

* Premium modular cabins
* Calm nature-focused design
* Curated customization
* Optional add-on modules
* High-performance materials
* Solar-ready systems
* Low-waste prefabrication

## Tech Stack

* [Next.js](https://nextjs.org/)
* [React](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [shadcn/ui](https://ui.shadcn.com/)
* [Turborepo](https://turbo.build/repo)
* [pnpm](https://pnpm.io/)
* [Vercel](https://vercel.com/)
* ESLint
* Prettier

## Repository Structure

```txt
luma-cabins
├─ apps
│  └─ nextjs          # Main website app
├─ packages
│  └─ ui              # Shared UI package with shadcn/ui components and utilities
├─ tooling            # Shared ESLint, Prettier, Tailwind, and TypeScript configs
├─ package.json       # Root scripts and workspace setup
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Features

* Premium homepage-style website concept
* Hardcoded typed content
* Reusable component structure
* Shared UI package
* Responsive layouts
* Modular cabin model sections
* Add-on module presentation
* Sustainability and performance content
* Process / “How it works” section
* FAQ section
* Final conversion CTA
* Deployment-ready Vercel setup

## Planned Pages

The project starts with a homepage-style landing page, but is structured as a fuller fictional brand website.

Potential routes:

```txt
/
/models
/models/niva
/models/aster
/models/veyra
/how-it-works
/portfolio
/consultation
```

## Core Homepage Sections

The homepage is planned around these sections:

1. Hero with cinematic cabin-in-nature media
2. Cabin models
3. Modular system and customization
4. Why modular cabins
5. Selected cabin concepts / portfolio
6. Performance and sustainability
7. How it works
8. FAQ
9. Final CTA

## Cabin Models

The fictional product system includes three main cabin models.

### Niva

Compact loft cabin for focused escapes, solo retreats, and short weekend stays.

```txt
20 m² · Sleeping loft
```

### Aster

Compact studio retreat for weekend stays, couples, and quiet nature escapes.

```txt
39 m² · Studio
```

### Veyra

Larger one-bedroom hideaway for longer stays, hosting, remote work, and generous indoor-outdoor living.

```txt
56 m² · 1 Bedroom
```

## Add-on Modules

The current product direction includes optional add-ons, but they are not yet interactive homepage controls:

* Sauna package
* Plunge pool
* Deck lounge package

## Design Direction

The default visual direction is **light natural minimalism**:

* Warm whites
* Sand tones
* Timber colors
* Muted greens
* Soft grays
* Calm spacing
* Large imagery
* Minimal typography

Other visual directions may be explored during the design process:

* Dark cinematic luxury
* Editorial architecture
* Warm earthy lifestyle
* Product-system premium

## Content Strategy

The site uses hardcoded typed content instead of a CMS.

Possible content files:

```txt
src/data/models.ts
src/data/modules.ts
src/data/faqs.ts
src/data/process.ts
src/data/sustainability.ts
src/data/navigation.ts
```

The goal is to keep content structured, reusable, and easy to replace later if the project is expanded.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Build the project:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

Run linting:

```bash
pnpm lint
```

Fix lint issues:

```bash
pnpm lint:fix
```

Run type checking:

```bash
pnpm typecheck
```

Check formatting:

```bash
pnpm format
```

Fix formatting:

```bash
pnpm format:fix
```

Clean generated files and dependencies:

```bash
pnpm clean
```

## Workspace Scripts

The root workspace uses Turborepo to run tasks across apps and packages.

Main scripts:

```txt
pnpm dev         # Run development tasks
pnpm build       # Build all workspace projects
pnpm start       # Start production apps
pnpm lint        # Run ESLint
pnpm lint:fix    # Run ESLint with fixes
pnpm typecheck   # Run TypeScript checks
pnpm format      # Check formatting
pnpm format:fix  # Fix formatting
pnpm clean       # Remove generated files, caches, builds, and node_modules
```

## UI Package

Shared UI components and utilities live in:

```txt
packages/ui
```

The UI package exposes:

```txt
@workspace/ui/components/*
@workspace/ui/lib/*
@workspace/ui/hooks/*
```

This package is intended for reusable shadcn/ui-based components, shared hooks, and UI utilities used by the Next.js app.

## Deployment

The project is intended to be deployed on Vercel.

Suggested deployment flow:

1. Push the repository to GitHub
2. Import the project into Vercel
3. Select the Next.js app as the deployed app
4. Configure build settings if needed
5. Deploy the production branch
6. Use preview deployments for development branches

## Repository Description

Suggested GitHub repository description:

```txt
Premium modular cabin website concept built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Vercel.
```

## Status

Project planning and structure phase.

Next steps:

* Generate multiple visual directions
* Choose final design direction
* Build the homepage sections
* Add responsive behavior
* Optimize media
* Deploy to Vercel
