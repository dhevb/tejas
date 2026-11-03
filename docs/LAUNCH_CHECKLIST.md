# TEJAS Launch Checklist

Production: [https://tejas.dhe.org.in](https://tejas.dhe.org.in)

## Launch readiness: ~95–98%

Everything below is automated except **Google Search Console** (requires your Google account).

---

## Day 1 — Search Console (essential)

### Step 1: Add property

1. Open [Google Search Console](https://search.google.com/search-console)
2. Click **Add property**
3. Choose **URL prefix**: `https://tejas.dhe.org.in` (**not** Domain property `tejas.dhe.org.in` — subdomains work better as URL prefix)

If you already added a Domain property and sitemap shows **"Couldn't fetch"**:

1. GSC → **URL Inspection** → paste `https://tejas.dhe.org.in/sitemap.xml` → **Test live URL**
2. If live test passes, wait 24h — Google often retries automatically
3. If still failing, add a **URL prefix** property (above), verify, and submit `sitemap.xml` there

### Step 2: Verify ownership

**Option A — DNS (recommended for `tejas.dhe.org.in` subdomain)**

1. In GSC, select **Domain name provider** verification
2. Add the TXT record to your DNS for `dhe.org.in`
3. Wait for propagation (up to 24h) → click **Verify**

**Option B — HTML meta tag (fastest if you have Vercel access)**

1. In GSC, copy the `google-site-verification=...` content value
2. Vercel → **tejas** project → **Settings → Environment Variables**
3. Add: `NEXT_PUBLIC_GSC_VERIFICATION` = `your-verification-code`
4. Redeploy production
5. Click **Verify** in GSC

**Option C — HTML file**

1. Download the verification file from GSC (e.g. `google123abc.html`)
2. Place in `tejas/public/`
3. Deploy → visit `https://tejas.dhe.org.in/google123abc.html`
4. Click **Verify**

### Step 3: Submit sitemap

1. GSC → **Sitemaps** → enter: `sitemap.xml`
2. Submit → status should show **Success**

### Step 4: Validate rich results

Test these URLs in [Rich Results Test](https://search.google.com/test/rich-results):

| URL | Expected schema |
|-----|-----------------|
| `https://tejas.dhe.org.in/` | Organization, WebSite, FAQPage |
| `https://tejas.dhe.org.in/about` | Organization, BreadcrumbList |
| `https://tejas.dhe.org.in/olympiads/english` | Course, BreadcrumbList, FAQPage |
| `https://tejas.dhe.org.in/faq` | FAQPage, BreadcrumbList |

### Step 5: Request indexing (optional, Day 1)

In GSC → **URL Inspection** → paste homepage URL → **Request indexing**

---

## Day 1 — Analytics

1. Create a [Google Analytics 4](https://analytics.google.com/) property for TEJAS
2. Copy Measurement ID (format: `G-XXXXXXXXXX`)
3. Vercel env: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = your ID
4. Redeploy

**Auto-tracked events:**

| Event | Trigger |
|-------|---------|
| `register_click` | Navbar + homepage Register CTA |
| `beta_feedback_submit` | `/beta` form success |
| `page_view` | All pages (GA4 default) |

---

## Automated checks (run anytime)

```bash
cd tejas
npm run launch-audit     # Crawl all sitemap URLs, JSON-LD, security headers, PageSpeed
npm run post-launch      # IndexNow, OG, health checks
```

Latest automated results: see `docs/LAUNCH_AUDIT_REPORT.md`

---

## Day 2–3 — Beta feedback

- Beta page: [https://tejas.dhe.org.in/beta](https://tejas.dhe.org.in/beta)
- Feedback delivered to: `tejas@dhe.org.in`
- Monitor: `npx vercel logs tejas.dhe.org.in --since 24h`

---

## Day 4–7 — Performance

Run manually (if PageSpeed API is rate-limited):

- [PageSpeed Insights — Mobile](https://pagespeed.web.dev/analysis?url=https://tejas.dhe.org.in&form_factor=mobile)
- [PageSpeed Insights — Desktop](https://pagespeed.web.dev/analysis?url=https://tejas.dhe.org.in&form_factor=desktop)

**Targets:**

| Metric | Good |
|--------|------|
| LCP | ≤ 2.5s |
| CLS | ≤ 0.1 |
| INP | ≤ 200ms |
| Lighthouse Performance | ≥ 90 |

After GSC is verified, monitor **Experience → Core Web Vitals** in Search Console.

---

## Week 2 — Public launch

- [ ] Incorporate top beta feedback fixes
- [ ] Public announcement (schools, social media)
- [ ] Share OG-tested links (Facebook Debugger, LinkedIn Inspector)
- [ ] Monitor GSC **Performance** tab (impressions, clicks, CTR)
- [ ] Re-run `npm run launch-audit`

---

## Security (automated on deploy)

| Control | Status |
|---------|--------|
| HTTPS | ✓ Vercel |
| HSTS | ✓ Vercel (`max-age=63072000`) |
| X-Frame-Options | ✓ `DENY` (next.config.ts) |
| X-Content-Type-Options | ✓ `nosniff` |
| Referrer-Policy | ✓ `strict-origin-when-cross-origin` |
| Permissions-Policy | ✓ Restricted |

---

## Mobile audit (manual — real devices)

Test on Android Chrome + iPhone Safari:

- [ ] Sticky navbar scroll behaviour
- [ ] Hamburger menu opens all 8 nav items
- [ ] Hero text readable without zoom
- [ ] Card tap targets ≥ 44px
- [ ] Register CTA scrolls to `#register`
- [ ] Beta form submits successfully

---

## What IndexNow covers (already done)

Bing, Yandex, and partners — **not Google**.

Google indexing requires Search Console verification above.
