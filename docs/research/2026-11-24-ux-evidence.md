# UX evidence for Attaie Properties V2

Research date: 2026-11-24. Scope: primary-source evidence for the bilingual public website and staff CRM. This is research, not implementation approval or proof of live behavior. No deployment, database operation, or external account change was performed. Firecrawl could not start its connector; sources were retrieved through the web tool instead.

## Evidence and implications

### 1. Measure actual loading, responsiveness, and stability

Google's current good Core Web Vitals thresholds are **LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1**. Assess all three at the **75th percentile**, separately for mobile and desktop. These are experience thresholds, not promised conversion gains. Field observations and laboratory tests serve different purposes; a local audit alone cannot establish visitors' actual experience. [Google web.dev: Web Vitals](https://web.dev/articles/vitals)

**Recommendation, inferred:** prioritize usable listing content and the inquiry action before decorative hero work. Set image dimensions, serve appropriately sized images, and investigate heavy scripts using actual performance traces. Establish field baselines before claiming improvement; report low sample sizes explicitly.

### 2. Use WCAG 2.2 as a concrete acceptance baseline

WCAG 2.2 AA requires normal text contrast of at least **4.5:1**, or **3:1** for qualifying large text, with stated exceptions. Pointer targets generally need **24 × 24 CSS pixels** or must satisfy an exception, such as sufficient spacing. Keyboard focus must be visible, and author content must not entirely hide the focused component. The stronger **44 × 44** target criterion and Focus Appearance criterion are AAA; do not label them AA requirements. [W3C WCAG 2.2, criteria 1.4.3, 2.4.7, 2.4.11, 2.5.5, 2.5.8](https://www.w3.org/TR/WCAG22/)

**Recommendation, inferred:** test icon buttons, filters, save actions, tables, and sticky contact controls with keyboard navigation and touch. Check rendered dashboard colors rather than assuming brand tokens meet contrast requirements. Use status text alongside color. These checks support a scoped accessibility review; they do not establish full WCAG conformance.

### 3. Put useful listing information before extra visual effects

NAR's **2025 Home Buyers and Sellers Generational Trends Report**, Exhibit 3-6 (printed page 56), reports the share rating website features “very useful” among buyers who used the internet: **photos 83%, detailed property information 79%, floor plans 57%**. These are United States survey findings about perceived usefulness, not causal conversion results or Afghanistan population estimates. [NAR report, Exhibit 3-6](https://cms.nar.realtor/sites/default/files/2025-03/2025-home-buyers-and-sellers-generational-trends-report-04-01-2025.pdf)

**Recommendation, inferred:** give each genuine listing a clear price or explicit price-on-request state, location, size and unit, bedrooms, availability, photos, and available floor plans. Distinguish unavailable information from zero. Let buyers contact staff from the listing with its identity attached. Validate the order and terminology with Kabul buyers and staff; do not assume US preferences transfer unchanged.

### 4. Treat Dari support as direction and data handling

W3C advises using HTML `dir` to set base direction. `dir="auto"` can determine direction from the first strong character, useful for unknown user-entered text; it has edge cases. Mixed-direction content needs deliberate handling rather than alignment alone. [W3C Internationalization: Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)

**Recommendation, inferred:** test real Dari names, English project names, phone numbers, amounts, punctuation, and mixed-language notes. Apply direction deliberately to free text versus structured fields. Verify reading order, labels, cursor behavior, and errors in both languages. Ask native Dari readers to review domain terminology; RTL layout does not establish translation quality.

### 5. Make CRM measurements operational and auditable

HubSpot documents reports for lead progression, response time, funnel conversion, stage duration, and loss reasons. Its lead-response definition starts at assignment and counts qualifying interaction; reassignment resets that measure. This demonstrates why KPI definitions must specify timestamps and inclusion rules. It does not establish a universal response-time target. [HubSpot: Create sales reports in the sales analytics suite](https://knowledge.hubspot.com/reports/create-sales-reports-in-the-sales-analytics-suite)

**Recommendation, inferred:** lead staff views with unassigned inquiries, overdue follow-ups, and next actions. Leadership views should show observed records with date range, denominator, freshness, and drill-through. Store creation, assignment, first real contact, stage changes, next action, and outcome timestamps. Distinguish attempted contact from successful contact. Keep zero, unavailable data, and estimates visibly distinct; never fabricate trends from empty records.

### 6. Preserve acquisition context without confusing it with sales success

Google documents UTM parameters for source, medium, and campaign reporting. Missing relevant parameters can produce missing report values; manual and automatic tagging have precedence rules. A traffic source describes acquisition context, not a verified sale. [Google Analytics Help: Traffic-source dimensions, manual tagging, and auto-tagging](https://support.google.com/analytics/answer/11242870)

**Recommendation, inferred:** retain normalized campaign fields and landing/listing context on submitted inquiries where appropriate. Keep first acquisition, current inquiry channel, and staff-entered referral separate. Include an explicit unknown source. Link qualified leads and verified outcomes through stable internal IDs; do not put customer personal information in campaign URLs or analytics event payloads.

## Questions requiring Attaie's own evidence

- Measure the path from listing view to inquiry start, server-confirmed submission, qualified lead, viewing, reservation, and verified contract. A contact-button click alone is not a lead or completed call.
- Segment completion, validation failures, and performance by language, device, and acquisition source where sample sizes permit. Check duplicate, test, and spam handling before reporting lead counts.
- Test whether requiring email blocks genuine phone-first inquiries. Public evidence here does not quantify Kabul email usage or predict uplift from making email optional.
- Define response metrics before setting targets: inquiry-to-first-attempt and inquiry-to-first-successful-contact; show unanswered leads separately. Compare median and upper percentile with clear business-hours rules.
- Define funnel cohorts, stage skips, cancellation, reassignment, and date rules. Track both current pipeline counts and cohort conversion; these answer different questions.
- Establish current baselines, then compare meaningful outcomes across comparable periods. None of these sources supports a promised percentage conversion improvement for this site.

## Research limits

No live analytics, field performance sample, buyer interviews, hosted workflow test, or full accessibility audit was available to this research. Recommendations are design judgments supported by the cited principles, not measured findings about the current deployment. Preserve V2's existing design foundations and bilingual support when acting on them.
