# AI Storefront Generator

**SuperProfile take-home (Product Manager)**

Helps creators who share useful content — but don’t know what to sell — turn that into a simple paid offer and a shareable store page.

**Live MVP:** [https://creator-store-ai.vercel.app](https://creator-store-ai.vercel.app)

More on decisions and metrics: [docs/PRODUCT_DECISION.md](./docs/PRODUCT_DECISION.md)

---

## The problem

Many creators already teach or help people every day. Starting a store is hard because they get stuck on basic questions:

- What should I sell?
- Who is it for?
- What should it cost (in ₹)?
- How do I explain it?

This product focuses on those questions first, then builds the store page.

---

## Who it’s for

**Main users:** Indian creators with a small-to-medium audience (about 5K–100K followers), in areas like finance, fitness, cooking, design, or exam prep.

**Also supported:** Teachers and coaches with little or no Instagram. They can start with a short note about themselves plus worksheets or PDFs.

**Simple rule:** You shouldn’t need to already know “what product to sell” before you begin.

---

## What you get

1. The app reads what you share (a short description, posts, files, or links).
2. It shows you a draft of “who you are / what you teach” — you can fix it.
3. It suggests **3 product ideas** with prices in rupees.
4. You pick one and get a mobile store page with a public link.
5. You can edit the page or ask AI to rewrite parts.

**Not included (on purpose):** real payments, full login system, scraping Instagram without permission.

---

## The flow

```
Start → Understand you → You confirm → Goals → 3 ideas → Build store → Share link
```

1. **Start** — Write what you do. Optionally add posts or files.  
2. **Understand you** — AI looks for what you teach and what people ask you.  
3. **You confirm** — Check the summary; change anything that’s wrong.  
4. **Goals** — Say what you want help with.  
5. **3 ideas** — Pick the offer that feels right (or regenerate).  
6. **Build store** — Watch real steps while the page is created.  
7. **Share** — Send the link; edit anytime.

**Why not ask “ebook or course?” first?**  
Most people don’t know yet. Asking too early creates more confusion.

---

## How the AI is designed

The AI does **not** get one big prompt like “make me a store.”  
It works in clear steps, so bad guesses don’t turn into fake product advice.

### Step 1 — Understand the creator

- Reads your description, posts, images, PDFs, and links.
- Pulls out: topics you cover, problems people have, things you already make (like worksheets).
- Marks what it *saw* vs what it *guessed*.
- Tries to point back to your own words as proof.
- Will not invent titles, follower counts, or fake experience.
- If you shared almost nothing, it asks a simple follow-up instead of making things up.

### Step 2 — Look at the market (optional)

- Searches the web for similar public products and listed prices (needs a Tavily key).
- If search isn’t available or finds nothing useful, prices are labelled as **AI estimates** — not “market proven.”

### Step 3 — Suggest 3 products

- Uses your confirmed summary (and market notes if any).
- Each idea has: name, format, who it’s for, what they get, and a ₹ price.
- Answers are checked against a fixed structure (so the app doesn’t break on messy text).
- Won’t promise guaranteed money, exam ranks, or skills you never claimed.
- Extra safety: hype phrases are scrubbed, and offers with invented claims are dropped.

### Step 4 — Write the store page

- Writes your bio, headline, and product cards.
- Same anti-hallucination rules apply; copy is scrubbed again before publish.
- Shows progress for real work steps (prepare → write → build products → publish).
- After publish, you can edit by hand or regenerate sections.

### You stay in control

- Fix the summary before ideas are made.  
- Choose which of the 3 offers to use.  
- Edit or regenerate the final page.

---

## How we’d measure success

After we have a baseline:

1. **More new creators publish a store in their first session** — aim for about **+20% relative** improvement.  
2. **Faster time to first published store** — aim for about **30% less time**, without more people dropping off.

---

## Run it locally

```bash
cd creator-store-ai
npm install
cp .env.example .env.local
```

Add your keys:

```env
OPENAI_API_KEY=...     # required
TAVILY_API_KEY=...     # optional, better price research
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Best viewed like a phone screen.

**Quick demo:** paste a cooking / finance / exam-prep description → confirm → pick an offer → publish → open the share link.

**Tests (needs the app running + API key):**

```bash
npm run test:personas
npm run test:evidence:all
npm run test:storefront-stream
```

---

## One-line pitch

**You don’t need to know what to sell. Start with what you already know.**
