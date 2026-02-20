export interface FormData {
  helps: string;
  to: string;
  target: string[];
  stage: string;
}

export interface GeminiOutput {
  icp: string;
  channel: string;
  pitch: string;
  pricing: string;
  persona_queries: string[];
  competitors: Competitor[];
  competitor_analysis?: CompetitorAnalysis[]; // Deep-dive on each competitor
}

export interface Competitor {
  name: string;
  description: string;
  gap: string;
  url?: string;
}

// Raw profile data straight from Happenstance — passed to Gemini for synthesis
export interface RawProfile {
  persona_query: string;
  full_name?: string;
  tagline?: string;
  current_title?: string;
  current_company?: string;
  linkedin_url?: string;
  summary_text?: string;
  recent_employment: Array<{
    title?: string;
    company?: string;
    description?: string;
  }>;
  projects: Array<{ title?: string; description?: string }>;
  writings: Array<{ title?: string; description?: string }>;
}

// Enriched contact after Gemini synthesises the raw Happenstance profile
export interface EnrichedContact {
  name: string;
  title: string;
  company: string;
  linkedin_url?: string;
  // Why this person specifically — Gemini-generated based on their actual profile
  why_relevant: string;
  // Personalised first-line for outreach — Gemini-generated from their real background
  outreach_hook: string;
  // Angel investor / competitor employee / potential customer / champion
  contact_type: "angel_investor" | "competitor_employee" | "potential_customer" | "champion";
  persona_query: string;
  // Personalised cold email draft — written by Gemini referencing their actual background
  email_draft: string;
}

export interface CompetitorAnalysis {
  competitor_name: string;
  what_they_do: string;
  their_strengths: string[];
  their_weaknesses: string[];
  your_unique_advantage: string;
  focus_area: string; // What you should focus on vs this competitor
}

export interface WildcardInsight {
  audience: string;
  rationale: string;
}

export interface GtmPlan {
  gemini: GeminiOutput;
  wildcard: WildcardInsight;
  contacts: EnrichedContact[];
  isMocked: boolean;
  contactsMocked: boolean;
}

export interface GenerateRequest {
  helps: string;
  to: string;
  target: string[];
  stage: string;
}

export interface GenerateResponse {
  plan: GtmPlan;
}

export interface GenerateError {
  error: string;
}
