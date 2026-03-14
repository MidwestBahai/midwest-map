# Postponed Print Mode Cleanup

## Consolidate scope labels — `PrintToolbar.tsx`, `PrintClient.tsx`
Scope display labels exist in two places with slightly different wording:
- `PrintToolbar.tsx` — `SCOPE_OPTIONS` (e.g., "Cleveland Group")
- `PrintClient.tsx` — `scopeLabels` in `getSubtitleForScope` (e.g., "Cleveland Grouping")

Extract a single `SCOPE_OPTIONS` array (with `key`, `label`, `subtitle` fields) into a shared location (e.g., `web/src/lib/scopeFilter.ts` alongside `matchesScope`), and have both consumers reference it.
