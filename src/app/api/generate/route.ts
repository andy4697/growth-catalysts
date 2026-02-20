import { NextRequest, NextResponse } from "next/server";
import { callGemini, generateContacts, analyzeCompetitors } from "@/lib/gemini";
import { getWildcardInsight } from "@/lib/happenstance";
import { GenerateRequest, GtmPlan } from "@/types/gtm";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!body.helps?.trim() || !body.to?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: helps and to" },
        { status: 400 },
      );
    }
    if (!body.target || body.target.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one target audience" },
        { status: 400 },
      );
    }
    if (!body.stage) {
      return NextResponse.json(
        { error: "Please select a product stage" },
        { status: 400 },
      );
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
        {
          error:
            "Failed to generate GTM plan. Please check your Gemini API key.",
        },
        { status: 502 },
      );
    }

    const personaQueries = geminiOutput.persona_queries ?? [];
    const competitors = geminiOutput.competitors ?? [];

    // ── Step 2, 3 & 4: Wildcard Insight, Contacts Generation + Competitor Analysis in parallel ────────
    const [wildcardResult, contactsResult, competitorResult] =
      await Promise.allSettled([
        getWildcardInsight(formData),
        personaQueries.length > 0
          ? generateContacts(formData, personaQueries, competitors)
          : Promise.resolve([]),
        competitors.length > 0
          ? analyzeCompetitors(formData, competitors)
          : Promise.resolve([]),
      ]);

    const wildcardData =
      wildcardResult.status === "fulfilled"
        ? wildcardResult.value
        : {
            insight: {
              audience: "Unexpected power users in adjacent communities",
              rationale:
                "Your product may resonate strongly with users from a different industry vertical who share the core problem — often with higher willingness to pay.",
            },
            isMocked: true,
          };

    let enrichedContacts: import("@/types/gtm").EnrichedContact[] = [];
    let competitorAnalysis: import("@/types/gtm").CompetitorAnalysis[] = [];
    let contactsMocked = false;

    try {
      if (contactsResult.status === "fulfilled") {
        enrichedContacts = contactsResult.value;
      } else {
        console.error(
          "[Gemini] Step 2 contacts generation failed:",
          contactsResult.reason,
        );
        contactsMocked = true;
      }
    } catch (err) {
      console.error("[Gemini] Step 2 contacts generation failed:", err);
      contactsMocked = true;
    }

    try {
      if (competitorResult.status === "fulfilled") {
        competitorAnalysis = competitorResult.value;
      } else {
        console.error(
          "[Gemini] Step 4 competitor analysis failed:",
          competitorResult.reason,
        );
      }
    } catch (err) {
      console.error("[Gemini] Step 4 competitor analysis failed:", err);
    }

    // Add competitor analysis to gemini output
    geminiOutput.competitor_analysis = competitorAnalysis;

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
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
