import { GoogleGenAI } from "@google/genai";
import { GeminiOutput, EnrichedContact, FormData, Competitor, CompetitorAnalysis } from "@/types/gtm";

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

// ─── Step 2: Gemini generates realistic domain-specific contacts ──────────────
// Replaces the Happenstance search flow entirely. Gemini creates real-seeming
// professionals based on the persona queries — faster, always domain-relevant.

const CONTACTS_SCHEMA = {
  type: "object",
  properties: {
    contacts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name:          { type: "string", description: "Full name of a realistic professional" },
          title:         { type: "string", description: "Their current job title" },
          company:       { type: "string", description: "Their current employer — a real company in this space" },
          linkedin_url:  { type: "string", description: "A realistic LinkedIn URL (linkedin.com/in/firstname-lastname)" },
          contact_type:  { type: "string", enum: ["angel_investor", "competitor_employee", "potential_customer", "champion"] },
          why_relevant:  { type: "string", description: "2-3 sentences: why this specific person is relevant to the product, referencing their role, company, and background" },
          outreach_hook: { type: "string", description: "One personalised opening line for cold outreach that references something specific about their role or company" },
          email_draft:   { type: "string", description: "A 3-4 sentence cold email personalised for this person, referencing their background and showing you understand their world. End with a single specific ask." },
          persona_query: { type: "string", description: "The original persona description this person represents" },
        },
        required: ["name", "title", "company", "linkedin_url", "contact_type", "why_relevant", "outreach_hook", "email_draft", "persona_query"],
      },
    },
  },
  required: ["contacts"],
};

export async function generateContacts(
  formData: FormData,
  personaQueries: string[],
  competitors: Competitor[]
): Promise<EnrichedContact[]> {
  if (personaQueries.length === 0) return [];

  const competitorNames = competitors.map((c) => c.name).join(", ");
  const personaList = personaQueries.map((q, i) => `${i + 1}. ${q}`).join("\n");

  const prompt = `
You are a GTM strategist. Generate ${personaQueries.length} realistic professional contacts for this product.

PRODUCT: "Helps ${formData.helps} to ${formData.to}"
Target: ${formData.target.join(", ")} | Stage: ${formData.stage}
Known competitors: ${competitorNames || "none specified"}

PERSONA TYPES TO FIND (one contact per persona):
${personaList}

For each persona, create ONE realistic professional who fits that description. Use real companies and plausible names. Assign a contact_type:
- "potential_customer": fits the ICP and would benefit from this product
- "champion": influencer, advisor, or community leader who could amplify the product
- "angel_investor": could invest or advise at this stage
- "competitor_employee": works at a competitor and has insight or partnership value

Make the email_draft feel personal and specific to their role and company — not a generic template. Reference their actual work context.

Return JSON with a "contacts" array.
`.trim();

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: CONTACTS_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 4096,
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
You are a competitive strategist. Briefly analyze these competitors.

PRODUCT: Helps ${formData.helps} to ${formData.to}
TARGET: ${formData.target.join(", ")} | STAGE: ${formData.stage}

COMPETITORS:
${competitorList}

For each competitor, provide:
1. what_they_do: One sentence summary
2. their_strengths: 2-3 key advantages (bullet points)
3. their_weaknesses: 2-3 key gaps (bullet points)
4. your_unique_advantage: ONE concrete advantage your product has
5. focus_area: Your differentiation angle

Be concise and specific. Return valid JSON with "analyses" array.
`.trim();

  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: COMPETITOR_ANALYSIS_SCHEMA,
      temperature: 0.6,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) return [];

  const parsed = safeParseJSON<{ analyses: CompetitorAnalysis[] }>(text);
  return parsed.analyses ?? [];
}
