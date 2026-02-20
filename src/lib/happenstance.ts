import HappenstanceAI from "happenstance-ai";
import type { ResearchRetrieveResponse } from "happenstance-ai/resources/research.js";
import { WildcardInsight, RawProfile, FormData } from "@/types/gtm";

// ─── Mock data ─────────────────────────────────────────────────────────────────
// Only used when API key is missing. Reflects realistic Happenstance shapes.

const MOCK_WILDCARDS: WildcardInsight[] = [
  {
    audience: "Procurement officers at mid-market manufacturing companies",
    rationale:
      "This audience has budget authority and a strong pain point around your core value prop, but is rarely targeted by software products because they don't attend traditional tech events.",
  },
  {
    audience: "Independent consultants who serve your primary target segment",
    rationale:
      "They are force multipliers — one consultant can influence 10-20 buying decisions. Often overlooked because they lack obvious job titles. An affiliate program targeting 10-20 key consultants could unlock thousands of targeted users organically.",
  },
  {
    audience: "Operations leads at fast-growing Series A/B startups",
    rationale:
      "Chronically underserved by enterprise tools and overwhelmed by manual processes. They have budget discretion, move fast, and evangelize tools that work. Reachable through YC alumni networks and startup Slack communities.",
  },
];

export const MOCK_RAW_PROFILES: RawProfile[] = [
  {
    persona_query: "Engineering hiring manager at a FAANG company",
    full_name: "David Tisch",
    tagline: "Managing Director at BoxGroup, early-stage investor",
    current_title: "Managing Director",
    current_company: "BoxGroup",
    linkedin_url: "https://linkedin.com/in/davidtisch",
    summary_text:
      "David Tisch is the Managing Director of BoxGroup, a seed-stage venture firm in NYC that has backed over 200 startups including Warby Parker, Vine, and Airtable. He has a strong track record investing in productivity and collaboration tools. Previously co-founded TechStars NYC.",
    recent_employment: [
      { title: "Managing Director", company: "BoxGroup", description: "Seed-stage VC with focus on consumer, SaaS, and productivity tools" },
      { title: "Co-Founder", company: "TechStars NYC", description: "Built the NYC accelerator program from scratch" },
    ],
    projects: [
      { title: "Remote Work Infrastructure Thesis", description: "Active thesis around async-first tools for distributed teams" },
    ],
    writings: [
      { title: "Why async communication is the future of work", description: "Published on Medium, 12k views" },
    ],
  },
  {
    persona_query: "Tech recruiter at a startup hiring engineers",
    full_name: "Monika Fabian",
    tagline: "Head of Product at Loom (acquired by Atlassian)",
    current_title: "Senior Director of Product",
    current_company: "Atlassian (formerly Loom)",
    linkedin_url: "https://linkedin.com/in/monikafahian",
    summary_text:
      "Monika led product at Loom through its $975M acquisition by Atlassian in 2023. Deep expertise in async video communication, user growth, and product-led growth strategies.",
    recent_employment: [
      { title: "Senior Director of Product", company: "Atlassian (Loom)", description: "Leading async video product post-acquisition" },
      { title: "Head of Product Growth", company: "Loom", description: "Scaled Loom from 1M to 25M users through PLG strategies" },
    ],
    projects: [
      { title: "Async-first workflows", description: "Researching structured async meeting replacements" },
    ],
    writings: [],
  },
  {
    persona_query: "Software engineer who recently passed FAANG interview",
    full_name: "Claire Vo",
    tagline: "Chief Product Officer at LaunchDarkly, remote work advocate",
    current_title: "Chief Product Officer",
    current_company: "LaunchDarkly",
    linkedin_url: "https://linkedin.com/in/clairevo",
    summary_text:
      "Claire Vo is the CPO at LaunchDarkly (fully remote, ~400 employees). Vocal advocate for async-first culture. Previously at Optimizely. Runs a newsletter on remote leadership with 8k subscribers.",
    recent_employment: [
      { title: "Chief Product Officer", company: "LaunchDarkly", description: "Led product org at fully-distributed SaaS company" },
      { title: "VP Product", company: "Optimizely", description: "Built experimentation platform product team" },
    ],
    projects: [
      { title: "Async Leadership Newsletter", description: "Weekly newsletter on remote-first leadership, 8k subscribers" },
    ],
    writings: [
      { title: "Why I cancelled all recurring meetings", description: "Viral LinkedIn post, 50k+ impressions" },
    ],
  },
];

function getRandomMock(): WildcardInsight {
  return MOCK_WILDCARDS[Math.floor(Math.random() * MOCK_WILDCARDS.length)];
}

// ─── Search API (direct HTTP — SDK doesn't expose this yet) ────────────────────
// POST /v1/search  → returns { id, url }
// GET  /v1/search/{id} → returns { status, results: SearchPersonV1[] }

interface SearchPersonV1 {
  id: string;
  name: string;
  current_title?: string | null;
  current_company?: string | null;
  summary?: string | null;
  socials?: {
    happenstance_url?: string | null;
    linkedin_url?: string | null;
    twitter_url?: string | null;
  } | null;
}

interface SearchRetrieveResponse {
  id: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  text: string;
  results?: SearchPersonV1[] | null;
  has_more?: boolean;
}

async function createSearch(apiKey: string, query: string): Promise<string | null> {
  const res = await fetch("https://api.happenstance.ai/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: query }),
  });
  if (!res.ok) {
    console.error("[Happenstance] Search create failed:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { id: string };
  return data.id ?? null;
}

async function pollSearch(
  apiKey: string,
  searchId: string,
  maxAttempts = 12,
  intervalMs = 5000
): Promise<SearchRetrieveResponse | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(`https://api.happenstance.ai/v1/search/${searchId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as SearchRetrieveResponse;
    if (data.status === "COMPLETED") return data;
    if (data.status === "FAILED") return null;
  }
  return null;
}

// ─── Research API (via SDK) — for wildcard/specific person lookup ──────────────

async function pollResearch(
  client: HappenstanceAI,
  id: string,
  maxAttempts = 12,
  intervalMs = 5000
): Promise<ResearchRetrieveResponse | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const result = await client.research.retrieve(id);
    if (result.status === "COMPLETED") return result;
    if (result.status === "FAILED" || result.status === "FAILED_AMBIGUOUS") return null;
  }
  return null;
}

// Convert a Happenstance search result person into our RawProfile shape
function searchPersonToRawProfile(person: SearchPersonV1, personaQuery: string): RawProfile {
  return {
    persona_query: personaQuery,
    full_name: person.name || undefined,
    tagline: undefined,
    current_title: person.current_title ?? undefined,
    current_company: person.current_company ?? undefined,
    linkedin_url: person.socials?.linkedin_url ?? undefined,
    summary_text: person.summary ?? undefined,
    recent_employment: person.current_title
      ? [{ title: person.current_title ?? undefined, company: person.current_company ?? undefined, description: undefined }]
      : [],
    projects: [],
    writings: [],
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────────

export async function getWildcardInsight(
  data: FormData
): Promise<{ insight: WildcardInsight; isMocked: boolean }> {
  const apiKey = process.env.HAPPENSTANCE_AI_API_KEY;
  if (!apiKey || apiKey === "your_happenstance_api_key_here") {
    return { insight: getRandomMock(), isMocked: true };
  }

  try {
    const client = new HappenstanceAI({ apiKey });
    const query = `A person who represents an unexpected, non-obvious audience segment for a product that helps ${data.helps} to ${data.to}. This person should NOT be the obvious target customer — they should be from an adjacent space who has the same underlying problem.`;

    const research = await client.research.create({ description: query });
    if (!research?.id) return { insight: getRandomMock(), isMocked: true };

    const result = await pollResearch(client, research.id);
    if (!result?.profile?.summary?.text) return { insight: getRandomMock(), isMocked: true };

    const text = result.profile.summary.text;
    const sentences = text.split(". ").filter(Boolean);
    return {
      insight: {
        audience: sentences[0] ?? text,
        rationale: sentences.slice(1, 3).join(". ").trim() || "Underexplored segment with strong demand alignment.",
      },
      isMocked: false,
    };
  } catch (err) {
    console.error("[Happenstance] wildcard failed, using mock:", err);
    return { insight: getRandomMock(), isMocked: true };
  }
}

// Uses /v1/search (not /v1/research) to find MULTIPLE people matching each persona query.
// This is the correct endpoint — search returns a list of relevant people,
// whereas research looks up a single specific named person.
export async function getRawProfiles(
  personaQueries: string[]
): Promise<{ profiles: RawProfile[]; isMocked: boolean }> {
  const apiKey = process.env.HAPPENSTANCE_AI_API_KEY;
  if (!apiKey || apiKey === "your_happenstance_api_key_here") {
    console.log("[Happenstance] No API key — returning mock profiles");
    return { profiles: MOCK_RAW_PROFILES, isMocked: true };
  }

  try {
    console.log("[Happenstance] Starting search for", personaQueries.length, "persona queries");

    // Kick off all search jobs in parallel
    const searchIds = await Promise.allSettled(
      personaQueries.map((query) => createSearch(apiKey, query))
    );

    const started: { id: string; query: string }[] = [];
    searchIds.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        started.push({ id: result.value, query: personaQueries[i] });
        console.log(`[Happenstance] Search started for "${personaQueries[i].slice(0, 60)}..." → id=${result.value}`);
      }
    });

    if (started.length === 0) {
      console.warn("[Happenstance] No searches started — falling back to mock");
      return { profiles: MOCK_RAW_PROFILES, isMocked: true };
    }

    // Poll all searches in parallel
    const results = await Promise.allSettled(
      started.map(async ({ id, query }) => {
        const result = await pollSearch(apiKey, id);
        if (!result || !result.results || result.results.length === 0) {
          console.warn(`[Happenstance] Search ${id} returned no results`);
          return null;
        }
        console.log(`[Happenstance] Search ${id} returned ${result.results.length} people`);
        // Take the top match for this persona query
        const topPerson = result.results[0];
        return searchPersonToRawProfile(topPerson, query);
      })
    );

    const profiles: RawProfile[] = results
      .filter((r): r is PromiseFulfilledResult<RawProfile | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((p): p is RawProfile => p !== null);

    if (profiles.length === 0) {
      console.warn("[Happenstance] All searches returned empty — falling back to mock");
      return { profiles: MOCK_RAW_PROFILES, isMocked: true };
    }

    console.log(`[Happenstance] Got ${profiles.length} real profiles`);
    return { profiles, isMocked: false };
  } catch (err) {
    console.error("[Happenstance] profiles failed, using mock:", err);
    return { profiles: MOCK_RAW_PROFILES, isMocked: true };
  }
}
