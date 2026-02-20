import { GoogleGenAI } from "@google/genai";
import { GeminiOutput, EnrichedContact, RawProfile, FormData, Competitor } from "@/types/gtm";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
2. persona_queries — describe 3 REAL types of people to reach out to. Be very specific: job title, company size/type, location if relevant, and a behavioral signal (e.g. "has complained about X on LinkedIn"). These descriptions will be fed into a people-search API to find actual individuals.
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

  const response = await ai.models.generateContent({
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
          persona_query: { type: "string" },
        },
        required: ["name", "title", "company", "contact_type", "why_relevant", "outreach_hook", "persona_query"],
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

Return JSON with a "contacts" array. Preserve their name, title, company, linkedin_url, and persona_query exactly as given.
`.trim();

  const response = await ai.models.generateContent({
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
