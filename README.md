# GTM Spark ⚡

> **Describe your product in 3 questions. Get a complete Go-To-Market plan in 30 seconds.**

GTM Spark combines **Google Gemini** and **Happenstance AI** to generate a full GTM strategy, real people to reach out to, and a competitive landscape — all from a single product description.

---

## Live Demo

🚀 **[gtm-spark.vercel.app](https://growth-catalysts.vercel.app/)**

---

## What It Does

Fill in 3 simple prompts:
1. **What does it do?** — "My product helps ___ to ___"
2. **Who is it for?** — Startups / SMBs / Enterprise / Consumers / Students
3. **What stage are you at?** — Idea / Built / Have users

Hit **Generate** and get:

| Section | Powered by | What you get |
|---|---|---|
| 🎯 Target Customer (ICP) | Gemini | Exact buyer profile with pain point |
| 📡 Best Channel | Gemini | Top distribution channel + concrete tactic |
| 💬 One-Line Pitch | Gemini | 15-word value proposition |
| 💰 Pricing Model | Gemini | Recommended pricing tied to stage & audience |
| ⚔️ Competitive Landscape | Gemini | 3 real competitors + your gap to exploit |
| 👥 People to Reach Out To | Happenstance + Gemini | Real person profiles enriched with outreach hooks |
| ✨ Surprise Opportunity | Happenstance + Gemini | Wildcard audience you'd never find on your own |

---

## How the AI Pipeline Works

```
Step 1 — Gemini
  Generates GTM strategy + 3 persona descriptions to research
  + 3 real competitors with positioning gaps

Step 2 — Happenstance AI (parallel)
  Researches real people matching those persona descriptions
  Returns full profiles: employment history, projects, writings, LinkedIn

Step 3 — Gemini (synthesis)
  Reads the real Happenstance profiles
  Classifies each as: Angel Investor / Competitor Intel / Potential Customer / Champion
  Generates "why relevant" and a personalised outreach opener per person
```

---

## Tech Stack

- **[Next.js 14](https://nextjs.org)** — App Router, TypeScript
- **[shadcn/ui](https://ui.shadcn.com)** — Component library
- **[Tailwind CSS](https://tailwindcss.com)** — Styling
- **[Framer Motion](https://www.framer.com/motion/)** — Animations
- **[Google Gemini API](https://ai.google.dev)** — `gemini-2.5-flash` with structured JSON output
- **[Happenstance AI](https://developer.happenstance.ai)** — People intelligence API

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/andy4697/growth-catalysts.git
cd growth-catalysts
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — get from https://developer.happenstance.ai
# Without this, the app uses curated sample profiles (still shows AI-enriched analysis)
HAPPENSTANCE_AI_API_KEY=your_happenstance_api_key_here
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/andy4697/growth-catalysts)

### Manual deploy

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in your [Vercel project settings](https://vercel.com/dashboard):

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key |
| `HAPPENSTANCE_AI_API_KEY` | Optional | Happenstance developer API key |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main state machine (form → loading → results)
│   ├── layout.tsx                # Root layout, dark mode
│   ├── template.tsx              # Framer Motion page transitions
│   └── api/generate/route.ts    # POST endpoint — orchestrates all AI calls
├── components/
│   ├── form/                     # 3-step guided form
│   │   ├── GtmForm.tsx
│   │   ├── StepOne.tsx           # Fill-in-the-blank inputs
│   │   ├── StepTwo.tsx           # Audience chip selector
│   │   └── StepThree.tsx         # Stage selector
│   ├── results/                  # Results screen components
│   │   ├── ResultsView.tsx
│   │   ├── GtmCard.tsx           # Standard strategy cards
│   │   ├── WildcardCard.tsx      # Glowing surprise opportunity card
│   │   ├── ContactsSection.tsx   # Enriched person cards
│   │   └── CompetitorsSection.tsx
│   └── shared/
│       ├── LoadingScreen.tsx     # Animated loading with rotating messages
│       └── ProgressBar.tsx
├── lib/
│   ├── gemini.ts                 # Gemini API — GTM generation + profile synthesis
│   └── happenstance.ts          # Happenstance API — person research
└── types/
    └── gtm.ts                    # All TypeScript interfaces
```

---

## Environment Variables Reference

Create a `.env.example` file (safe to commit, no real keys):

```env
GEMINI_API_KEY=
HAPPENSTANCE_AI_API_KEY=
```

---

## License

MIT © 2026 Anudeep Appikatla
