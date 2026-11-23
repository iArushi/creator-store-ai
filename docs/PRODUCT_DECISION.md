# AI Storefront Generator
### Product Decision Document
**SuperProfile by Cosmofeed | Product Manager Take-home Assignment**

## 1. Problem understanding

SuperProfile enables creators to monetise their expertise through courses, digital products, workshops, memberships and services.

However, creating a storefront requires several decisions: what to sell, whom to sell it to, how to price it and how to communicate its value. For creators who have never monetised their knowledge, these decisions can become barriers to getting started.

I believe the problem goes beyond building a webpage. It is about helping creators recognise what they can credibly offer and turning that knowledge into a clear, commercially sensible product.

**Problem hypothesis**

Indian micro-creators with an existing audience but limited monetisation experience struggle to translate their expertise and content into a product their audience might pay for. Uncertainty around product selection, pricing and communication makes starting a storefront overwhelming.

My approach is therefore to treat this as a creator monetisation discovery problem, rather than simply an AI website-generation problem.

### Assumptions

- The primary user is an Indian micro-creator with approximately 5K–100K followers.
- Creators have useful knowledge or experience but may not recognise it as something they can monetise.
- First-time creators may lack experience in product packaging, pricing and copywriting.
- Their audiences can be price-sensitive, making accessible entry-level products important.
- Experts without a meaningful social presence should also be able to use the product through documents, resources or self-description.

These are working assumptions based on the assignment brief, not findings from completed primary user research.

## 2. User and experience

I prioritised the Indian micro-creator who has an audience but is unsure what to sell. I also considered the secondary persona: an expert, teacher or professional with limited social presence who needs help turning their expertise into an offer.

The guiding principle is: **creators should not need to know how to define or package their expertise before using the product.**

### Designed journey

Creator resources → Evidence extraction → Creator intelligence → Creator confirmation → Market research → Product recommendations → Storefront generation → Published URL

1. **Understand the creator:** Accept screenshots, captions, documents, public links or a short self-description.
2. **Discover expertise:** Analyse recurring themes, demonstrated knowledge, potential audience problems and reusable knowledge assets.
3. **Confirm understanding:** Present an AI-generated creator profile for review and correction.
4. **Discover opportunities:** Generate 2–4 tailored product ideas with formats, target audiences, deliverables and INR pricing.
5. **Select and customise:** Allow editing and individual or complete regeneration.
6. **Generate and publish:** Create a branded, mobile-friendly storefront with a public shareable URL.

### Alternative considered

I considered a product-first onboarding screen where creators select a format such as an ebook, course, consultation or workshop before proceeding.

I rejected this because it assumes creators already know what they want to sell. It risks recreating the uncertainty the product is supposed to solve.

Instead, I chose discovery-first onboarding, where the AI understands the creator before recommending a suitable product format.

I also avoided a long mandatory questionnaire. Optional guided questions and resource uploads help creators who cannot easily articulate their expertise.

## 3. Key product decisions and trade-offs

| Decision | Why I chose it | Trade-off |
|---|---|---|
| Discovery before product selection | Helps creators who don't know what to sell | Requires additional AI processing |
| Multiple resource inputs | Supports social creators and experts without an online following | Requires resource extraction and validation |
| Editable AI profile | Lets creators correct inaccurate interpretations before recommendations | Adds a confirmation step |
| Evidence-backed AI | Makes recommendations traceable rather than merely persuasive | More complex than a single LLM call |
| External market research | Helps ground comparable products and listed prices | Search results can be incomplete or irrelevant |
| Two to four curated recommendations | Provides meaningful choice without overwhelming beginners | Fewer options than a full product catalogue |
| Editable generated storefront | Gives creators control and supports refinement | Requires more than one generation/editing interaction |

### Pricing decision

Pricing combines product format, deliverables, audience affordability, creator capability and available comparable listings.

A price is labelled as research-backed only when a relevant comparable product has a verifiable listed price. Otherwise, it remains an AI estimate.

I deliberately avoid treating listed prices as proof of actual sales or willingness to pay.

## 4. AI architecture and quality control

The AI workflow uses separate stages so that unsupported assumptions do not become product recommendations.

**Stage A — Creator intelligence:** Extract information from uploaded images, documents, captions and accessible resources. Identify expertise, recurring content themes, potential audience problems and reusable knowledge assets.

**Stage B — Market research:** Use targeted Tavily searches to retrieve comparable public products, listed prices, formats and positioning.

**Stage C — Opportunity generation:** Combine the confirmed creator profile with supporting evidence and market findings to produce tailored product recommendations.

**Structured output:** Use schema-constrained JSON and Zod validation for consistent fields, evidence references, pricing basis and product information.

**Quality safeguards:**
- Distinguish observed facts from AI inferences.
- Keep evidence references attached to creator insights.
- Do not invent qualifications, audience demographics or engagement.
- Do not claim market demand is validated by search results.
- Label prices as estimates when comparable evidence is insufficient.
- Retry malformed outputs where appropriate.
- Ask for clarification when source material is insufficient.
- Preserve creator inputs and provide useful error and retry states.

## 5. What I deliberately did not build

| Excluded feature | Reason |
|---|---|
| Unrestricted Instagram scraping | Platform and permission constraints; resource uploads and self-description provide alternatives |
| Payment processing | Not necessary to demonstrate the discovery-to-storefront journey |
| Full authentication system | Adds complexity without improving the core demonstration |
| Advanced analytics dashboard | Better addressed after successful storefront activation |
| Video transcription and extensive social listening | Higher processing complexity; prioritised images, text, documents and accessible links |
| Complex theme customisation | Prioritised one polished, shareable storefront |

## 6. Success metrics

The primary outcome is to help more new creators publish a storefront in their first session, with less time and uncertainty.

### Metric 1: First-session storefront publication rate

**Proposed target: +20% relative improvement over the existing baseline.**

Formula:

New creators who publish a storefront in their first session ÷ New creators who start onboarding × 100.

For example, if the baseline is 20%, a 20% relative improvement means reaching 24%, not 40%.

**Measurement:**
Track `onboarding_started` and `storefront_published` with a session identifier and timestamps. Define a consistent session boundary, and compare new-creator cohorts using the existing experience against the AI-assisted experience.

### Metric 2: Median time to first published storefront

**Proposed target: 30% reduction against the existing baseline.**

Formula:

Median of (storefront_published timestamp − onboarding_started timestamp) for successfully published storefronts.

**Measurement:**
Track timestamps for onboarding start and successful publication. Compare the median for equivalent new-creator cohorts, while separately monitoring abandonment so a faster completion time does not hide a lower publication rate.

These are proposed experiment targets, not measured outcomes. The targets should be adjusted after establishing a reliable baseline.

## 7. Go-to-market thought

Start with a focused beta among existing SuperProfile creators, particularly first-time storefront builders in finance, fitness, cooking and education.

Position the experience around:

**"You don't need to know what to sell. Start with what you already know."**

Measure completion, recommendation selection and creator feedback before expanding to more categories.

## 8. What I would do with two more weeks

**Week 1: Strengthen intelligence**
- Test across creator niches and different source types.
- Fix evidence extraction for screenshots and documents.
- Improve comparable-product matching and pricing reliability.
- Conduct usability sessions with first-time creators.

**Week 2: Improve activation**
- Refine storefront visual quality.
- Instrument the onboarding and publication funnel.
- Compare existing onboarding with research-assisted onboarding.
- Analyse recommendation acceptance and editing.
- Explore language options and broader source support based on observed usage.

## 9. Communication, confidence and how I would adjust my thinking

My central product decision is to solve monetisation uncertainty before storefront construction.

I chose this direction because the creator's difficulty is not necessarily building a page; it is deciding what that page should sell.

I would defend this as a product hypothesis, not an established fact.

The most important assumptions to validate are:

1. Creators struggle more with identifying an offer than with constructing a storefront.
2. Research-backed suggestions are more useful than generic AI-generated product ideas.
3. A short confirmation step improves recommendation relevance enough to justify its additional friction.

**What would change my thinking?**

- If research shows that creators already know what to sell but struggle with page creation, I would simplify discovery and prioritise storefront generation.
- If creators frequently reject the AI's understanding of their expertise, I would improve source collection and confirmation before adding more market research.
- If research-backed recommendations do not improve selection or publication rates, I would reconsider the additional research cost and latency.
- If creators consistently find the confirmation step unnecessary, I would test a shorter, optional confirmation experience.

My intent is not to defend every original choice regardless of evidence. It is to make deliberate decisions, measure their impact and adjust when user behaviour contradicts my assumptions.
