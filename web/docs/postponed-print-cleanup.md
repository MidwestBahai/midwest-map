# Postponed Print Mode Cleanup

## 1. Remove paper size dead code — `PrintToolbar.tsx`
The paper size dropdown is hidden (`className="hidden"`) with a comment "until aspect ratio matching is implemented." Remove:
- `PAPER_SIZES` constant
- `selectedPaper` state (in `PrintClient.tsx`) and prop plumbing
- `onPaperChange` prop
- The hidden `<div>` containing the dropdown

Re-add when the feature is actually built.

## 2. Consolidate scope labels — `PrintToolbar.tsx`, `PrintClient.tsx`
Scope display labels exist in two places with slightly different wording:
- `PrintToolbar.tsx` — `SCOPE_OPTIONS` (e.g., "Cleveland Group")
- `PrintClient.tsx` — `scopeLabels` in `getSubtitleForScope` (e.g., "Cleveland Grouping")

Extract a single `SCOPE_OPTIONS` array (with `key`, `label`, `subtitle` fields) into a shared location (e.g., `web/src/lib/scopeFilter.ts` alongside `matchesScope`), and have both consumers reference it.
