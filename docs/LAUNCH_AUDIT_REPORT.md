# TEJAS Launch Audit Report

Generated: 2026-07-04T20:29:44.767Z

## Summary

| Check | Result |
|-------|--------|
| Sitemap crawl | 33/33 URLs return 200 |
| Redirect chains | 1 redirects detected |
| Broken links | 0 failures |
| Structured data pages | 4/4 with JSON-LD |
| Mixed HTTP assets | None |

## Crawl Results

- [x] 200 https://tejas.dhe.org.in → https://tejas.dhe.org.in/
- [x] 200 https://tejas.dhe.org.in/about
- [x] 200 https://tejas.dhe.org.in/olympiads
- [x] 200 https://tejas.dhe.org.in/editions
- [x] 200 https://tejas.dhe.org.in/editions/previous
- [x] 200 https://tejas.dhe.org.in/prepare
- [x] 200 https://tejas.dhe.org.in/prepare/mock-tests
- [x] 200 https://tejas.dhe.org.in/resources
- [x] 200 https://tejas.dhe.org.in/schools
- [x] 200 https://tejas.dhe.org.in/rankings
- [x] 200 https://tejas.dhe.org.in/hall-of-fame
- [x] 200 https://tejas.dhe.org.in/research
- [x] 200 https://tejas.dhe.org.in/innovation
- [x] 200 https://tejas.dhe.org.in/scholarships
- [x] 200 https://tejas.dhe.org.in/faq
- [x] 200 https://tejas.dhe.org.in/contact
- [x] 200 https://tejas.dhe.org.in/beta
- [x] 200 https://tejas.dhe.org.in/olympiads/english
- [x] 200 https://tejas.dhe.org.in/olympiads/mathematics
- [x] 200 https://tejas.dhe.org.in/olympiads/technology
- [x] 200 https://tejas.dhe.org.in/olympiads/science
- [x] 200 https://tejas.dhe.org.in/olympiads/hindi
- [x] 200 https://tejas.dhe.org.in/olympiads/sanskrit
- [x] 200 https://tejas.dhe.org.in/olympiads/general-knowledge
- [x] 200 https://tejas.dhe.org.in/olympiads/ai
- [x] 200 https://tejas.dhe.org.in/olympiads/coding
- [x] 200 https://tejas.dhe.org.in/olympiads/innovation
- [x] 200 https://tejas.dhe.org.in/editions/apj-abdul-kalam (later changed: this URL now redirects to /editions/tejas-2026-27 and is not shown as an edition)
- [x] 200 https://tejas.dhe.org.in/editions/savitribai-phule
- [x] 200 https://tejas.dhe.org.in/editions/srinivasa-ramanujan
- [x] 200 https://tejas.dhe.org.in/editions/kalpana-chawla
- [x] 200 https://tejas.dhe.org.in/editions/rabindranath-tagore
- [x] 200 https://tejas.dhe.org.in/editions/dhe-english-2025

## Structured Data (JSON-LD)

| Page | Types | Canonical OK |
|------|-------|--------------|
| / | Organization, WebSite, FAQPage | ✓ |
| /about | Organization, BreadcrumbList | ✓ |
| /olympiads/english | Course, BreadcrumbList, FAQPage | ✓ |
| /faq | FAQPage, BreadcrumbList | ✓ |

**Validate in Google:** [Rich Results Test](https://search.google.com/test/rich-results?url=https%3A%2F%2Ftejas.dhe.org.in)

## Security Headers

| Header | Value |
|--------|-------|
| strict-transport-security | max-age=63072000 |
| x-frame-options | DENY |
| x-content-type-options | nosniff |
| referrer-policy | strict-origin-when-cross-origin |
| permissions-policy | camera=(), microphone=(), geolocation=(), interest-cohort=() |

Note: HSTS is set by Vercel (`max-age=63072000`). Additional headers configured in `next.config.ts`.

## Core Web Vitals

### Mobile
- Manual run required: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Ftejas.dhe.org.in&form_factor=mobile

### Desktop
- Manual run required: https://pagespeed.web.dev/analysis?url=https%3A%2F%2Ftejas.dhe.org.in&form_factor=desktop

**Targets:** LCP ≤ 2.5s · CLS ≤ 0.1 · INP ≤ 200ms

## Google Search Console (Manual — Required)

Google does **not** use IndexNow. Complete these steps:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. **Add property** → URL prefix: `https://tejas.dhe.org.in`
3. **Verify ownership** (choose one):
   - **DNS TXT** (recommended): Add TXT record on `dhe.org.in` domain
   - **HTML meta tag**: Set `NEXT_PUBLIC_GSC_VERIFICATION` in Vercel env → redeploy
   - **HTML file**: Upload verification file to `public/`
4. **Submit sitemap**: `https://tejas.dhe.org.in/sitemap.xml`
5. Monitor weekly:
   - **Pages → Indexing** (Coverage)
   - **Experience → Core Web Vitals**
   - **Enhancements** (FAQ rich results if eligible)
   - **Performance** (impressions, clicks, CTR)

## Analytics Setup

Set in Vercel → Project → Environment Variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 (e.g. G-XXXXXXXX) |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console HTML meta verification |

Tracked events: `register_click`, `beta_feedback_submit`, `olympiad_view`, `mock_test_click`, `contact_click`

## Launch Timeline

| Day | Action |
|-----|--------|
| **Day 1** | GSC verify + submit sitemap + Rich Results Test |
| **Day 2–3** | Collect beta feedback at `/beta` · monitor Vercel logs |
| **Day 4–7** | Re-run `npm run launch-audit` · fix CWV on slow pages |
| **Week 2** | Public announcement · monitor GSC Performance tab |

## Commands

```bash
npm run launch-audit    # Full crawl + JSON-LD + security + PageSpeed
npm run post-launch     # IndexNow + OG + health checks
npx vercel logs tejas.dhe.org.in --since 24h
```
