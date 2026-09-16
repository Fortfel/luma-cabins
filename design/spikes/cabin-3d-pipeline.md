# Reusable Cabin 3D Pipeline

Use this as the brief for a fresh Astra Blender session. It records conventions, not permission to start another cabin. Read the current repo instructions and that cabin's brief first.

## Model And Scope

- Inspect the connected Blender file and dirty state. Preserve existing work before editing; use a dedicated cabin file/folder. Never clear an unknown scene.
- Use clean authored geometry and references in this order: explicit user clarification, exterior reference, interior/layout reference, mood images. Record inferred proportions; do not claim measured architectural accuracy.
- Build the silhouette and principal openings first, then deck/base/roof details and only the interior needed through glazing. Do not copy Niva's layout or undocumented elevations into another cabin.
- Support a complete orbit. Keep doors/windows static unless asked otherwise. Avoid camera-specific geometry, reflections or baked imagery.
- Use metric modeling units, origin at ground level near the footprint center, Blender +Z up / -Y front. Export glTF +Y up / +Z front. Keep stable descriptive object names.
- Suggested collections: Architecture, Glazing, ExteriorDetails, ShallowInterior, Lights, ReviewStaging. Keep staging out of runtime exports.

## Material Contract

- `ExteriorCladding`: exterior wall cladding only. Deck, steps, roof, exterior/metal frames, gutters, chimney and fixtures remain separate/fixed.
- `InteriorJoinery`: visible furniture/built-in timber, cabinetry, shelves, table/desk surfaces, interior wooden door leaves **and their wooden frames/trim**. Classify ambiguous parts deliberately.
- Walls, ceiling, floor, structural loft elements, textiles, fixtures and lighting remain fixed. Do not apply finishes to all wood indiscriminately.
- Use Principled/glTF-compatible PBR. Reuse licensed timber maps where appropriate; record asset IDs, authors, resolution and derivations. Albedo is sRGB; normal/roughness/metalness data is non-color.
- One geometry asset supports independent exterior/interior selections. Never build nine cabin copies for three-by-three combinations.
- Niva's reusable pattern: embedded default maps, separate alternative base-color textures and a small preset JSON with exact material names, IDs and roughness multipliers.
- Browser replacement textures need sRGB and `flipY=false`, with the original sampler/UV transform retained. Restore cached defaults; never compound roughness multipliers or alter shared image data globally.

## Camera And Review

- Author a premium three-quarter product camera that also exposes configurable joinery. Use the cabin's own source aspect ratio and framing, not Niva's dimensions by default.
- Save exact camera pose, target, off-axis projection, clipping planes, image dimensions and coordinate convention. Generate the poster from that exact camera and default finishes.
- Keep light emitters inside the intended room/fixture volume and lamps clear of beams. Review lighting is not automatically part of a GLB; document it separately.
- Normally review the canonical view, several orbit views, all finishes and a complete orbit; round-trip the GLB and check textures, normals, glass, material assignments and obvious clipping.
- Follow explicit user limits on tests/renders. If checks are skipped, label the latest change untested rather than reusing older results as current proof.

## Packaging And Handoff

- Preserve the editable master and approved full-quality/runtime baseline before optimization or revisions. Report measured size before optional optimization when requested.
- Optimize textures first; compare against the baseline. Do not decimate or merge geometry just to meet a guessed budget. Preserve names, slots and glass behavior.
- Deliver one current master blend, one runtime GLB, camera JSON, preset JSON, optional finish textures, exact-camera poster, payload metadata and a concise handoff.
- State which textures are embedded versus external, default versus optional payload, and any HDRI/supporting requests. File size is not a runtime-performance measurement.
- Keep the final master authoritative. Separate old exports, diagnostics and review frames from the handoff's current file list; offer a non-destructive cleanup manifest.
- Blender approval does not prove browser parity. The browser agent must check lighting, tone mapping, glass, texture orientation and performance in the isolated prototype before public integration.
- Do not modify the website or start another cabin without authorization. Stop at the agreed gate.
