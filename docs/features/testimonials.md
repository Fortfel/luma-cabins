# Testimonials

## Status

Implemented on the landing page. This document describes current behavior rather than planned work.

## Purpose

The testimonials section presents a continuously moving carousel of compact review cards. Selecting a card first moves it away from a faded carousel edge when necessary, then morphs the same visual frame into an expanded, scrollable review.

The interaction should preserve a clear visual connection between the source card and expanded review without distorting the card border, duplicating the card during collapse, or placing content under the fixed navbar.

## Implementation Map

- `apps/nextjs/src/app/(app)/_components/testimonials-section.tsx`
- `TestimonialsSection`: carousel state, auto-scroll coordination, active testimonial, and Popover lifecycle.
- `TestimonialCard`: compact source card and Popover trigger.
- `TestimonialFooter`: fictional client identity and compact-to-expanded footer transition.
- `TestimonialPopover`: measurement, shared-frame animation, review scrolling, and page-scroll dismissal.
- `getNearestEdgeScrollDistance`: horizontal fade-safe positioning.
- `getVerticalViewportPositionAdjustment`: vertical safe-area positioning.
- `scrollSlideToNearestEdge`: version-sensitive Embla distance scrolling.
- `packages/ui/src/components/popover.tsx`
- `PopoverContent`: exposes Base UI's optional `collisionAvoidance` positioner prop.

## Interaction Lifecycle

| Phase         | Behavior                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Closed        | Carousel may auto-scroll when visible and not being interacted with.                                   |
| Repositioning | A card inside a faded edge zone moves horizontally into the safe area before opening.                  |
| Measuring     | Expanded content height and current trigger geometry are measured while the overlay remains hidden.    |
| Prepared      | Collapsed text offsets and position are committed before the overlay replaces the visible source card. |
| Opening       | The prepared overlay shell expands and repositions on the following animation frame.                   |
| Open          | Review scrolling, Escape, backdrop dismissal, and page-scroll dismissal are enabled.                   |
| Closing       | Review resets, overlay returns to the current trigger position, and source card remains hidden.        |
| Closed again  | Overlay unmounts, source card reappears, and eligible auto-scroll may resume.                          |

## Carousel Behavior

The carousel uses Embla with the shared `AutoScroll` plugin.

- Auto-scroll starts only when the carousel intersects the viewport.
- Auto-scroll stops for reduced-motion users.
- Auto-scroll stops during mouse hover, keyboard focus, pointer interaction, card repositioning, or an open Popover.
- Carousel hover state is reconciled after the Popover unmounts because its full-screen backdrop can consume the browser's normal `mouseenter` and `mouseleave` sequence.
- Embla auto-scroll eligibility is reapplied after `reInit`, including automatic reinitialization caused by window resizing.
- Desktop dragging is disabled; mobile dragging remains enabled.
- Selecting a partially faded card stops auto-scroll and moves the card into a safe horizontal area before expansion.
- Mobile uses a `12px` edge inset.
- Viewports at `768px` and wider use a `92px` inset, covering the `80px` visual fade plus a `12px` buffer.
- Repositioning uses Embla duration `14` and begins opening as soon as measured geometry reaches its target.
- A `600ms` fallback prevents a missed Embla `settle` event from blocking the Popover indefinitely.

`scrollSlideToNearestEdge` uses Embla's private `internalEngine()` because Embla has no public distance-scrolling API. Keep this access isolated and verify it after Embla upgrades.

## Shared-Frame Animation

The compact source card is not stretched with `scaleY`. Scaling distorted the border radius, border thickness, shadow, and text movement.

Instead, the expanded overlay keeps a full-height content layout while animating a separate visual shell using its real height:

- Shell height morphs between compact and expanded card heights.
- Quote and attribution remain visible throughout the transition.
- Compact footers show a generated fictional portrait, rating, and plus affordance; expanded footers reveal the fictional client name, move the rating right, and hide the plus.
- Quote moves from its compact position toward the expanded header position.
- Attribution and rating move in the opposite direction toward the expanded footer position.
- Full review fades and moves into place after the frame begins opening.
- Scrollbar interaction stays disabled until expansion completes.
- A preparation frame applies measured geometry and compact text offsets while hidden, preventing transformed text from painting ahead of the height-animated shell.

Current timing values:

- Opening geometry: `480ms`.
- Opening reposition: `280ms`.
- Review reveal: `180ms` after a `140ms` delay.
- Closing geometry: `420ms`.
- Geometry easing: `[0.22, 1, 0.36, 1]`.

Reduced motion changes these transitions to zero duration.

## Positioning

### Horizontal

Cards inside the carousel fade zones move to the nearest safe edge before opening. The Popover remains horizontally anchored to its active trigger.

### Vertical

Vertical placement is calculated from current trigger bounds and the measured height of the active review. It does not depend on the Popover's previous position or another testimonial's height.

- Top safe edge is the measured bottom of `[data-slot="navbar-wrapper"]` plus `30px`.
- Bottom safe edge is the visual viewport bottom minus `30px`.
- If a Popover is taller than the available safe area, it is centered within that area.
- Long and short reviews are measured independently whenever the active testimonial changes.

Base UI's automatic collision shifting and flipping are disabled for this Popover. The feature owns vertical correction, and allowing both systems to reposition the same overlay caused disappearing cards and inconsistent placement after switching between review heights.

`PopoverContent` only forwards the optional `collisionAvoidance` prop. Its default remains unchanged for every other shared Popover.

## Closing Behavior

Closing can begin from:

- Escape through Base UI Popover behavior.
- Clicking the transparent full-screen backdrop.
- Base UI dismissal events.
- Scrolling the page after expansion completes.

Scrolling inside the testimonial `ScrollArea` does not close the Popover. A captured scroll listener ignores events whose target belongs to the active popup.

Page-scroll dismissal currently uses the full shrink animation. If this feels too slow during testing, page-scroll dismissal can later receive a shorter closing transition without changing other close paths.

The source card remains hidden for the full closing animation. After Motion reports completion, unmount waits one animation frame so the exact collapsed shell geometry can paint before `onCollapseComplete` reveals the source card. This prevents both duplicate-card overlap and a one-frame size jump.

The review viewport resets to the top when closing starts, ensuring that quote and body content return through the expected compact-card geometry.

## Accessibility

- Each compact card is a labeled Popover trigger.
- Trigger labels identify the fictional client whose full testimonial will open.
- Source cards expose testimonial position through screen-reader-only text.
- Expanded content uses Popover title and description semantics.
- Escape closes the expanded testimonial.
- Focus-visible styles remain available on source cards.
- Reduced-motion preference removes animation durations and disables carousel auto-scroll.
- Rating stars expose a single accessible rating label while individual icons remain hidden.
- Avatar portraits and initials are decorative; every portrait retains initials as its loading and error fallback, while the client name remains available in the footer content.
- Internal review scrolling remains usable without triggering page-scroll dismissal.

## Invariants

Future changes should preserve these rules:

- Only one testimonial can be expanded at a time.
- Auto-scroll must remain stopped while repositioning or expanded.
- Auto-scroll must remain stopped after closing when the pointer is still over the carousel.
- A source card must remain visible until its measured overlay is ready.
- Opening must not begin until collapsed overlay geometry has completed a hidden preparation frame.
- Footer identity and rating transitions must preserve the compact card's height and source-to-overlay alignment.
- A source card must remain hidden until collapse completes.
- Internal review scrolling must not dismiss the Popover.
- Page scrolling must dismiss the fully opened Popover.
- Popup geometry must use the active review's current measured height.
- Expanded content must remain below the fixed navbar and above the viewport bottom inset.
- Horizontal repositioning must account for responsive carousel fade widths.
- Reduced-motion behavior must avoid animated delays.

## Known Risks

- Embla `internalEngine()` is private and may change during dependency upgrades.
- DOM measurement requires the source trigger to remain mounted, even while visually hidden.
- Positioning assumes the navbar can be found through `[data-slot="navbar-wrapper"]`.
- A shadcn update may overwrite the small `PopoverContent` pass-through for `collisionAvoidance`; review generated component diffs during updates.
- Page-scroll dismissal follows the full closing duration and may need separate timing after user testing.

## Concept Content

Client names, initials, ratings, and testimonials are fictional portfolio content. The repository `README.md` discloses this explicitly. Replace this content with verified client material if the concept is ever adapted for a commercial site.

## Verification Checklist

- Open a card already inside the horizontal safe area.
- Open cards partially hidden by left and right fade zones at mobile and desktop widths.
- Open cards with only their top or bottom edge visible in the viewport.
- Verify top placement below both scrolled and unscrolled navbar states.
- Open a long review, close it, then open a short review without refreshing.
- Repeat the previous sequence in reverse order.
- Rapidly open and close different cards and verify text never paints ahead of the card shell.
- Resize the viewport while auto-scroll is eligible and verify movement resumes after Embla reinitializes.
- Scroll a long review internally and verify the Popover remains open.
- Scroll the page and verify the Popover runs its closing animation.
- Verify the source card appears only after collapse completes.
- Close with Escape and backdrop click.
- Verify behavior with reduced motion enabled.
- Confirm no browser console errors during opening, scrolling, switching, or closing.

## Decision History

- July 2026: replaced vertical scaling with a real border-box height morph to avoid shell distortion.
- July 2026: added fade-safe horizontal repositioning before expansion.
- July 2026: moved vertical correction to deterministic trigger-based geometry and disabled competing Base UI collision correction.
- July 2026: kept source cards hidden through collapse to prevent duplicate-card overlap.
- July 2026: made page scrolling trigger the existing full closing animation while preserving internal review scrolling.
- July 2026: added a hidden preparation frame before opening to prevent intermittent text-first paint races.
- July 2026: added fictional client identities and an Avatar-based footer morph to clarify card expandability.
