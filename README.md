# ProofStack Open Dataset

Audited indie product business cases and pricing benchmarks, released as open data by [ProofStack](https://proof-stack-lake.vercel.app).

## What's inside

| File | Contents |
|---|---|
| `data/cases.json` | 40+ audited business cases (count grows weekly; see `generated_at` in the data files): pricing tiers, revenue disclosures, market analysis, acquisition operations, what-to-copy / what-not-to-copy, and **a source URL for every figure** |
| `data/benchmarks.json` | Pricing benchmarks overall and per category: median first paid tier, price range, free-tier prevalence, paywall-capability distribution |
| `data/benchmarks.csv` | The benchmark table in CSV for spreadsheets |

## Data honesty rules

- Every revenue and pricing claim links to a public source (pricing page, founder post, transparency dashboard) with an evidence grade (A/B/C) and observation date.
- Revenue that is not publicly disclosed is recorded as `unknown` — **never estimated**.
- Acquisition narratives come from first-party sources; cases not yet researched say so explicitly instead of carrying template text.
- Benchmarks are counted from pricing pages we opened and verified; products without a public price are excluded from the statistics.

## Freshness

Regenerated from the live library. The `generated_at` field in each file states the export time; the live versions are always at [/api/cases](https://proof-stack-lake.vercel.app/api/cases) and [/benchmarks](https://proof-stack-lake.vercel.app/benchmarks).

## Query it live via MCP

AI assistants can query this data directly (with citations) via the official MCP Registry entry `app.vercel.proof-stack-lake/proofstack`, or the endpoint:

```
https://proof-stack-lake.vercel.app/mcp
```

Docs: [proofstack-mcp](https://github.com/lttxzmj/proofstack-mcp)

## Related free tool

[AI-visibility check](https://proof-stack-lake.vercel.app/ai-check) — test whether AI crawlers can actually read your site; results get a shareable scorecard and README badge.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You may share and adapt this data for any purpose, including commercially, **with attribution**: credit "ProofStack" and link to https://proof-stack-lake.vercel.app.

Citation example:

> Pricing data: ProofStack (https://proof-stack-lake.vercel.app), CC BY 4.0.
