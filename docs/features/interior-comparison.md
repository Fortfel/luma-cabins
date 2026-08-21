# Interior Comparison

## Status

Implemented after testimonials on the landing page. This document describes current shipped behavior.

## Purpose

The section presents two inspirational directions for the same cabin interior. Focus pairs a workspace-led layout with light oak. Unwind pairs a lounge-led layout with dark-walnut storage. These are design ideas, not purchasable packages.

## Implementation Map

- `apps/nextjs/src/app/[locale]/(app)/_components/interior-comparison-section.tsx`
- `InteriorComparisonSection`: server-rendered section, editorial intro, image content, accessible direction labels, and responsive media frame.
- `apps/nextjs/src/app/[locale]/(app)/_components/interior-comparison-slider.tsx`
- `InteriorComparisonSlider`: app-local client adapter for localized range naming and dynamic value text.
- `packages/ui/src/components/image-comparison.tsx`
- `ImageComparison`: shared client-side root and range state provider.
- `ImageComparisonLeft` and `ImageComparisonRight`: clipped foreground and full-size base layer slots.
- `ImageComparisonSlider`, `ImageComparisonDivider`, and `ImageComparisonHandle`: semantic input and synchronized visual controls.
- `ImageComparisonLabel`: passive overlay slot that remains inside its corresponding layer.

## Shared Component Contract

The shared primitive follows the repository's shadcn-style compound component pattern. It owns comparison behavior and visual controls but does not depend on Next.js or render images itself. Consumers compose their image implementation inside `ImageComparisonLeft` and `ImageComparisonRight`.

The root accepts normal `div` props and an optional `defaultValue`. Named parts validate that they are rendered within the root, expose `data-slot` attributes, merge `className`, and forward their normal element props.

`ImageComparisonSlider` receives a value-text formatter rather than constructing prose. Because functions cannot cross a React server/client boundary, the app-local `InteriorComparisonSlider` receives translated endpoint and accessible-name strings, then formats dynamic percentages with its explicit locale and Paraglide message. The shared primitive remains independent of application messages and locale state.

## Layering Model

Unwind fills the frame as the base layer. Focus fills an identically sized layer above it and is revealed with a right-side `clip-path` inset. Both `next/image` elements use `fill`, `object-cover`, centered object positioning, and the same responsive `sizes` value.

The Focus image is never resized to create the reveal. Continuous position state drives the clip edge, full-height divider, and handle from one shared percentage. This preserves each image's crop and keeps aligned structural edges stable while dragging.

## Interaction

A transparent pointer surface covers the full image while a semantic `input[type='range']` retains focus, keyboard, and screen-reader behavior.

- Initial value for this section is `56`.
- Clicking, tapping, or dragging calculates a continuous `0` through `100` value from the exact horizontal pointer coordinate without rounding.
- Touch movement waits for an `8px` intent threshold. Horizontal intent controls the comparison; equal or greater vertical movement leaves the value unchanged and allows page scrolling.
- A touch released before crossing the intent threshold is treated as a tap at the release coordinate.
- Completing a pointer interaction leaves the semantic range focused, so arrow, Home, and End keys work immediately without an extra Tab press.
- Horizontal pointer movement controls the range without easing or release animation.
- `touch-action: pan-y` preserves vertical page scrolling over the comparison.
- Arrow keys apply deliberate one-percentage-point increments from the current position.
- Home and End set exact `0` and `100` values for complete Unwind and Focus views.
- Accessible value text rounds only the announced percentages; visual state retains full pointer precision.
- State remains local and survives scrolling and resizing while the component stays mounted.
- Images disable native dragging, and the frame disables text selection.
- Clipped layer, divider, and handle use no CSS transition, easing, or smoothing.

At endpoints, the fully white 4px divider reaches the true image boundary. Only the 48px visual handle is clamped inside the frame to prevent horizontal overflow.

## Responsive Layout

- Below `md`: media is edge-to-edge with a `3:2` aspect ratio.
- From `md` through `lg`: media is edge-to-edge with a `16:9` aspect ratio.
- Through `1919px`, the media remains edge-to-edge and follows the viewport width.
- At `4xl`, the section adds `16px` horizontal media gutters and the frame gains rounded corners.
- As the viewport grows, the `container-page-4xl container-bleed` frame reaches its `1920px` cap and then centers naturally.
- Intro text uses the default minimum gutter built into `container-page-2xl`.
- At `md`, heading and description become a bottom-aligned two-column row; smaller widths stack both blocks.

The responsive `sizes` value matches `ModelsOverviewSection`: full viewport width through `1919px`, then `1920px` as the media-width upper bound.

## Accessibility

- Focus image description precedes Unwind in DOM reading order.
- Range accessible name identifies both interior directions.
- Dynamic value text reports each direction's percentage and uses clear full-reveal endpoint text.
- No live region announces drag updates.
- Pointer interaction focuses the semantic range for immediate keyboard use without showing a focus ring.
- Tab focus and slider keyboard commands show a high-contrast ring on the circular handle; blur removes it.
- Handle chevrons and passive corner labels are hidden from assistive technology and never enter tab order.
- Operation does not depend on hover, animation, or a second mobile control.

## Image Loading

Both images use Next.js image optimization and normal lazy loading. Responsive aspect-ratio containers reserve layout before image load. Neither image is preloaded, and no separate mobile source is generated.

## Invariants

- Focus remains left and Unwind remains right.
- Focus maps to Light oak; Unwind maps to Dark walnut.
- Both source assets must have identical dimensions, camera framing, and canvas position.
- Structural edges, especially central doors, must not drift during reveal.
- Both rendered images must retain identical dimensions, `object-cover`, and centered object position.
- Reveal must use clipping rather than image width changes.
- Vertical touch scrolling must remain available.
- Semantic value may reach `0` and `100`; only visual handle position may be clamped.
- Shared compound parts must remain image-renderer agnostic; Next.js image behavior belongs to the app composition.
- Divider remains fully white and 4px wide.
- No automatic motion, storage persistence, CTA, or alternate mobile interaction may be added.

## Known Risks

- Browser range gesture behavior must continue respecting `touch-action: pan-y`; verify after browser or CSS changes.
- Endpoint handle clamping must not be reused for reveal math, or complete image states will regress.
- Source image edits can introduce visible jitter even when component geometry remains correct.

## Verification Checklist

- Confirm initial reveal is exactly `56/44`.
- Click, tap, and drag through multiple positions, including `0` and `100`.
- Verify mouse, pen, horizontal touch, vertical touch scrolling, arrows, Home, and End.
- Confirm value remains after scrolling away, returning, and resizing.
- Verify visible keyboard focus over both images.
- Confirm labels clip with their corresponding image.
- Check for horizontal overflow at both endpoints.
- Compare doors and wall edges throughout the full range for drift.
- Check `320px`, `360px`, `430px`, `768px`, `1024px`, `1280px`, `1536px`, and `1920px` widths.
- Confirm mobile text stays padded while media reaches viewport edges.
- Confirm ratios, desktop rounding, lazy image loading, and absence of layout shift.
- Confirm no console errors or automatic motion.
