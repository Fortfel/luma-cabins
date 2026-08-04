# Models Overview

## Status

Implemented on the landing page. This document describes current carousel and autoplay behavior.

## Implementation Map

- `apps/nextjs/src/app/(app)/_components/models-overview-section.tsx`
- `ModelsOverviewSection`: carousel state, visibility gating, autoplay controls, gesture intent, and responsive composition.
- `DesktopClickZone`: large previous and next controls used when drag navigation is disabled on desktop.
- `CabinThumbnail`: direct model navigation and active autoplay progress.
- `packages/ui/src/components/carousel.tsx`
- Shared Embla carousel composition and navigation primitives.

## Autoplay

- Slides advance every `4000ms` while at least `35%` of the carousel is visible.
- Autoplay remains disabled when reduced motion is requested.
- The play/pause control creates an explicit pause that persists when the carousel leaves and re-enters the viewport.
- A navigation interaction pauses autoplay while the carousel remains in view. Leaving the viewport clears that interaction pause, so autoplay may resume when the carousel returns.
- The active thumbnail displays the current autoplay cycle.
- `ModelsOverviewSection` owns the autoplay timer and persistent pause state. Embla only owns carousel movement, so raw pointer contact cannot restart or delay autoplay.
- Hiding the browser document suspends autoplay; returning starts a new cycle.

## Interaction

- Mobile and tablet drag navigation is enabled below `1024px`; desktop uses click zones instead.
- Pointer movement waits for an `8px` intent threshold, matching the interior comparison gesture model.
- Horizontal intent stops autoplay and hands slide movement to Embla.
- Equal or greater vertical movement is classified as page scrolling and does not alter autoplay timing or progress.
- A tap released before the threshold is inert and does not alter autoplay timing or progress.
- Previous, next, desktop click-zone, and thumbnail activation stop autoplay because they deliberately navigate the carousel.
- Keyboard and non-autoplay-control focus interaction stop autoplay.

## Accessibility

- The carousel, slides, navigation buttons, and play/pause control expose descriptive labels.
- The selected model is announced through a polite live region.
- Reduced-motion users cannot start autoplay.
- Focus entering carousel controls prevents an automatic slide change during keyboard interaction.

## Invariants

- Vertical page scrolling over the carousel must not pause, restart, or delay the autoplay cycle.
- Tapping non-interactive slide content must not pause, restart, or delay the autoplay cycle.
- Horizontal dragging and deliberate carousel navigation must stop autoplay.
- Explicit pause must survive viewport exit and re-entry.
- A paused carousel must remain paused after pointer interaction.

## Verification Checklist

- On touch widths, vertically scroll from the image and confirm autoplay timing and progress continue without resetting.
- Tap the image without moving and confirm autoplay timing and progress continue without resetting.
- Swipe horizontally and confirm the slide changes and autoplay remains paused.
- Activate thumbnails, previous/next controls, and desktop click zones and confirm autoplay pauses.
- Pause explicitly, drag or tap the carousel, and confirm it does not restart.
- Verify keyboard focus and navigation pause autoplay.
- Verify leaving and returning clears interaction pause but preserves explicit pause.
- Verify reduced motion prevents autoplay.
