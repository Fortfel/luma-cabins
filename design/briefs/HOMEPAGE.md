# Luma Cabins — Homepage Design Brief

## Project Overview

Design a premium homepage for **Luma Cabins**, a European-inspired pre-designed cabin brand.

The homepage should present Luma Cabins as a refined, calm, nature-focused brand offering premium cabin models with curated customization options.

The page should feel like a complete homepage for a real cabin brand, with a clear structure, strong visual direction, practical product information, and a calm conversion flow.

## Current Implementation Status

This brief is aligned to the homepage currently rendered by `apps/nextjs/src/app/(app)/page.tsx`. The shipped route currently contains seven sections: Hero, About, Models Overview, Interactive Showcase, Testimonials, Interior Comparison, and How It Works. Cabins in Context, Benefits, FAQ, a final CTA, and a footer remain future expansion directions rather than rendered homepage sections.

The current page is still a static concept with hardcoded typed content. The `/contact` destination exists as a shell, and the `Models` and `FAQ` navigation fragments do not currently resolve to rendered section IDs.

---

## Brand

### Name

**Luma Cabins**

### Category

Premium pre-designed cabins.

### Region Feel

European premium cabin brand, suitable for forests, lakes, mountains, and rural plots across Europe.

The brand should not feel tied too strongly to one specific country or legal region.

Avoid unsupported permit or delivery promises. The current starting prices are provisional concept content and are documented in the current showcase section below.

---

## Brand Tone

The tone should feel:

- Calm
- Minimal
- Premium
- Nature-focused
- Warm
- Quietly confident
- Architectural but not cold
- Sustainable but not preachy
- Refined and human

The brand should feel premium and considered, but still approachable.

---

## Anti-Goals

The page should not feel like:

- Cheap tiny-house content
- Survivalist or prepper off-grid housing
- Generic real estate development
- A cold corporate architecture firm
- A tech-startup SaaS website
- Mass-market prefab housing
- Overly rustic cabin branding
- Fake award-winning studio content

---

## Audience

### Primary Audience

Design-conscious city professionals, couples, or small families who want a compact premium weekend retreat in nature.

They are likely interested in:

- Escaping city life
- Spending weekends in nature
- Owning a calm second place
- Avoiding the complexity of a fully custom build
- Getting a beautiful, low-maintenance cabin

### Secondary Audience

People interested in simpler living, remote work, slower living, or optional off-grid capability.

This can include people who want a compact home for a more intentional lifestyle, but the brand should not feel like survivalist off-grid housing.

---

## Audience Values

The audience cares about:

- Premium design
- Nature
- Simplicity
- Sustainability
- Low maintenance
- Clear process
- Quality materials
- Energy performance
- A calmer lifestyle
- Avoiding complicated custom construction

---

## Offer

Luma Cabins offers **pre-designed cabin models** with **curated customization** and **optional add-ons**.

The offer is closer to a premium pre-designed cabin product than a traditional architecture agency.

### Core Offer

Choose a cabin model, customize selected finishes and systems, add optional enhancements, prepare the site, then install.

### What It Is

- Pre-designed cabin models
- Curated customization
- Optional add-ons
- High-performance compact homes
- Premium retreat spaces
- Solar-ready by default
- Optional off-grid packages

### What It Is Not

- Fully custom architecture
- Cheap tiny homes
- Survival cabins
- Generic prefab catalog
- Mass-market housing product

---

## Cabin Models

The homepage should introduce three core models.

### Niva

Compact loft cabin.

```txt
20 m² · Sleeping loft
```

Use case:

Focused escapes, solo retreats, and short weekend stays.

### Aster

Compact studio retreat.

```txt
39 m² · Studio
```

Use case:

Weekend stays, couples, and quiet nature escapes.

### Veyra

Larger one-bedroom hideaway.

```txt
56 m² · 1 Bedroom
```

Use case:

Longer stays, hosting, remote work, and generous indoor-outdoor living.

---

## Product Options And Add-ons

The current interactive showcase exposes these finish choices:

- Exterior: Timber, Charred wood, Oyster
- Interior palette: Light oak, Warm ash, Dark walnut
- Floor plan view for the active model

Exterior finish changes currently update the visible cabin imagery. Interior palette selectors are present in the control panel, but the current implementation does not map them to a separate visible image.

The following add-ons remain product direction and are not currently surfaced in the homepage UI:

- Sauna package
- Plunge pool
- Deck lounge package

Add-ons should feel like part of the cabin offer, not a separate top-level product category.

---

## Customization

Customization should feel curated, not unlimited.

### Principle

The core architecture stays fixed. Clients customize finishes, energy setup, and selected add-ons.

This supports the brand promise of a faster, simpler, higher-quality pre-designed cabin process without the complexity of a fully custom build.

### Current Showcase Options

Exterior finish:

- Timber
- Charred wood
- Oyster

Interior palette:

- Light oak
- Warm ash
- Dark walnut

Energy setup:

- Grid-ready
- Solar-ready
- Optional off-grid package

Add-ons:

- Sauna package
- Plunge pool
- Deck lounge package

Energy setup and add-ons are product direction only; they are not currently selectable in the homepage showcase.

---

## Sustainability and Performance

Sustainability claims should be credible and specific.

Use claims like:

- Compact footprint
- High-performance insulation
- Responsibly sourced timber
- Low-waste prefabrication
- Solar-ready energy setup
- Durable, repairable material choices

Avoid overclaims like:

- Carbon neutral
- Zero impact
- 100% sustainable
- Fully off-grid by default

---

## Off-Grid Positioning

Solar-ready by default, off-grid optional.

The cabins are designed for efficient everyday comfort, with optional packages for remote plots, solar energy, water storage, and greater independence.

The page should not feel like survivalist or prepper off-grid housing.

---

## Current CTA Hierarchy

The current page uses this journey:

1. Start from `Get Started` in the hero or navbar
2. Review a model and its options
3. Use `Explore {model}` or `Get started` to reach `/contact`; use `View floor plan` for a local model detail view

### Current Primary CTA

`Get Started`, linking to `/contact`.

The homepage does not currently render a separate “Explore models” hero CTA or a consultation booking flow.

### Current Model CTA

`Explore {model}`, linking to the contact page from the active showcase model.

---

## Current Navigation

The current navigation renders these labels:

```txt
Models
How it works
Portfolio
FAQ
[Get Started]
```

Current destinations:

- `Models` points to `#models`, but no matching section ID is currently rendered.
- `How it works` points to the rendered `#process` section.
- `Portfolio` points to `/about`, which is currently a project shell.
- `FAQ` points to `#faqs`, but no FAQ section is currently rendered.
- `Get Started` points to `/contact`, which is currently a contact-page shell.

The mobile menu also exposes `Contact`, and the desktop navigation still includes the placeholder EN/PL language switcher.

### Product Direction Notes

Add-ons do not need to be a top-level nav item. Pricing does not need to be in the homepage navigation. The page can evolve into a fuller brand site as the unresolved routes and section anchors become real.

Possible future routes:

```txt
/models
/models/niva
/models/aster
/models/veyra
/how-it-works
/portfolio
/consultation
```

---

# Homepage Structure

## 1. Hero

### Purpose

Sell the feeling first.

The hero should communicate:

- Pre-designed cabins
- Slower living
- Nature retreat
- Compact high-performance homes
- Sustainable footprint
- Premium simplicity

### Hero Media

Use cinematic video footage or a strong image showing cabins in nature.

Video direction:

- Slow camera movement
- Morning or evening light
- Exterior cabin shots
- Forest, lake, or mountain surroundings
- Maybe a few interior glimpses
- Calm, premium, atmospheric feeling

### Hero Content

The current hero includes:

- Headline: `Live closer to what matters`
- Supporting text: `Premium pre-designed cabins, designed to help you slow down, reconnect, and feel at home - anywhere.`
- One `Get Started` CTA linking to `/contact`
- Four benefit callouts on large screens: Precision Built, Delivered & Installed, Designed to Last, and Made to Belong
- A compact benefit line on smaller screens

The hero uses a looping background video with a static image fallback and a visible play/pause control. Reduced-motion behavior is part of the implementation.

### Current Hero CTA

Primary:

```txt
Get Started
```

---

## 2. About / Brand Story

### Purpose

Introduce the brand and explain the core promise.

This section should communicate that Luma Cabins offers a simpler path to owning a beautiful retreat in nature through premium pre-designed models and curated choices.

### Direction

Keep this section short and clear. It should not feel like a long company story.

### Current Implementation

The shipped section uses the eyebrow `Our approach`, the heading `A simpler path to a quiet retreat.`, and one centered paragraph. It is a text-only editorial introduction with no image or CTA.

### Possible Themes

- Calm retreat
- Simpler path than custom building
- Thoughtful design
- Premium compact living
- Nature-focused lifestyle
- Curated, not complicated

### Current Copy

```txt
We design secluded luxury retreats for unforgettable stays in nature. Each cabin combines refined architecture, warm natural materials, panoramic views, and premium comforts for a peaceful escape without compromise. Slow down, reconnect, and experience the calm of modern cabin living.
```

---

## 3. Cabin Models Overview

### Purpose

Introduce the three core cabin models quickly and visually.

### Must Include

- Niva
- Aster
- Veyra
- Current specs: `20 m² · Sleeping loft`, `39 m² · Studio`, and `56 m² · 1 Bedroom`
- Image-led model navigation

### Current Composition

The shipped section is a full-width carousel with one large image per model. The active model name and specs sit over the image, with model thumbnails, responsive previous/next controls, and a play/pause control for the four-second autoplay cycle. Dragging is enabled below the desktop breakpoint.

### Notes

This section gives users a fast visual overview of the product range. It does not show prices or use-case descriptions; pricing and the richer model summary live in the Interactive Model Showcase.

The current overview order is Niva, Aster, Veyra.

---

## 4. Interactive Model Showcase

### Purpose

Make the cabin offer feel premium, clear, and interactive.

This should be one of the strongest sections on the homepage.

### Core Idea

A large interactive product showcase where the user can browse cabin models and see the content update.

### Current Composition

Left side:

- Current model name
- Current specs and description
- Exterior finish options: Timber, Charred wood, Oyster
- Interior palette options: Light oak, Warm ash, Dark walnut
- Starting price plus installation note
- `Explore {model}` CTA to `/contact`
- `View floor plan` dialog trigger

Right side:

- Large exterior image or render for each cabin
- Partial previews of neighboring cabins during carousel movement
- Responsive arrows, dots, or thumbnails depending on viewport
- Exterior image updates when the finish changes
- Floor plan dialog for the active cabin

### Current Interactions

- Switch exterior finish
- Switch interior palette
- Toggle floor plan
- Move to next model

The showcase is a polished product preview, not a full configurator. Energy setup and add-ons are not currently interactive homepage controls.

### Important

This is a homepage product showcase, not a full configurator.

It should feel polished, simple, and premium rather than overly technical.

---

## 5. Testimonials / Soft Social Proof

### Purpose

Add warmth and trust while keeping social proof subtle.

Testimonials should be secondary, not the main proof point.

### Current Implementation

The shipped section is a horizontally auto-scrolling carousel of six fictional testimonials. Each card contains a short quote, client avatar, client name, and five-star rating. Selecting a card opens the longer review in an animated popover; pointer, keyboard focus, reduced motion, and page-scroll behavior are handled by the component.

### Current Style

- Short quote cards
- 5-star rating
- Slow horizontal movement
- Soft fade on the left and right edges

All testimonial identities and reviews are fictional concept content, not verified customer proof.

### Current Quote Examples

```txt
“We stopped thinking about the square metres.”
```

```txt
“We always knew what the next step was.”
```

```txt
“Even rainy weekends feel restorative here.”
```

```txt
“The materials feel even better in person.”
```

```txt
“I close my laptop and the room becomes a retreat again.”
```

### Additional Current Quotes

- “We chose every finish in a single afternoon.”

### Future Alternative

If verified customer proof is not available, this section can instead become a moving values/proof strip:

```txt
Solar-ready · Compact footprint · Curated finishes · Low-waste prefabrication · Designed for nature plots · Optional sauna · High-performance envelope
```

---

## 6. Interior Comparison Reveal

### Purpose

Create a visual breathing section between the product showcase/social proof area and the practical process explanation.

This section should feel premium, interactive, and meaningful.

### Core Concept

A split-view image reveal / image comparison block with a draggable or mouse-follow divider line.

The divider reveals one image version against another.

### Current Implementation

The shipped section compares two Veyra interior variants with a draggable divider. It uses the heading `Your space, your story.` and the supporting copy `Customize your cabin to match your lifestyle, from the way each room works to the details that make it yours.`

The two current variants are:

- `Focus` — Light oak, with a built-in workspace and living area
- `Unwind` — Dark walnut, with lounge seating and built-in storage

The comparison starts at a 56% split, uses a responsive 3:2-to-16:9 image frame, and supports touch and pointer dragging.

### Why This Works

This section reinforces the brand promise:

- Pre-designed, but still personal
- Curated customization
- Premium choices without complexity
- One architectural base, refined through details

### Future Directions

Future variants could compare:

- Interior vs floor plan
- Interior vs exterior
- Furnished vs alternative setup
- Two different lifestyle moods
- Standard cabin vs add-on enhanced cabin

### Current Message

The current module communicates that a resolved cabin design can still be shaped through personal choices.

### Possible Headlines

```txt
Made to feel like yours.
```

```txt
Personal in the details.
```

```txt
One design, different moods.
```

```txt
A clear base, shaped through quiet choices.
```

### Possible Supporting Copy

```txt
Each model begins with a resolved architectural plan, then adapts through curated finishes, palettes, energy options, and add-ons.
```

### Future CTA Options

- Explore model options
- See what’s customizable
- View cabin models

The current comparison section does not render a CTA.

### Current Layout

- Full-width media surface with a centered maximum width
- Image-led 3:2 frame below medium widths and 16:9 from medium widths upward
- Subtle divider and handle interaction
- Rounded framing at the widest breakpoint

### Mobile Behavior

Do not rely only on hover.

Current mobile behavior:

- Touch-drag reveal

---

## 7. How It Works

### Purpose

Reduce uncertainty and show a simple, predictable process.

This section should make the process feel less intimidating than a fully custom architecture or construction project.

### Current Steps

| Step | Label               | Editorial heading                              |
| ---- | ------------------- | ---------------------------------------------- |
| 01   | Design yours        | Shape a cabin around the way you want to live. |
| 02   | Pick the spot       | Find the setting that makes it feel at home.   |
| 03   | Prepare together    | Bring the site and cabin plan together.        |
| 04   | Deliver and install | Watch your cabin take its place.               |

Only step 04 currently includes the `Get started` CTA to `/contact`. Step descriptions and detail bullets are provisional content.

### Tone

The process should feel:

- Clear
- Reassuring
- Simple
- Premium
- Guided
- Not too corporate

### Current Layout

- Sticky timeline rail and media frame on tablet and desktop
- Scrolling step copy with responsive media
- Mobile card carousel with neighboring-card peeks and pagination dots
- Four-step visual process with image/video media

### Optional Copy Direction

```txt
A clearer path from first idea to finished retreat.
```

```txt
A guided process designed to keep decisions focused and the build predictable.
```

---

## 8. Future: Cabins in Context / Lifestyle Visual Section

This section is not currently rendered by `AppHomePage`. The notes below remain a future visual direction.

### Purpose

Show the cabins in real-life contexts and add visual richness.

This section should feel like a premium lifestyle/portfolio section, not another product slider.

### Core Idea

A high-impact visual section showing the three cabin models in different natural settings and moments of use.

### Suggested Structure

Three image-led sections or blocks, one for each model.

Each block can include:

- Large environment image
- Short descriptive text
- Model name
- Tags
- Optional smaller inset image
- Optional interior glimpse

### Example Contexts

Niva:

```txt
Forest retreat
```

Aster:

```txt
Lakeside escape
```

Veyra:

```txt
Hilltop workspace
```

### Possible Tags

- Weekend retreat
- Remote work
- Compact living
- Sleeping loft
- Studio
- 1 Bedroom
- Family stay
- Solar-ready
- Optional sauna
- Deck lounge

### Motion / Interaction

Subtle parallax or scroll-based movement can be used, but it should stay elegant and restrained.

Avoid making the section feel overly animated or gimmicky.

---

## 9. Future: Benefits / Performance / Value Props

This section is not currently rendered by `AppHomePage`.

### Purpose

Support trust with practical proof.

This section should explain why the cabins are a strong alternative to fully custom building or generic prefab options.

### Possible Points

- Compact footprint
- High-performance insulation
- Responsibly sourced timber
- Low-waste prefabrication
- Solar-ready setup
- Optional off-grid package
- Durable, repairable materials
- Predictable build system
- Simpler decision-making
- Premium material palette
- Designed for nature plots

### Notes

Keep this section concise and visual.

Avoid unsupported environmental claims.

### Possible Layouts

- Icon cards
- Editorial grid
- Split image and benefits list
- Horizontal feature cards
- Technical but soft performance section

---

## 10. Future: FAQ

This section is not currently rendered by `AppHomePage`; the current `#faqs` navigation fragment is unresolved.

### Purpose

Handle practical concerns and answer common questions.

### Suggested FAQ Topics

```txt
Do I need to own land before contacting you?
```

```txt
Can the cabins be installed off-grid?
```

```txt
How customizable are the models?
```

```txt
What foundation is required?
```

```txt
How long does production and installation take?
```

```txt
Are permits included?
```

```txt
Can I add a sauna, plunge pool, or deck package later?
```

```txt
Where do you deliver?
```

### Tone

Practical, clear, and reassuring.

---

## 11. Future: Final CTA

No dedicated final CTA is currently rendered after How It Works. The current page uses the hero, navbar, showcase, and final process-step CTAs instead.

### Purpose

Convert serious visitors.

### Direction

The final CTA should feel calm and premium, not pushy.

### Possible Headline

```txt
Start with a model. Shape it around your land, lifestyle, and pace.
```

### Possible Supporting Copy

```txt
Explore the cabins or book a consultation to understand which model fits your retreat.
```

### CTAs

Primary:

```txt
Explore models
```

Secondary:

```txt
Book a consultation
```

---

## 12. Future: Footer

No homepage footer is currently rendered by the app layout or `AppHomePage`.

### Suggested Content

- Logo / brand name
- Short brand note
- Navigation links
- Model links
- Consultation link
- Social links if needed
- Legal / placeholder links

### Possible Footer Navigation

```txt
Models
How it works
Portfolio
FAQ
Book consultation
```

---

# Current Homepage Order

```txt
1. Hero
2. About / Brand Story
3. Cabin Models Overview
4. Interactive Model Showcase
5. Testimonials / Soft Social Proof
6. Interior Comparison Reveal
7. How It Works
```

Future expansion candidates, in the existing design direction, are Cabins in Context, Benefits, FAQ, a final CTA, and a footer.

---

# Visual Direction Variants

The homepage should stay within a **light visual system**.
There should be no dark mode and no fully dark homepage variant.

The same content structure can be explored through different light-based visual directions.

---

## Variant 1 — Light Natural Minimalism

Best for:

- Calm premium feel
- Broad appeal
- Sustainability
- Timber cabins
- Quiet lifestyle mood

Traits:

- Warm whites
- Sand tones
- Timber hues
- Muted greens
- Soft grays
- Spacious layout
- Minimal typography
- Soft image treatment
- Very restrained decoration

---

## Variant 2 — Light Cinematic Editorial

Best for:

- Strong visual impact
- Premium first impression
- Cinematic imagery without using a dark UI
- Hero/video-led homepage direction

Traits:

- Light page background
- Large cinematic images or video
- Strong image contrast
- Warm natural highlights
- Big calm typography
- Editorial spacing
- Minimal overlays
- Subtle gradient treatments
- Image-led composition

Notes:

This variant can still use darker imagery inside photos or videos, especially in the hero, but the overall page system should remain light, warm, and premium.

---

## Variant 3 — Editorial Architecture

Best for:

- Design-conscious audience
- More experimental layout
- Strong visual identity
- Premium architecture feel

Traits:

- Large typography
- Asymmetrical layouts
- Magazine-style image treatment
- Strong whitespace
- Editorial rhythm
- Thin dividers
- Refined grid structure
- More expressive composition

Notes:

This variant should feel like a premium architecture/lifestyle publication, but still remain usable and clear as a homepage.

---

## Variant 4 — Warm Earthy Lifestyle

Best for:

- Emotional retreat feeling
- Cozy slower-living angle
- Human warmth
- Weekend escape mood

Traits:

- Warm earth tones
- Natural textures
- Soft photography
- Cozy interiors
- Warm beige / clay / sand palette
- Gentle typography
- Human, inviting copy
- Softer section transitions

---

## Variant 5 — Product-System Premium

Best for:

- Clear offer explanation
- Stronger conversion clarity
- Practical product understanding
- Structured model comparison

Traits:

- Clear product cards
- Strong specs presentation
- Interactive showcase
- Structured content blocks
- Clean grid system
- Premium but practical feel
- More obvious CTAs
- More systematic information hierarchy

---

## Variant 6 — Gallery-Led Retreat

Best for:

- Visual richness
- Lifestyle-heavy homepage
- Showing cabins in nature
- Creating a calm emotional flow

Traits:

- Large image sections
- Soft full-width visual moments
- Minimal text overlays
- Gallery-like rhythm
- Calm whitespace between image blocks
- Subtle parallax or scroll motion
- Natural light photography
- Focus on atmosphere and place

Notes:

This variant should feel more like browsing a calm retreat brand than comparing technical products. Product clarity still matters, but the visual story leads the page.

---

# Section Variant Options

The current implementation uses the following variants: marquee testimonial cards, an interior palette comparison, a large model slider, and a visual process timeline with mixed media and text.

## Testimonials Variants

### A. Marquee Quote Cards

Short quote cards with 5 stars moving slowly across the section.

This is the current shipped variant, with expandable full reviews.

### B. Static Horizontal Cards

Non-animated review cards in a calm grid or scrollable row.

Best for a more restrained premium page.

### C. Values / Proof Strip

Use a moving strip of proof points instead of fictional testimonials.

Best if the design should avoid review-style content.

---

## Comparison Reveal Variants

### A. Interior Palette Comparison

This is the current shipped variant for Veyra.

Compare two curated interior palettes of the same cabin.

### B. Interior vs Floor Plan

More product-focused.

Shows beauty and planning clarity together.

### C. Interior vs Exterior

More visual and editorial.

Shows that the design is considered inside and out.

### D. Day vs Evening Mood

More emotional and lifestyle-focused.

Shows how the same space changes with light and mood.

---

## Models Overview Variants

### A. Large Slider

One model per slide with large imagery and specs.

This is the current shipped variant, with thumbnails and responsive controls.

### B. Three Premium Cards

Direct and scannable.

Best for clarity and conversion.

### C. Editorial Stacked Layout

More design-led and magazine-like.

Best for a more premium visual identity.

---

## How It Works Variants

The current section combines the Visual Timeline and Mixed Image + Text Blocks variants, with a mobile card carousel.

### A. Clean Step Cards

Simple, practical, easy to scan.

### B. Visual Timeline

More guided and polished.

### C. Mixed Image + Text Blocks

More storytelling and lifestyle-oriented.

---

# Content Rules

## Pricing

The Interactive Model Showcase currently shows these starting prices:

```txt
Niva — €130,000
Aster — €170,000
Veyra — €210,000
```

The UI adds `plus installation`. Pricing remains concept content and should be treated as provisional until approved for publication.

---

## Testimonials

Testimonials remain subtle and secondary. The current six reviews are fictional concept content and use names, avatars, ratings, short quotes, and expandable long-form reviews.

The stronger trust signals should come from:

- Product clarity
- Model specs
- Process clarity
- Visual quality
- Performance details
- Sustainability details
- Clear offer structure

---

## Copy Tone

Copy should feel:

- Concise
- Premium
- Calm
- Human
- Quietly confident
- Not too salesy
- Not too technical
- Practical after the emotional hero

Avoid long text blocks.

Use structured content blocks for specs, add-ons, sustainability points, and process steps.

---

## Motion and Interaction

Use motion carefully.

Good areas for subtle interaction:

- Hero media transitions
- Interactive model showcase
- Testimonial marquee
- Comparison reveal section
- Process timeline activation and media crossfades

Subtle parallax in a future lifestyle section is optional and is not currently implemented.

Avoid making the homepage feel overly animated, gimmicky, or techy.

---

# Short Design Generation Prompt

Design a premium homepage for **Luma Cabins**, a European-inspired pre-designed cabin brand. The page should feel calm, minimal, warm, nature-focused, premium, and architectural without feeling cold. It should sell the feeling first, then clearly explain the cabin models, customization options, and buying process.

The current homepage structure is:

```txt
Hero
About / Brand Story
Cabin Models Overview
Interactive Model Showcase
Testimonials / Soft Social Proof
Interior Comparison Reveal
How It Works
```

Use the current cabin facts exactly: Niva `20 m² · Sleeping loft`, Aster `39 m² · Studio`, and Veyra `56 m² · 1 Bedroom`. Keep the page image-led, spacious, responsive, and easy to scan. Avoid looking like a SaaS site, mass-market prefab brand, cheap tiny-home website, or survivalist off-grid brand.

The strongest sections should be the cinematic hero, the interactive model showcase, and the visual comparison reveal section.
