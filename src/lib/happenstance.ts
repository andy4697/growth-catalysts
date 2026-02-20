import HappenstanceAI from "happenstance-ai";
import type { ResearchRetrieveResponse } from "happenstance-ai/resources/research.js";
import { WildcardInsight, RawProfile, FormData } from "@/types/gtm";

// ─── Mock data ─────────────────────────────────────────────────────────────────
// Domain-neutral professionals — used as fallback when API key is missing or calls fail.

const MOCK_WILDCARDS: WildcardInsight[] = [
  {
    audience: "Procurement officers at mid-market companies",
    rationale:
      "They have budget authority and a strong pain point around your core value prop, but are rarely targeted by software products because they don't attend traditional tech events.",
  },
  {
    audience: "Independent consultants who serve your primary target segment",
    rationale:
      "Force multipliers — one consultant can influence 10–20 buying decisions. Often overlooked because they lack obvious job titles. An affiliate program targeting 10–20 key consultants could unlock thousands of targeted users organically.",
  },
  {
    audience: "Operations leads at fast-growing Series A/B startups",
    rationale:
      "Chronically underserved by enterprise tools and overwhelmed by manual processes. They have budget discretion, move fast, and evangelize tools that work. Reachable through YC alumni networks and startup Slack communities.",
  },
];

export const MOCK_RAW_PROFILES: RawProfile[] = [
  {
    persona_query: "Ideal early adopter persona #1",
    full_name: "Sarah Chen",
    tagline: "Engineering Manager at Stripe, previously Google",
    current_title: "Engineering Manager",
    current_company: "Stripe",
    linkedin_url: "https://linkedin.com/in/sarahchen",
    summary_text:
      "Sarah Chen is an Engineering Manager at Stripe leading a team of 12 engineers across payments infrastructure. Previously at Google for 6 years on the Cloud Platform team. Active on LinkedIn sharing insights about engineering culture, hiring, and team productivity. Passionate about developer tooling and reducing friction in engineering workflows.",
    recent_employment: [
      { title: "Engineering Manager", company: "Stripe", description: "Leading payments infrastructure team" },
      { title: "Senior Software Engineer", company: "Google", description: "Cloud Platform team, developer tooling" },
    ],
    projects: [
      { title: "Internal developer productivity initiative", description: "Led org-wide effort to improve CI/CD pipeline speed by 40%" },
    ],
    writings: [
      { title: "Why I changed how my team does code reviews", description: "LinkedIn post with 8k+ impressions" },
    ],
  },
  {
    persona_query: "Ideal early adopter persona #2",
    full_name: "Marcus Johnson",
    tagline: "Head of Product at a Series B SaaS startup",
    current_title: "Head of Product",
    current_company: "Notion",
    linkedin_url: "https://linkedin.com/in/marcusjohnson",
    summary_text:
      "Marcus Johnson is Head of Product at Notion, focused on enterprise features and team collaboration workflows. Prior to Notion, he was VP Product at a Series B startup that was acquired. Known for product-led growth expertise and has spoken at multiple SaaStr conferences. Regularly posts about PLG, user research, and go-to-market strategy.",
    recent_employment: [
      { title: "Head of Product", company: "Notion", description: "Enterprise product and collaboration features" },
      { title: "VP Product", company: "Almanac (acquired)", description: "Led product through Series B and acquisition" },
    ],
    projects: [
      { title: "PLG Playbook", description: "Open-sourced internal framework for product-led growth metrics" },
    ],
    writings: [
      { title: "The 5 metrics every PLG company should track", description: "Published on Substack, 15k subscribers" },
    ],
  },
  {
    persona_query: "Ideal early adopter persona #3",
    full_name: "Priya Patel",
    tagline: "VP of Operations at a remote-first scale-up",
    current_title: "VP of Operations",
    current_company: "Deel",
    linkedin_url: "https://linkedin.com/in/priyapatel",
    summary_text:
      "Priya Patel is VP of Operations at Deel, the global HR and payroll platform with 3,000+ employees across 100 countries. Responsible for scaling internal operations, tooling, and cross-functional alignment across a fully distributed team. Previously scaled ops at two other remote-first startups. Active voice in the Future of Work community.",
    recent_employment: [
      { title: "VP of Operations", company: "Deel", description: "Scaling global operations and internal tooling for 3,000+ person remote org" },
      { title: "Director of Operations", company: "Remote.com", description: "Built ops team from 5 to 60 people" },
    ],
    projects: [
      { title: "Distributed Team Ops Framework", description: "Authored internal playbook now used across 3 portfolio companies" },
    ],
    writings: [
      { title: "How we onboard 50 people a week across 80 countries", description: "HackerNews front page post, 2k comments" },
    ],
  },
];

function getRandomMock(): WildcardInsight {
  return MOCK_WILDCARDS[Math.floor(Math.random() * MOCK_WILDCARDS.length)];
}

// ─── Research API helpers ──────────────────────────────────────────────────────
// /v1/research  → look up a specific person by description. Works without connections.
// /v1/search    → find people across your LinkedIn connections (requires synced connections).
//
// We use /v1/research for both personas and wildcard because the account may not
// have LinkedIn connections synced (required for /v1/search to return results).

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

function researchToRawProfile(
  result: ResearchRetrieveResponse,
  personaQuery: string
): RawProfile | null {
  const profile = result.profile;
  if (!profile) return null;

  const meta = profile.person_metadata as Record<string, unknown> | undefined;
  const employment = (profile.employment ?? []) as Array<Record<string, unknown>>;
  const projects = (profile.projects ?? []) as Array<Record<string, unknown>>;
  const writings = (profile.writings ?? []) as Array<Record<string, unknown>>;

  const fullName = (meta?.full_name as string) ?? undefined;
  const tagline = (meta?.tagline as string) ?? undefined;
  const linkedinUrl = (meta?.linkedin_url as string) ?? undefined;
  const summaryText = (profile.summary as { text?: string } | undefined)?.text ?? undefined;

  // Get current role from first employment entry
  const firstJob = employment[0] ?? {};
  const currentTitle = (firstJob.title as string) ?? undefined;
  const currentCompany = (firstJob.company as string) ?? undefined;

  return {
    persona_query: personaQuery,
    full_name: fullName,
    tagline,
    current_title: currentTitle,
    current_company: currentCompany,
    linkedin_url: linkedinUrl,
    summary_text: summaryText,
    recent_employment: employment.slice(0, 3).map((e) => ({
      title: (e.title as string) ?? undefined,
      company: (e.company as string) ?? undefined,
      description: (e.description as string) ?? undefined,
    })),
    projects: projects.slice(0, 2).map((p) => ({
      title: (p.title as string) ?? undefined,
      description: (p.description as string) ?? undefined,
    })),
    writings: writings.slice(0, 2).map((w) => ({
      title: (w.title as string) ?? undefined,
      description: (w.description as string) ?? undefined,
    })),
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

    const text = result.profile.summary.text as string;
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

// Uses /v1/research to look up one real person per persona query.
// Falls back to domain-neutral mock profiles if the API is unavailable.
export async function getRawProfiles(
  personaQueries: string[]
): Promise<{ profiles: RawProfile[]; isMocked: boolean }> {
  const apiKey = process.env.HAPPENSTANCE_AI_API_KEY;
  if (!apiKey || apiKey === "your_happenstance_api_key_here") {
    console.log("[Happenstance] No API key — returning mock profiles");
    return { profiles: MOCK_RAW_PROFILES, isMocked: true };
  }

  try {
    const client = new HappenstanceAI({ apiKey });
    console.log("[Happenstance] Starting research for", personaQueries.length, "persona queries");

    // Kick off all research jobs in parallel
    const researchJobs = await Promise.allSettled(
      personaQueries.map(async (query) => {
        const res = await client.research.create({ description: query });
        return { id: res.id, query };
      })
    );

    const started: { id: string; query: string }[] = [];
    researchJobs.forEach((result) => {
      if (result.status === "fulfilled" && result.value?.id) {
        started.push(result.value);
        console.log(`[Happenstance] Research started → id=${result.value.id}`);
      }
    });

    if (started.length === 0) {
      console.warn("[Happenstance] No research jobs started — falling back to mock");
      return { profiles: MOCK_RAW_PROFILES, isMocked: true };
    }

    // Poll all in parallel
    const results = await Promise.allSettled(
      started.map(async ({ id, query }) => {
        const result = await pollResearch(client, id);
        if (!result) {
          console.warn(`[Happenstance] Research ${id} failed or timed out`);
          return null;
        }
        console.log(`[Happenstance] Research ${id} completed`);
        return researchToRawProfile(result, query);
      })
    );

    const profiles: RawProfile[] = results
      .filter((r): r is PromiseFulfilledResult<RawProfile | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((p): p is RawProfile => p !== null);

    if (profiles.length === 0) {
      console.warn("[Happenstance] All research returned empty — falling back to mock");
      return { profiles: MOCK_RAW_PROFILES, isMocked: true };
    }

    console.log(`[Happenstance] Got ${profiles.length} real profiles`);
    return { profiles, isMocked: false };
  } catch (err) {
    console.error("[Happenstance] profiles failed, using mock:", err);
    return { profiles: MOCK_RAW_PROFILES, isMocked: true };
  }
}
