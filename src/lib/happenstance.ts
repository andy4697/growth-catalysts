import HappenstanceAI from "happenstance-ai";
import type { ResearchRetrieveResponse } from "happenstance-ai/resources/research.js";
import { WildcardInsight, RawProfile, FormData } from "@/types/gtm";

// ─── Mock data ────────────────────────────────────────────────────────────────

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

// Rich mock profiles that simulate what Happenstance actually returns —
// used when no API key is set so the Gemini synthesis still has real data to work with
export const MOCK_RAW_PROFILES: RawProfile[] = [
  {
    persona_query: "Angel investor who has funded remote work or async collaboration tools",
    full_name: "David Tisch",
    tagline: "Managing Director at BoxGroup, early-stage investor",
    current_title: "Managing Director",
    current_company: "BoxGroup",
    linkedin_url: "https://linkedin.com/in/davidtisch",
    summary_text:
      "David Tisch is the Managing Director of BoxGroup, a seed-stage venture firm in NYC that has backed over 200 startups including Warby Parker, Vine, and Airtable. He has a strong track record investing in productivity and collaboration tools. Previously co-founded TechStars NYC. Active angel in remote-work infrastructure companies.",
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
    persona_query: "VP Engineering or Head of Product at a direct competitor in async communication tools",
    full_name: "Monika Fabian",
    tagline: "Head of Product at Loom (acquired by Atlassian)",
    current_title: "Senior Director of Product",
    current_company: "Atlassian (formerly Loom)",
    linkedin_url: "https://linkedin.com/in/monikafahian",
    summary_text:
      "Monika led product at Loom through its $975M acquisition by Atlassian in 2023. Deep expertise in async video communication, user growth, and product-led growth strategies. Previously at Facebook and Dropbox. Has publicly discussed the limitations of current async tools and the gap in structured async workflows.",
    recent_employment: [
      { title: "Senior Director of Product", company: "Atlassian (Loom)", description: "Leading async video product post-acquisition" },
      { title: "Head of Product Growth", company: "Loom", description: "Scaled Loom from 1M to 25M users through PLG strategies" },
      { title: "Product Manager", company: "Facebook", description: "Messenger growth team" },
    ],
    projects: [
      { title: "Async-first workflows", description: "Researching structured async meeting replacements — a known gap in Loom's current roadmap" },
    ],
    writings: [],
  },
  {
    persona_query: "Head of Remote Operations or Chief of Staff at a 50-200 person remote-first startup who actively complains about meeting overload",
    full_name: "Claire Vo",
    tagline: "Chief Product Officer at LaunchDarkly, remote work advocate",
    current_title: "Chief Product Officer",
    current_company: "LaunchDarkly",
    linkedin_url: "https://linkedin.com/in/clairevo",
    summary_text:
      "Claire Vo is the CPO at LaunchDarkly (fully remote, ~400 employees). Vocal advocate for async-first culture, has given talks at SaaStr and Config on eliminating synchronous meetings. Previously at Optimizely. Runs a newsletter on remote leadership with 8k subscribers. Has publicly stated she would pay for a better async standup solution.",
    recent_employment: [
      { title: "Chief Product Officer", company: "LaunchDarkly", description: "Led product org at fully-distributed SaaS company" },
      { title: "VP Product", company: "Optimizely", description: "Built experimentation platform product team" },
    ],
    projects: [
      { title: "Async Leadership Newsletter", description: "Weekly newsletter on remote-first leadership, 8k subscribers" },
    ],
    writings: [
      { title: "Why I cancelled all recurring meetings", description: "Viral LinkedIn post, 50k+ impressions" },
      { title: "The async-first playbook", description: "Conference talk at SaaStr 2023" },
    ],
  },
];

function getRandomMock(): WildcardInsight {
  return MOCK_WILDCARDS[Math.floor(Math.random() * MOCK_WILDCARDS.length)];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWildcardQuery(data: FormData): string {
  return `A person who represents an unexpected, non-obvious audience segment for a product that helps ${data.helps} to ${data.to}. This person should NOT be the obvious target customer — they should be from an adjacent space who has the same problem.`;
}

async function pollResearch(
  client: HappenstanceAI,
  id: string,
  maxAttempts = 10,
  intervalMs = 4000
): Promise<ResearchRetrieveResponse | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const result = await client.research.retrieve(id);
    if (result.status === "COMPLETED") return result;
    if (result.status === "FAILED" || result.status === "FAILED_AMBIGUOUS") return null;
  }
  return null;
}

// Convert a raw Happenstance API response into our clean RawProfile shape
function toRawProfile(
  result: ResearchRetrieveResponse,
  personaQuery: string
): RawProfile | null {
  const profile = result.profile;
  if (!profile || !profile.person_metadata?.full_name) return null;

  const recentJobs = (profile.employment ?? [])
    .slice(0, 3)
    .map((e) => ({ title: e.job_title ?? undefined, company: e.company_name ?? undefined, description: e.description ?? undefined }));

  const projects = (profile.projects ?? [])
    .slice(0, 3)
    .map((p) => ({ title: p.title ?? undefined, description: p.description ?? undefined }));

  const writings = (profile.writings ?? [])
    .slice(0, 3)
    .map((w) => ({ title: w.title ?? undefined, description: w.description ?? undefined }));

  const currentJob = profile.employment?.find((e) => !e.end_date) ?? profile.employment?.[0];
  const linkedinUrl = profile.person_metadata.profile_urls?.find((u) => u.includes("linkedin.com"));

  return {
    persona_query: personaQuery,
    full_name: profile.person_metadata.full_name ?? undefined,
    tagline: profile.person_metadata.tagline ?? undefined,
    current_title: currentJob?.job_title ?? undefined,
    current_company: currentJob?.company_name ?? undefined,
    linkedin_url: linkedinUrl,
    summary_text: profile.summary?.text ?? undefined,
    recent_employment: recentJobs,
    projects,
    writings,
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function getWildcardInsight(
  data: FormData
): Promise<{ insight: WildcardInsight; isMocked: boolean }> {
  const apiKey = process.env.HAPPENSTANCE_AI_API_KEY;
  if (!apiKey || apiKey === "your_happenstance_api_key_here") {
    return { insight: getRandomMock(), isMocked: true };
  }

  try {
    const client = new HappenstanceAI({ apiKey });
    const research = await client.research.create({ description: buildWildcardQuery(data) });
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

// Returns raw profiles (not enriched) — Gemini will synthesise these into EnrichedContacts
export async function getRawProfiles(
  personaQueries: string[]
): Promise<{ profiles: RawProfile[]; isMocked: boolean }> {
  const apiKey = process.env.HAPPENSTANCE_AI_API_KEY;
  if (!apiKey || apiKey === "your_happenstance_api_key_here") {
    return { profiles: MOCK_RAW_PROFILES, isMocked: true };
  }

  try {
    const client = new HappenstanceAI({ apiKey });

    // Kick off all research jobs in parallel
    const jobs = await Promise.allSettled(
      personaQueries.map((query) =>
        client.research.create({ description: query }).then((res) => ({ id: res.id, query }))
      )
    );

    const started = jobs
      .filter((j): j is PromiseFulfilledResult<{ id: string; query: string }> => j.status === "fulfilled")
      .map((j) => j.value);

    if (started.length === 0) return { profiles: MOCK_RAW_PROFILES, isMocked: true };

    // Poll all in parallel
    const results = await Promise.allSettled(
      started.map(async ({ id, query }) => {
        const result = await pollResearch(client, id, 10, 4000);
        if (!result) return null;
        return toRawProfile(result, query);
      })
    );

    const profiles: RawProfile[] = results
      .filter((r): r is PromiseFulfilledResult<RawProfile | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((p): p is RawProfile => p !== null);

    if (profiles.length === 0) return { profiles: MOCK_RAW_PROFILES, isMocked: true };
    return { profiles, isMocked: false };
  } catch (err) {
    console.error("[Happenstance] profiles failed, using mock:", err);
    return { profiles: MOCK_RAW_PROFILES, isMocked: true };
  }
}
