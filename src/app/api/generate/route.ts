import { NextRequest, NextResponse } from "next/server";
import { callGemini, synthesizeContacts } from "@/lib/gemini";
import { getWildcardInsight, getRawProfiles } from "@/lib/happenstance";
import { GenerateRequest, GtmPlan } from "@/types/gtm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!body.helps?.trim() || !body.to?.trim()) {
      return NextResponse.json({ error: "Missing required fields: helps and to" }, { status: 400 });
    }
    if (!body.target || body.target.length === 0) {
      return NextResponse.json({ error: "Please select at least one target audience" }, { status: 400 });
    }
    if (!body.stage) {
      return NextResponse.json({ error: "Please select a product stage" }, { status: 400 });
    }

    const formData = {
      helps: body.helps.trim(),
      to: body.to.trim(),
      target: body.target,
      stage: body.stage,
    };

    // ── Step 1: Gemini generates GTM plan + persona queries + competitors ──────
    let geminiOutput;
    try {
      geminiOutput = await callGemini(formData);
    } catch (err) {
      console.error("[Gemini] Step 1 failed:", err);
      return NextResponse.json(
        { error: "Failed to generate GTM plan. Please check your Gemini API key." },
        { status: 502 }
      );
    }

    const personaQueries = geminiOutput.persona_queries ?? [];
    const competitors = geminiOutput.competitors ?? [];

    // ── Step 2: Happenstance + wildcard run in parallel ────────────────────────
    const [profilesResult, wildcardResult] = await Promise.allSettled([
      getRawProfiles(personaQueries),
      getWildcardInsight(formData),
    ]);

    const profilesData =
      profilesResult.status === "fulfilled"
        ? profilesResult.value
        : { profiles: [], isMocked: true };

    const wildcardData =
      wildcardResult.status === "fulfilled"
        ? wildcardResult.value
        : {
            insight: {
              audience: "Unexpected power users in adjacent communities",
              rationale: "Your product may resonate strongly with users from a different industry vertical who share the core problem — often with higher willingness to pay.",
            },
            isMocked: true,
          };

    // ── Step 3: Gemini reads the real profiles and generates enriched intel ────
    let enrichedContacts: import("@/types/gtm").EnrichedContact[] = [];
    let contactsMocked = profilesData.isMocked;

    try {
      if (profilesData.profiles.length > 0) {
        enrichedContacts = await synthesizeContacts(formData, profilesData.profiles, competitors);
      }
    } catch (err) {
      console.error("[Gemini] Step 3 synthesis failed:", err);
      // Non-fatal — contacts will be empty but the rest of the plan still shows
      enrichedContacts = [];
      contactsMocked = true;
    }

    const plan: GtmPlan = {
      gemini: geminiOutput,
      wildcard: wildcardData.insight,
      contacts: enrichedContacts,
      isMocked: wildcardData.isMocked,
      contactsMocked,
    };

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[/api/generate] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
