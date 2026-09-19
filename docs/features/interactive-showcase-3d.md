# Interactive Showcase 3D

## Status

Runtime hardening is implemented pending browser acceptance. The showcase renders the selected production cabin through one persistent, client-only R3F Canvas with intent-aware preloading, desktop interaction, mobile opt-in interaction, revision-safe loading/error feedback, validated cabin contracts, and targeted exterior-lamp shadows. The live surface remains hidden until its camera, finish pair, and submitted frame match the current cabin/configuration revision. Exterior-lamp visual quality is explicitly deferred to final QA.

## Implementation Map

- `apps/nextjs/src/app/[locale]/(app)/_components/interactive-showcase-section.tsx`
- `InteractiveShowcaseSection`: owns the carousel, media-slot refs, proximity gate, and the committed slot index used by the live surface.
- `apps/nextjs/src/app/[locale]/(app)/_components/interactive-showcase-3d.tsx`
- `InteractiveShowcase3D`: client-only lazy boundary for the renderer runtime.
- `apps/nextjs/src/app/[locale]/(app)/_components/interactive-showcase-3d-runtime.tsx`
- `InteractiveShowcase3DRuntime`: one demand-rendered Canvas, resource preloading, revision-safe presentation readiness, and a clipped surface that fills the shared desktop media viewport while tracking the corresponding carousel media slot below `xl`.
- `CabinModel`: applies the production manifest's `ExteriorCladding` and `InteriorJoinery` finish boundaries and reports readiness from a renderable `onAfterRender` probe.

## Renderer Mounting

- The renderer bundle is requested when the showcase section enters a `600px` vertical `IntersectionObserver` preload margin.
- Once requested, the Canvas remains mounted for the lifetime of the showcase section. Leaving the viewport does not recreate the WebGL context.
- The Canvas uses `frameloop="demand"`; no continuous idle render loop is used.
- Once the runtime is requested, the active cabin's GLB, manifest, camera contract, and selected external finish textures are preloaded. Explicit intent preloads its target with the same deduplicated cache.
- After the active cabin produces its matching frame, one direction-aware adjacent cabin may be preloaded during an idle window. The candidate does not wrap, and data-saving or slow-connection signals disable this speculative request.
- The committed surface cabin is rendered from its production GLB and camera contract. Camera matrices are read as row arrays and converted to Three.js column-major matrices while preserving the authored off-axis projection.
- The surface remains opacity-zero until the current asset revision is loaded, both selected finish states are applied atomically, the camera is configured, and a matching frame reaches the renderer's `onAfterRender` probe.
- Exterior IDs are normalized at the runtime boundary: `wood` to `natural-timber`, `white` to `whitewashed-timber`, and `black` to `charred-black-oil`.
- Manifest and camera JSON are validated at the runtime boundary before they enter material preparation or camera configuration. Invalid contracts enter the existing controlled load-error path instead of relying on unchecked type casts.

## Lighting Contract

- Veyra uses four targeted exterior spotlights and one targeted kitchen dining-pendant spotlight. Niva and Aster retain their existing exterior spotlight and interior-light configurations.

- The persistent Canvas enables demand-rendered Three.js shadows. Niva and Aster use two targeted exterior spotlights; Veyra uses four targeted exterior spotlights rather than duplicate point-light illumination.
- Cabin-mounted exterior spotlights and interior lights are children of the cabin turntable group, so their positions and shadow targets rotate with the cabin. Niva keeps three interior points, Aster has no mounted interior lights, and Veyra uses one targeted kitchen dining-pendant spotlight. Hemisphere and directional studio lights remain fixed.
- Lamp targets follow the authored facade coordinates. Their shadow cameras use a `0.01` near plane, a `3` useful range, a `512 × 512` map, and small bias values so nearby backplates and wall linings remain in the shadow view.
- After each GLB scene loads, opaque meshes are configured as shadow casters and receivers. Materials named as glazing, or marked transparent, partially opaque, or transmissive, remain outside the opaque shadow set.
- Lighting and scene shadow setup invalidate the demand renderer after configuration. The side-window lamp view is intentionally not a gate for the current hardening phase and remains a final-QA follow-up.

## Surface Geometry

- The media viewport is a local `relative overflow-hidden` wrapper around `CarouselContent` and the live surface. At `xl`, it uses one shared fixed `31.25rem` (`500px`) height for every cabin.
- Desktop initial optical framing targets a projected cabin height of `clamp(300px, -36.848px + 26.316vw, 400px)`. The runtime projects the eight world-space corners of the model bounding box through the canonical camera at its unchanged distance, converts the NDC vertical span to Canvas pixels, and applies the target-to-measured ratio to the horizontal and vertical focal terms of the off-axis projection. Principal-point offsets and the authored camera position remain unchanged.
- Each cabin media slot is tracked by an element ref. On desktop, the surface fills the media viewport at `0,0`; below `xl`, it uses the committed slot's `getBoundingClientRect()` relative to the media viewport for width, height, and translation.
- The legacy poster aspect ratios remain scoped to the below-`xl` fallback frames only; desktop poster and live Canvas sizing is independent of cabin geometry and source-image aspect ratio.
- Embla `scroll`, `reInit`, and `resize` events update positioning without React state. `ResizeObserver` and window resize cover layout changes outside Embla.
- The wrapper and Canvas both use an explicit full-size contract. An imperative `ResizeObserver` bridge keeps R3F's internal renderer size synchronized after the positioned surface receives its slot dimensions, including when the surface starts from zero size on mobile.
- The surface slot index changes on `settle`, so an outgoing live cabin remains attached to its moving slot during a transition.
- Embla `reInit` preserves the selected snap before active and surface indices are synchronized, so responsive breakpoint changes do not revert the showcase to Niva.
- A monotonic surface revision changes only when the committed slot changes, preventing an Embla resize/reInit for the same slot from restarting the model.
- The wrapper clips the live surface to the media area; carousel arrows, thumbnails, configuration controls, and summaries remain outside its clipping region.

## Interaction and Failure States

- Thumbnail focus, 100 ms thumbnail hover, arrow focus/hover, and explicit cabin selection record intent before navigation completes.
- Desktop enables cabin turntable dragging and zoom only for the revealed current surface while the section and document are visible. Horizontal dragging turns the upright cabin around its vertical axis, while vertical dragging applies a small damped camera elevation around the authored target without changing the model rotation or target. Mobile keeps the surface passive until the explicit `Explore in 3D` control is activated and provides an `Exit 3D` control afterward.
- Loading feedback is shown while the current surface revision is pending. Finish updates retain the last complete live pair while replacement textures load.
- Finish failures retain the last complete live pair and expose a localized retry action. Scene failures keep the canonical poster visible with a retry action; obsolete async completions cannot reveal or overwrite a newer cabin/configuration revision.

## Invariants

- There is at most one Canvas for the showcase section.
- There is at most one live cabin scene in that Canvas. Neighboring cabins are preloaded but not rendered until committed.
- Neighboring slides and thumbnails continue to use the existing canonical poster images.
- No high-frequency geometry value is stored in React state.
- Palette changes preserve the last complete live pair while replacement textures load; failed replacements do not hide or claim to replace that pair.
- The Canvas is interactive only for the revealed current surface: desktop uses OrbitControls for zoom while custom dragging controls the cabin turntable and camera elevation, and mobile requires explicit touch-mode entry. Carousel gestures and controls retain ownership outside the live surface.

## Verification Baseline

- Veyra exterior illumination and orbit interaction have been checked at desktop; final user acceptance remains required for the interior light balance and side-window view.

For this hardening phase, run the `nextjs` lint, typecheck, and build tasks. Browser verification should confirm the Niva, Aster, and Veyra live frames at desktop and mobile widths, explicit mobile 3D entry/exit for each newly selected cabin, desktop interaction affordances, finish-pair changes, persisted configuration across cabin switching, the unchanged carousel controls/poster presentation, and controlled retry behavior. Exterior-lamp illumination remains deferred to final QA.
