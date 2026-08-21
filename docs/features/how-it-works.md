# How It Works

## Status

Implemented after `InteriorComparisonSection` on the landing page. This document describes the current shipped behavior of the guided process section.

## Purpose

The section reduces uncertainty around buying a Luma cabin with a clear four-step path. It describes guided coordination rather than a turnkey construction promise. The descriptions and detail bullets are explicitly provisional content and must be reviewed against the final service scope before publication.

## Implementation Map

- `apps/nextjs/src/app/[locale]/(app)/page.tsx`
  - `AppHomePage` renders `HowItWorksSection` immediately after `InteriorComparisonSection` with `id="process"` and the `bg-background` surface.
- `apps/nextjs/src/app/[locale]/(app)/_data/process-steps.ts`
  - `createProcessSteps(locale)` is the typed four-step content factory.
  - The locale-aware factory resolves the final CTA through `contactLinkOptions(locale)` so it uses the canonical public contact route for the active locale.
  - Visible copy, media descriptions, timeline labels, dot labels, and live-region status text are resolved before entering the client experience.
  - `ProcessStep.copyStatus` marks every description and bullet set as provisional.
  - `ProcessStep.media` contains the media kind, MP4 source path, optional WebM and poster paths, accessible description, intrinsic dimensions, and placeholder flag.
- `apps/nextjs/src/app/[locale]/(app)/_components/how-it-works-section.tsx`
  - `HowItWorksSection` is the server-rendered section shell, anchor target, and left-aligned intro.
- `apps/nextjs/src/app/[locale]/(app)/_components/how-it-works-experience.tsx`
  - `HowItWorksExperience` is the narrow client boundary for browser geometry, timeline state, desktop media crossfades, and the mobile carousel.
  - `ProcessRail` renders the sticky timeline and survey-dot field.
  - `ProcessStepCopy` renders the shared tablet and desktop copy triggers.
  - `ProcessDesktopMedia` renders decorative stacked desktop media.
  - `ProcessMobileCard` renders the mobile card composition.
  - `apps/nextjs/public/images/process/` and `apps/nextjs/public/videos/process/`
    - Step 01 uses the current raster image, while steps 02, 03, and 04 use process video elements with poster frames and MP4 sources; WebM is selected when the configured source is available.

## Content Contract

The English heading is `How it works`, followed by `A guided path, start to finish.`; Polish renders the corresponding localized messages. The four semantic steps remain fixed in this order even though their visible labels and editorial headings vary by locale:

| Step | Timeline label      | Editorial heading                              |
| ---- | ------------------- | ---------------------------------------------- |
| 01   | Design yours        | Shape a cabin around the way you want to live. |
| 02   | Pick the spot       | Find the setting that makes it feel at home.   |
| 03   | Prepare together    | Bring the site and cabin plan together.        |
| 04   | Deliver and install | Watch your cabin take its place.               |

Only step 04 contains the `Get started` CTA. It links to `/contact` for English and `/pl/kontakt` for Polish. Body descriptions and bullets stay in the data returned by `createProcessSteps(locale)`; components do not duplicate or reinterpret that copy.

## Responsive Composition

- Below `768px`, the section uses a full-bleed shared Embla `Carousel`. The active card is centered at approximately 87% of the carousel viewport, leaving previous and next card peeks where neighboring steps exist.
- From `768px` through `1279px`, a 12-column grid uses a sticky four-column timeline and an eight-column scrolling copy column. Each step keeps natural height, has approximately 96px of separation, and orders its H3, paragraph, detail bullets, optional CTA, then 4:3 media.
- At `1280px` and wider, a 16-column grid uses a sticky four-column timeline, five-column scrolling copy, and seven-column sticky media frame. Each copy step occupies approximately one usable viewport.
- The intro is normal document content and scrolls away before the sticky experience begins.
- The section uses `container-page-2xl` for the intro and experience content, with only the mobile experience becoming full-bleed, and continues the `bg-background` surface without a contrasting band.

## Sticky Geometry

- From `768px` upward, the sticky rail and desktop media use `top: calc(var(--nav-height) + 0.5rem)` and `height: calc(100svh - var(--nav-height) - 0.5rem)` so the fixed navbar's 80px desktop/tablet box remains part of the geometry.
- Desktop media is centered vertically inside its sticky viewport, keeps a 4:3 frame, and is constrained to both available dimensions on short viewports.
- The grid height is owned by the scrolling copy column. This lets the sticky rail and media release naturally after the final step instead of continuing into the next landing-page content.
- Tablet does not create a third media column. Its images remain inside the corresponding copy step, so portrait and landscape layouts do not reserve desktop-only dead space.
- The section uses `scroll-mt-(--nav-height)` below `768px` and the effective desktop/tablet navbar height from `768px` upward, allowing the navbar `#process` link to reveal the heading below the fixed navbar.

## Scroll Activation And Progress

Scroll tracking is enabled only from `768px` upward. The client boundary stores refs to each step's natural-height content wrapper and tracks scroll direction with one passive scroll listener scheduled through `requestAnimationFrame`.

The natural-height content wrapper inside each step is measured against an activation band matching the Sanity reference: the vertical band spans 25% to 50% of the viewport. The outer step article still provides the desktop viewport-height section and top-scroll target; only its content wrapper participates in activation. During downward scrolling, the next content wrapper becomes active when it overlaps the band; during upward scrolling, the previous wrapper becomes active when its bottom re-enters the same band. This directional boundary avoids a switch at the first heading crossing and preserves delayed reverse-scroll behavior.

The filled connector is derived only from the active step index: `0` at step 01 and `1` at step 04, with equal marker-to-marker increments between them. Its top-origin scale transform animates over approximately 400ms when the active step changes and becomes immediate for reduced-motion users. This keeps the line and markers synchronized during both downward and upward scrolling.

## Timeline Buttons

The rail is an ordered list of real buttons. The active button exposes `aria-current="step"`; reached markers are filled, the active marker has an additional outer ring, and future markers remain outlined on the base background.

Activating a timeline button keeps focus on that button and smoothly scrolls its step wrapper to the top of the viewport. During normal motion, the intermediate content wrappers crossing the activation band own the active-step changes, so a distant click can transition through the steps in order. Reduced-motion users receive immediate scrolling and direct destination selection. The wrapper's `scroll-margin-top` preserves clearance below the fixed navbar. Individual step selection does not change the URL fragment or browser history.

The rail's upper half contains the four markers and filling connector. Its lower half contains a low-opacity primary-colored radial survey-dot field with a mask fade. The field is decorative and hidden from assistive technology.

## Desktop Media

The seven-column desktop media area stacks all four process media items in one 4:3 frame. Process video elements put WebM before MP4 when a WebM source is configured, allowing the browser to select the supported source and fall back to MP4 otherwise. Video posters match a representative frame from each video and remain visible until the first decoded frame is ready. Active and incoming layers crossfade through opacity over approximately 400ms; neither layer translates, scales, or fades through an empty frame. Reduced-motion preferences remove the transition and prevent process videos from autoplaying.

Desktop media is a decorative duplicate because the scrolling copy column already contains the same step media semantics. The desktop frame and its media therefore use `aria-hidden="true"`; tablet and mobile embedded media use the meaningful description returned by `createProcessSteps(locale)`.

Raster process media uses lazy loading until the process section is near the viewport, then the active step and its immediate neighbors load eagerly. Process videos use poster frames and `preload="auto"` for that same active-neighbor window, while playback remains active-step-only. The `unoptimized` flag remains available for placeholder media but is disabled for the final raster and video assets.

## Mobile Carousel

The mobile composition uses the shared `Carousel`, `CarouselContent`, and `CarouselItem` components with Embla options `align: 'center'`, `containScroll: false`, `loop: false`, and `dragFree: false`. This keeps the active card centered and exposes neighboring card peeks on both sides where available. Shared carousel keyboard arrow handling remains enabled even though visual arrows are intentionally omitted.

Cards use the shared shadcn Card composition and default card surface. They stretch to the tallest slide and order the full-width image with an overlaid number, followed by the short step-label H3, description, bullets, and optional CTA. The longer editorial H3 remains in the tablet and desktop copy column only. Mobile number circles use the primary surface for steps 01 and 04 and the default background surface for steps 02 and 03; the numbered circle has no connector line.

The mobile UI has no arrows, visible count, or carousel autoplay/loop. Pagination dots match the compact showcase treatment: labeled 8px buttons with an 8px gap, focus styling, and `aria-current="step"` on the active dot. This intentionally trades larger touch targets for compact spacing; card taps and keyboard arrow handling remain available. The active card and its immediate neighbors are prepared before they become the visible card and peek, while only the active video plays. Card content is non-selectable so mouse and touch drags do not highlight text; links, buttons, and pagination controls remain interactive. A non-active slide can be activated by tapping its visible partial card; links and buttons are excluded from that behavior. Local pointer-intent classification covers touch, pen, and mouse input, uses the same 10px threshold as Embla's `dragThreshold`, and suppresses classified drag clicks before a neighboring-card tap can run. Vertical page scrolling over the carousel remains available because pointer movement is classified without calling `preventDefault` during the gesture.

A visually hidden polite status announces only carousel selection changes, for example `Step 2 of 4: Pick the spot.`. Continuous page scrolling does not announce progress or active desktop/tablet step changes.

## Accessibility And Motion

- The section has a real H2 and the process timeline is an ordered list of real buttons.
- Timeline buttons expose active state through `aria-current="step"` and retain visible keyboard focus styles.
- Mobile dots are named with the step number and timeline label, expose active state through `aria-current="step"`, and retain keyboard focus styling despite their intentionally compact targets.
- The final CTA remains a normal keyboard-focusable `next/link` anchor.
- Meaningful tablet and mobile media use the data-module descriptions; decorative sticky desktop duplicates use empty image alt text or hidden video semantics with `aria-hidden`.
- The carousel's shared keyboard arrow behavior is preserved, while visual carousel arrows are not rendered.
- Automatic motion consists of the desktop 400ms opacity crossfade, the muted looping process video when motion is allowed, and the normal smooth scroll initiated by a timeline button.
- `usePrefersReducedMotion` switches media changes and programmatic timeline scrolling to immediate behavior and prevents video autoplay.
- No live region is used for scroll-linked desktop/tablet activation, preventing announcement spam.

## Placeholder Replacement Contract

Final raster and video process media should share one color grade, keep important subjects inside a central safe area, and preserve the intrinsic dimensions returned by `createProcessSteps(locale)`. Update each `media.alt` value with the final description and keep `isPlaceholder` false for final raster and video assets.

## Behavioral Invariants

- The navbar's existing `#process` link lands with the H2 below the fixed navbar.
- Step 01 and its media are active initially.
- The rail fill advances in equal marker-to-marker steps and reaches each marker when that step activates.
- Upward scrolling reverses markers, media, and line progress without a React per-frame loop.
- Sticky columns release after step 04.
- Tablet content remains readable without forced desktop media dead space.
- Mobile has a clear next-card peek without horizontal page overflow.
- Mobile dragging, neighboring-card taps, dots, keyboard arrows, and vertical page scrolling do not conflict.
- Mobile has no arrows, visible count, autoplay, or looping.
- Reduced-motion users receive immediate media and timeline-scroll changes.
- Media reserves stable 4:3 geometry and does not use head preloading; posters prevent blank video frames while active and neighboring media are prepared near the viewport.
- Focus styles, labels, `aria-current`, and the final CTA remain usable by keyboard.
- Scroll tracking uses one passive rAF path and does not continuously re-render React state.

## Verification Checklist

- Check `320`, `390`, `767`, `768`, `1024`, `1279`, `1280`, `1536`, and `1920px` widths.
- Check short tablet and desktop viewports around `600px` high.
- Activate the navbar `#process` link and verify the H2 is visible below the fixed navbar.
- Scroll down and up through all four H3 triggers and verify exact marker activation and continuous progress reversal.
- Activate every timeline button with pointer and keyboard input and verify focus stays on the button and the URL does not change.
- Verify sticky rail and media release after step 04.
- Verify mobile card dragging, partial-card tapping, dots, shared arrow keys, vertical scrolling, and CTA links.
- Verify no mobile arrows, visible count, autoplay, or looping appear.
- Verify reduced-motion media and timeline behavior.
- Verify no console errors, layout shift, horizontal page overflow, or continuous React re-render loop.
