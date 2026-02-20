"use client";
import { useState } from "react";
import { GtmForm } from "@/components/form/GtmForm";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { ResultsView } from "@/components/results/ResultsView";
import { FormData, GtmPlan } from "@/types/gtm";

type AppScreen = "form" | "loading" | "results";

export default function HomePage() {
  const [screen, setScreen] = useState<AppScreen>("form");
  const [plan, setPlan] = useState<GtmPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: FormData) => {
    setError(null);
    setScreen("loading");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Generation failed");
      }

      const { plan: generatedPlan } = await res.json();
      setPlan(generatedPlan);
      setScreen("results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setScreen("form");
    }
  };

  const handleStartOver = () => {
    setPlan(null);
    setError(null);
    setScreen("form");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {screen === "form" && (
        <GtmForm onSubmit={handleFormSubmit} error={error} />
      )}
      {screen === "loading" && <LoadingScreen />}
      {screen === "results" && plan && (
        <ResultsView plan={plan} onStartOver={handleStartOver} />
      )}
    </main>
  );
}
