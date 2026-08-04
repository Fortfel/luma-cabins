# Feature Documentation

This directory documents the current behavior and implementation rationale of complex product features.

Feature documents are the current source of truth. Proposed work belongs in `docs/plans/`, while point-in-time findings belong in `docs/audits/`.

## Features

- [Interior comparison](./interior-comparison.md): image reveal behavior, responsive framing, input semantics, and asset alignment invariants.
- [Models overview](./models-overview.md): carousel autoplay, gesture intent, navigation behavior, and accessibility invariants.
- [Testimonials](./testimonials.md): carousel behavior, shared-frame expansion, viewport positioning, dismissal, and accessibility.

## Maintenance

Update a feature document when changing its behavior, state transitions, positioning rules, accessibility, shared component contracts, or an important implementation decision. Styling-only and copy-only changes do not normally require an update.

Prefer references to files and exported or named symbols over line numbers, which become stale quickly.
