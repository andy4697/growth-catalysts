import { GoogleGenAI } from "@google/genai";
import { GeminiOutput, EnrichedContact, RawProfile, FormData, Competitor, CompetitorAnalysis } from "@/types/gtm";

// Lazy initialisation — never called at build time, only at runtime inside API routes
function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenAI({ apiKey: key });
}

const GTM_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    icp: {
      type: "string",
      description: "A 2-3 sentence description of the Ideal Customer Profile — their job title, pain point, and what makes them ready to buy",
    },
    channel: {
      type: "string",
      description: "The single best marketing/distribution channel with a concrete tactic, not a generic suggestion",
    },
    pitch: {
      type: "string",
      description: "A one-line pitch (max 15 words) that immediately communicates value without jargon",
    },
    pricing: {
      type: "string",
      description: "A specific pricing model recommendation with rationale tied to the stage and audience",
    },
    persona_queries: {
      type: "array",
      description: "Exactly 3 detailed person descriptions to look up. Each should describe a REAL type of person who would be an ideal early customer or champion — include their typical job title, company type, and any identifying details (e.g. 'Head of Remote Operations at a 50-100 person Series A SaaS company in the US who has posted about async work on LinkedIn'). These will be used to find real people to contact.",
      items: { type: "string" },
    },
    competitors: {
      type: "array",
      description: "Exactly 3 real competitor products or companies in this space",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Competitor product or company name" },
          description: { type: "string", description: "One sentence: what they do and who they target" },
          gap: { type: "string", description: "The specific weakness or gap this competitor has that the user's product can exploit" },
          url: { type: "string", description: "Their website URL" },
        },
        required: ["name", "description", "gap"],
      },
    },
  },
  required: ["icp", "channel", "pitch", "pricing", "persona_queries", "competitors"],
};

export function buildGeminiPrompt(data: FormData): string {
  const targetList = data.target.join(", ");
  return `
You are a world-class Go-To-Market strategist with deep knowledge of the startup ecosystem.
A founder has described their product. Generate a full GTM plan with competitive intelligence.

PRODUCT DESCRIPTION:
- What it does: "My product helps ${data.helps} to ${data.to}"
- Primary audience: ${targetList}
- Stage: ${data.stage}

Instructions:
1. icp, channel, pitch, pricing — be specific, punchy, 2-4 sentences max. No clichés.
2. persona_queries — describe 3 SPECIFIC people directly related to THIS PRODUCT'S DOMAIN. NOT generic personas. Examples:
   - If the product helps students pass tech interviews: search for "engineering hiring manager at FAANG", "tech recruiter at startups", "engineering lead who mentors junior engineers"
   - If the product helps remote teams with async communication: search for "VP of Engineering at distributed SaaS company", "Head of Remote Operations", "CTO at fully-remote startup"
   Each query should reference the actual domain/problem your product solves. Include job titles, company types, and a signal tied to YOUR product's specific use case.
3. competitors — name 3 REAL products/companies competing in this exact space. Give their actual website URL. Identify a concrete gap or weakness each one has.

Return ONLY valid JSON. No markdown, no explanation.
`.trim();
}

// Safe JSON parse — strips markdown fences if Gemini wraps output despite responseMimeType
function safeParseJSON<T>(raw: string): T {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(stripped) as T;
}

export async function callGemini(data: FormData): Promise<GeminiOutput> {
  const prompt = buildGeminiPrompt(data);

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: GTM_RESPONSE_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return safeParseJSON<GeminiOutput>(text);
}

// ─── Step 3: Gemini synthesises raw Happenstance profiles into actionable intel ─

const SYNTHESIS_SCHEMA = {
  type: "object",
  properties: {
    contacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name:          { type: "string" },
          title:         { type: "string" },
          company:       { type: "string" },
          linkedin_url:  { type: "string" },
          contact_type:  { type: "string", enum: ["angel_investor", "competitor_employee", "potential_customer", "champion"] },
          why_relevant:  { type: "string", description: "2-3 sentences: why THIS specific person matters for this product, referencing actual details from their background" },
          outreach_hook: { type: "string", description: "One personalised opening line for a cold outreach message, referencing something real from their profile (a post, project, or role)" },
          email_draft:   { type: "string", description: "A 3-4 sentence cold email draft personalised for this person, referencing their actual background, projects, or public statements. Should feel personal, not templated." },
          persona_query: { type: "string" },
        },
        required: ["name", "title", "company", "contact_type", "why_relevant", "outreach_hook", "email_draft", "persona_query"],
      },
    },
  },
  required: ["contacts"],
};

export async function synthesizeContacts(
  formData: FormData,
  rawProfiles: RawProfile[],
  competitors: Competitor[]
): Promise<EnrichedContact[]> {
  if (rawProfiles.length === 0) return [];

  // Serialize each raw profile into a readable block for Gemini
  const profileBlocks = rawProfiles.map((p, i) => {
    const jobs = p.recent_employment.map((j) => `  - ${j.title ?? "?"} at ${j.company ?? "?"}: ${j.description ?? ""}`).join("\n");
    const projects = p.projects.map((pr) => `  - ${pr.title ?? "?"}: ${pr.description ?? ""}`).join("\n");
    const writings = p.writings.map((w) => `  - "${w.title ?? "?"}": ${w.description ?? ""}`).join("\n");

    return `
PERSON ${i + 1}:
Name: ${p.full_name ?? "Unknown"}
Current role: ${p.current_title ?? "?"} at ${p.current_company ?? "?"}
Tagline: ${p.tagline ?? ""}
LinkedIn: ${p.linkedin_url ?? "not found"}
Summary: ${p.summary_text ?? ""}
Recent jobs:
${jobs || "  (none)"}
Projects:
${projects || "  (none)"}
Writings/Posts:
${writings || "  (none)"}
Original search query: "${p.persona_query}"
`.trim();
  }).join("\n\n---\n\n");

  const competitorNames = competitors.map((c) => c.name).join(", ");

  const prompt = `
You are a GTM strategist and intelligence analyst. You've been given real person profiles researched from a people-intelligence API.
Your job is to analyse each person in the context of a specific product and generate sharp, personalised outreach intelligence.

PRODUCT:
"Helps ${formData.helps} to ${formData.to}"
Target: ${formData.target.join(", ")} | Stage: ${formData.stage}
Known competitors: ${competitorNames}

REAL PROFILES FROM PEOPLE INTELLIGENCE API:
${profileBlocks}

For each person, determine:
1. contact_type: Are they an "angel_investor" (could fund), "competitor_employee" (works at a competitor — insight or partnership value), "potential_customer" (fits the ICP), or "champion" (influencer/advocate who could amplify)?
2. why_relevant: 2-3 sentences referencing SPECIFIC details from their actual background — their company, a project they ran, something they wrote. Don't be generic.
3. outreach_hook: One sentence cold outreach opener that references something real from their profile. It should feel personal, not templated.
4. email_draft: Write a 3-4 sentence cold email for this person. Reference their actual work, a project they built, something they wrote publicly, or their company's mission. Make it feel like it was written specifically for them, not a template.

Return JSON with a "contacts" array. Preserve their name, title, company, linkedin_url, and persona_query exactly as given.
`.trim();

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: SYNTHESIS_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text;
  if (!text) return [];

  const parsed = safeParseJSON<{ contacts: EnrichedContact[] }>(text);
  return parsed.contacts ?? [];
}

// ─── Deep-dive competitor analysis ─

const COMPETITOR_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    analyses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          competitor_name: { type: "string", description: "The competitor's name" },
          what_they_do: { type: "string", description: "One sentence: what this competitor does and who they serve" },
          their_strengths: {
            type: "array",
            description: "2-3 key strengths or competitive advantages of this competitor",
            items: { type: "string" },
          },
          their_weaknesses: {
            type: "array",
            description: "2-3 weaknesses, gaps, or blind spots in this competitor's offering",
            items: { type: "string" },
          },
          your_unique_advantage: {
            type: "string",
            description: "One specific, concrete advantage your product has over this competitor that solves a pain point they ignore",
          },
          focus_area: {
            type: "string",
            description: "What aspect of the market should you focus on to differentiate from this competitor (e.g., 'early-stage founders vs enterprises', 'speed vs customisation')",
          },
        },
        required: ["competitor_name", "what_they_do", "their_strengths", "their_weaknesses", "your_unique_advantage", "focus_area"],
      },
    },
  },
  required: ["analyses"],
};

export async function analyzeCompetitors(
  formData: FormData,
  competitors: Competitor[]
): Promise<CompetitorAnalysis[]> {
  if (competitors.length === 0) return [];

  const competitorList = competitors
    .map((c, i) => `${i + 1}. ${c.name}: ${c.description} (Gap they have: ${c.gap})`)
    .join("\n");

  const prompt = `
You are a competitive strategist. Analyze these competitors relative to a new product.

PRODUCT:
Helps ${formData.helps} to ${formData.to}
Target audience: ${formData.target.join(", ")}
Stage: ${formData.stage}

COMPETITORS:
${competitorList}

For EACH competitor, provide:
1. what_they_do — One sentence summary of their offering and target market
2. their_strengths — 2-3 genuine competitive advantages they have
3. their_weaknesses — 2-3 real gaps or blind spots in their product/positioning
4. your_unique_advantage — ONE specific, concrete way your product is better and solves a pain point they ignore
5. focus_area — Where should you focus to differentiate (e.g., "faster onboarding for small teams" vs "enterprise-grade security", "pay-per-use vs $X/month flat fee")

Be specific and grounded. Reference actual product positioning and known market criticisms. Avoid generic platitudes.

Return ONLY valid JSON with an "analyses" array.
`.trim();

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: COMPETITOR_ANALYSIS_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text;
  if (!text) return [];

  const parsed = safeParseJSON<{ analyses: CompetitorAnalysis[] }>(text);
  return parsed.analyses ?? [];
}
