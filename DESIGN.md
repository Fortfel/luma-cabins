---
name: Luma Cabins
description: Premium pre-designed cabins for quiet, refined escapes.
colors:
  primary: "oklch(0.369 0.043 127.676)"
  primary-foreground: "oklch(0.982 0.018 155.826)"
  warm-paper: "oklch(0.97 0.007 88.642)"
  paper-accent: "oklch(0.938 0.013 82.402)"
  deep-charcoal: "oklch(0.282 0.007 17.6)"
  ink: "oklch(0.205 0 0)"
  muted-ink: "oklch(0.556 0 0)"
  card: "oklch(1 0 0)"
  card-ink: "oklch(0.205 0 0)"
  secondary: "oklch(0.976 0.001 286.376)"
  secondary-ink: "oklch(0.261 0.011 300.787)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Cabinet Grotesk, sans-serif"
    fontSize: "clamp(2.625rem, calc(1.6964rem + 3.9621vw), 5.5rem)"
    fontWeight: 500
    lineHeight: 1
  headline:
    fontFamily: "Cabinet Grotesk, sans-serif"
    fontSize: "clamp(2rem, calc(1.596rem + 1.723vw), 3.25rem)"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Cabinet Grotesk, sans-serif"
    fontSize: "clamp(1.5rem, calc(1.2578rem + 1.0336vw), 2.25rem)"
    fontWeight: 500
    lineHeight: 1.15
  body:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "clamp(1rem, calc(0.8964rem + 0.442vw), 1.25rem)"
    fontWeight: 400
    lineHeight: 1.3
  label:
    fontFamily: "Satoshi, sans-serif"
    fontSize: "clamp(0.75rem, calc(0.6982rem + 0.221vw), 0.875rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.1875rem"
  mono:
    fontFamily: "JetBrains Mono Variable, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "8.4px"
  md: "11.2px"
  lg: "14px"
  xl: "19.6px"
  2xl: "25.2px"
  3xl: "30.8px"
  4xl: "36.4px"
spacing:
  page-gutter: "clamp(1.5rem, calc(0.55806rem + 4.30571vw), 4rem)"
  section-gutter: "clamp(2.5rem, calc(-0.5rem + 7.5vw), 5.5rem)"
  control-sm: "0.5rem"
  control-md: "0.75rem"
  control-lg: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.4xl}"
    padding: "0 1rem"
    height: "2.25rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.4xl}"
    padding: "0 1rem"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-ink}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"

---

# Design System: Luma Cabins

## Overview

**Creative North Star: "The Quiet Frame"**

Luma frames the cabin as the subject rather than treating it as a generic property listing. The system gives landscape, architecture, material, and human pace enough room to register, then uses precise type and compact controls to make the offer understandable. The result is light architectural calm: warm paper surfaces, a deep olive anchor, large image fields, and a confident but unforced reading rhythm.

The page is editorial without becoming precious and product-led without becoming technical. The visual system stays light and tactile, letting the shift between image, paper, and olive surfaces carry most of the hierarchy. Motion is purposeful and localized to model browsing, comparison, testimonials, and process guidance.

**Key Characteristics:**

- Image-led composition with spacious editorial framing
- Deep olive used as a decisive anchor rather than scattered decoration
- Cabinet Grotesk display hierarchy paired with Satoshi utility text
- Fluid gutters and type that preserve the same calm at phone and desktop widths
- Flat tonal surfaces with tactile controls and restrained blur

## Colors

The palette is named **Deep olive and warm paper**. It keeps the page light and natural while giving primary actions and hero surfaces enough gravity to feel architectural.

### Primary

- **Deep Olive:** The main brand anchor for the hero, primary actions, active states, and strong navigation contrast.
- **Primary Foreground:** The quiet light text used over deep olive surfaces.

### Secondary

- **Soft Secondary:** A pale neutral action surface for inverse or hero-adjacent controls.
- **Paper Accent:** A warmer tonal band used to separate editorial sections without hard dividers.

### Neutral

- **Warm Paper:** The default page ground and the breathing room around imagery.
- **Card White:** The clean surface for focused controls, testimonial cards, and dialogs.
- **Ink:** The primary text color for editorial headings and product information.
- **Muted Ink:** Supporting copy, descriptions, and low-emphasis metadata.
- **Hairline Border:** A quiet boundary for cards, selectors, and form controls.
- **Deep Charcoal:** A dark image-adjacent surface for media and fallback states.

### Named Rules

**The Paper-to-Image Rule.** Warm paper creates the pause around the image; do not cover a decisive photograph with layers of decorative color.

## Typography

**Display Font:** Cabinet Grotesk (with a sans-serif fallback)

**Body Font:** Satoshi (with a sans-serif fallback)

**Label/Mono Font:** Satoshi for tracked labels; JetBrains Mono Variable for technical metadata when a mono voice is needed.

**Character:** Cabinet Grotesk gives the system an architectural silhouette without becoming formal or institutional. Satoshi keeps descriptions, controls, and process content direct, warm, and easy to scan.

### Hierarchy

- **Display:** Medium-weight Cabinet Grotesk for the hero thesis and the largest editorial statements.
- **Headline:** Medium-weight Cabinet Grotesk for section and model titles that need a clear architectural presence.
- **Title:** Cabinet Grotesk for compact model names, cards, and supporting section hierarchy.
- **Body:** Regular Satoshi for descriptions, process copy, pricing notes, and supporting product information.
- **Label:** Bold, widely tracked Satoshi in uppercase for finish selectors, eyebrows, and compact navigation metadata.
- **Mono:** JetBrains Mono Variable only for technical or system-like metadata; never use it for primary storytelling.

### Named Rules

**The Two-Voice Rule.** Cabinet Grotesk carries the spatial idea; Satoshi carries the decision. Do not reverse their roles or add a third display family.

## Layout

The layout uses a fluid page gutter and a shared vertical section rhythm rather than a fixed desktop grid. Focused editorial content uses the 2xl page container, wide text and timelines use 3xl, and image-led media uses 4xl with controlled bleed.

The hero is a full-viewport media composition with content anchored low in the frame. Below it, sections alternate between centered editorial introductions, full-bleed cabin imagery, compact product controls, horizontal review movement, image comparison, and a guided process timeline. This variation creates pace without changing the visual language.

The page gutter interpolates from 24px at approximately 350px to 64px at 1280px. The section gutter interpolates from 40px at 640px to 88px at 1280px. Standard responsive composition uses the existing md, lg, xl, 3xl, and 4xl breakpoints, with 3xl at 1728px and 4xl at 1920px. Fixed navigation geometry is accounted for through `--nav-height` rather than duplicated offsets.

Full-bleed media remains edge-to-edge through 1919px. At the widest breakpoint it receives a small outer gutter and a soft rounded frame. Mobile layouts preserve the emotional image scale first, then stack product information and controls into a clear reading order.

## Elevation & Depth

The system is **flat by default**. Depth comes from the contrast between warm paper, card white, deep olive, image fields, and hairline borders. Shadows stay ambient and low, appearing only where a card, popover, or dialog needs separation. Backdrop blur is reserved for transparent navigation and image controls where it protects legibility without turning the page into glassmorphism.

### Shadow Vocabulary

- **Ambient Low:** A barely-there lift for compact cards and testimonial surfaces.
- **Overlay Separation:** A stronger but still soft shadow for dialogs and expanded review content.
- **No Resting Drama:** Do not use large shadows, glows, or elevation stacks to manufacture hierarchy.

### Named Rules

**The Flat-by-Default Rule.** A surface should first earn its hierarchy through space, color, and type. Add a shadow only when the surface is transient or must separate from content beneath it.

## Shapes

Primary actions and compact controls use a generous pill silhouette. Cards use restrained rounded corners, while large media receives rounded framing only when it is no longer intentionally full-bleed. Borders are thin and quiet, never ornamental. Image crops are confident and rectangular first; corner treatment should not compete with the cabin or landscape.

## Components

### Buttons

Buttons are tactile and quietly confident. The primary button uses deep olive with light text and a generous pill radius. The secondary button uses a pale neutral surface, keeping the same silhouette while lowering contrast. Hover changes color or opacity, not geometry. Focus uses a visible ring and border treatment that remains legible against both paper and olive surfaces.

### Cards / Containers

Cards use card white, restrained borders, and the small ambient shadow vocabulary. Testimonial cards remain compact and text-led. Configuration panels may hold multiple controls, but the container should stay a single calm surface rather than a stack of nested boxes.

### Inputs / Fields

The current finish selectors are swatch-style radio controls. The native radio remains the semantic input while the visible label carries the swatch, name, selected ring, and focus treatment. Selected state uses the deep olive ring; labels remain readable at every breakpoint.

### Navigation

Navigation begins transparent over the hero and transitions to foreground text as the page scrolls. The logo stays the primary identity marker. Desktop links are quiet and widely spaced, while the Get Started action is the clear right-side conversion point. Mobile navigation collapses into the existing sheet pattern and must retain the same text hierarchy.

### Signature Components

The cabin model carousel, interactive showcase, interior comparison reveal, testimonial morph, and guided process timeline are the system's signature patterns. Each uses motion to clarify a product choice or a step in the journey, not to add ambient novelty.

## Do's and Don'ts

### Do:

- **Do** let one strong cabin or landscape image own a section before adding supporting UI.
- **Do** use deep olive for decisive anchors: hero surfaces, primary actions, active states, and selected controls.
- **Do** keep type fluid and preserve the display/body role split across responsive widths.
- **Do** use the existing page containers, gutters, and media-bleed conventions before adding local geometry.
- **Do** preserve keyboard access, reduced-motion behavior, meaningful media descriptions, and touch scrolling.
- **Do** make model facts, finish options, and process steps easy to scan before asking for contact.

### Don't:

- **Don't** turn the page into a SaaS dashboard, feature grid, or prefab catalog.
- **Don't** use dark mode, neon accents, glass-heavy surfaces, or generic gradient decoration as a new visual layer.
- **Don't** over-rusticize the brand into survivalist, homesteading, or rough handmade cabin language.
- **Don't** add large shadows, nested cards, or rounded containers without a structural reason.
- **Don't** replace fictional testimonials, provisional prices, or provisional process copy with invented proof.
- **Don't** introduce a new font family or semantic color outside the established token system without an explicit visual-system decision.
