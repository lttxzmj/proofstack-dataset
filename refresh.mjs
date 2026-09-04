#!/usr/bin/env node
// Standalone weekly refresh: pulls the public API and regenerates the dataset.
// Zero dependencies so the repo's own Action can run it without a package install.

import { writeFileSync, mkdirSync } from "node:fs";

const SITE = "https://proof-stack-lake.vercel.app";

const GATE_PATTERNS = [
  { id: "branding", en: "Remove branding", words: /水印|品牌标识|branding|watermark|made with|badge/i },
  { id: "custom_domain", en: "Custom domain", words: /自定义域名|custom domain|own domain/i },
  { id: "usage_limit", en: "Usage limits (items, runs, storage)", words: /条目|数量限制|次数|额度|存储|storage|limit of|up to \d|quota|credits?/i },
  { id: "team", en: "Team seats and permissions", words: /团队|协作|成员|权限|team|seats?|collaborat|role/i },
  { id: "api", en: "API and integrations", words: /\bapi\b|集成|integration|webhook|zapier/i },
  { id: "analytics", en: "Advanced analytics", words: /分析|报表|report|analytics|insight|dashboard/i },
  { id: "automation", en: "Automation and workflows", words: /自动化|工作流|automation|workflow|trigger/i },
  { id: "export", en: "Export and downloads", words: /导出|下载|export|download|csv/i },
  { id: "support", en: "Priority support", words: /优先支持|专属支持|priority support|dedicated support/i },
  { id: "sso", en: "SSO and compliance", words: /\bsso\b|合规|compliance|saml|audit log/i }
];

function priceToNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^(free|免费|0)$/i.test(raw)) return 0;
  const match = raw.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(value * 100) / 100;
}

function buildBenchmark(cases) {
  const usable = cases.filter((c) => c && (c.revenue_model?.pricing_tiers?.length || c.revenue_model?.paid_trigger));
  if (usable.length < 3) return null;
  const firstPaid = [];
  let freeTier = 0;
  const gateHits = new Map();
  for (const c of usable) {
    const revenue = c.revenue_model || {};
    const tiers = Array.isArray(revenue.pricing_tiers) ? revenue.pricing_tiers : [];
    const priced = tiers.map((t) => ({ t, amount: priceToNumber(t?.price) })).filter((e) => e.amount !== null);
    if (revenue.free_plan === true || priced.some((e) => e.amount === 0)) freeTier += 1;
    const paid = priced.filter((e) => e.amount > 0).sort((a, b) => a.amount - b.amount);
    if (paid.length > 0) firstPaid.push(paid[0].amount);
    const gateText = [revenue.paid_trigger, revenue.paid_trigger_en, ...(paid[0]?.t?.features || [])].map((x) => String(x || "")).join(" ");
    const seen = new Set();
    for (const p of GATE_PATTERNS) {
      if (p.words.test(gateText) && !seen.has(p.id)) { seen.add(p.id); gateHits.set(p.id, (gateHits.get(p.id) || 0) + 1); }
    }
  }
  return {
    sample_size: usable.length,
    paid_sample_size: firstPaid.length,
    free_tier_count: freeTier,
    first_paid_median: median(firstPaid),
    first_paid_min: firstPaid.length ? Math.min(...firstPaid) : null,
    first_paid_max: firstPaid.length ? Math.max(...firstPaid) : null,
    gate_tallies: GATE_PATTERNS
      .filter((p) => (gateHits.get(p.id) || 0) > 0)
      .map((p) => ({ label: p.en, count: gateHits.get(p.id) }))
      .sort((a, b) => b.count - a.count).slice(0, 5)
  };
}

const response = await fetch(`${SITE}/api/cases`);
const payload = await response.json();
if (!payload.success || !Array.isArray(payload.data)) throw new Error("Public cases API did not return data.");
const cases = payload.data;
const generatedAt = new Date().toISOString();

mkdirSync("data", { recursive: true });
writeFileSync("data/cases.json", JSON.stringify({ generated_at: generatedAt, source: `${SITE}/cases`, license: "CC BY 4.0", count: cases.length, cases }, null, 2));

const categories = [...new Set(cases.map((c) => c.category).filter(Boolean))];
const overall = buildBenchmark(cases);
const perCategory = categories.map((category) => ({ category, benchmark: buildBenchmark(cases.filter((c) => c.category === category)) })).filter((g) => g.benchmark);
writeFileSync("data/benchmarks.json", JSON.stringify({ generated_at: generatedAt, source: `${SITE}/benchmarks`, license: "CC BY 4.0", method: "Counted from the published pricing pages of audited cases; products without a public price are excluded, never estimated.", overall, categories: perCategory }, null, 2));

const csv = ["category,sample_size,paid_sample_size,first_paid_median_usd,first_paid_min_usd,first_paid_max_usd,free_tier_count",
  `ALL,${overall?.sample_size},${overall?.paid_sample_size},${overall?.first_paid_median},${overall?.first_paid_min},${overall?.first_paid_max},${overall?.free_tier_count}`,
  ...perCategory.map(({ category, benchmark: b }) => `"${category}",${b.sample_size},${b.paid_sample_size},${b.first_paid_median},${b.first_paid_min},${b.first_paid_max},${b.free_tier_count}`)];
writeFileSync("data/benchmarks.csv", csv.join("\n") + "\n");
console.log(`Refreshed: ${cases.length} cases, ${perCategory.length} category benchmarks.`);
