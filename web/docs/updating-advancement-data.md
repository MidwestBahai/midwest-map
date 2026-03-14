# Updating Cluster Advancement Data

When a cluster advances to a new milestone, follow these steps.

## 1. Edit the TSV

Open `web/data-sources/advancement-dates.tsv` and add a new row for the cluster with:

| Column | Value |
|---|---|
| Date Advanced | The date in `YYYY-MM-DD` format |
| Milestone | The new milestone (`M1`, `M2`, or `M3`) |
| Cluster | Cluster code (e.g., `IN-12`) |
| Name | Cluster name (must match existing rows) |
| Population | Population (must match existing rows) |

Add the new row next to the cluster's existing entries. The original `N` row (no date) should stay — it represents the cluster's baseline. A cluster that has advanced to M2 will have three rows: `N`, `M1`, and `M2`.

### Example

Before (cluster has never advanced):
```
	N	IN-12	Vincennes	122,931
```

After (cluster advances to M1):
```
	N	IN-12	Vincennes	122,931
2026-03-13	M1	IN-12	Vincennes	122,931
```

## 2. Rebuild data

From the `web/` directory:

```bash
pnpm prepare-data
```

This runs the full pipeline:
1. **compile-importer** — compiles TypeScript scripts
2. **import-shapefiles** — converts shapefiles to GeoJSON (unchanged unless boundaries changed)
3. **import-counties** — converts county shapefiles (unchanged unless boundaries changed)
4. **merge-timeline** — reads the TSV and merges advancement dates into `clusters-timeline.geo.json`
5. **map-counties** — enriches counties with cluster associations

The merge step will log statistics including the new timeline bounds. Verify the latest advancement date matches your update.

## 3. Verify locally

```bash
pnpm dev
```

Check that:
- The cluster shows the correct color on the map
- The timeline slider includes the new date
- The cluster label reflects the new milestone

## 4. Deploy

Commit the updated TSV and regenerated data files, then deploy.

## Notes

- Row order in the TSV doesn't matter for correctness — the merge script groups by cluster ID and sorts by date. But keeping rows grouped by cluster makes the file easier to read.
- Population values are static per cluster; use the same value across all rows for a cluster.
- The merge script validates that every cluster in the TSV exists in the shapefile. It will error if you use an unknown cluster code.
