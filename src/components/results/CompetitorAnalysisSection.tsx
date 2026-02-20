"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Zap, AlertCircle, Shield, Target } from "lucide-react";
import { CompetitorAnalysis } from "@/types/gtm";

interface CompetitorAnalysisSectionProps {
  analyses: CompetitorAnalysis[];
}

function AnalysisCard({ analysis, index }: { analysis: CompetitorAnalysis; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  const colors = [
    { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
    { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
    { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
  ];

  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`border ${color.border} overflow-hidden`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <CardContent className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${expanded ? "" : ""}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{analysis.competitor_name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{analysis.what_they_do}</p>
              </div>
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 mt-0.5"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>

            {/* Strengths badge — always visible */}
            {!expanded && (
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className={`text-xs ${color.bg} ${color.text} border`}>
                  <Shield className="w-2.5 h-2.5 mr-1" />
                  {analysis.their_strengths.length} Strengths
                </Badge>
              </div>
            )}
          </CardContent>
        </button>

        {/* Expanded details */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="border-t border-border"
          >
            <CardContent className="p-4 space-y-4">
              {/* Their strengths */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-green-400">Their Strengths</h5>
                </div>
                <ul className="space-y-1.5 ml-6">
                  {analysis.their_strengths.map((strength, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed list-disc">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Their weaknesses */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-red-400">Their Weaknesses</h5>
                </div>
                <ul className="space-y-1.5 ml-6">
                  {analysis.their_weaknesses.map((weakness, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed list-disc">
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Your unique advantage */}
              <div className="bg-green-500/10 rounded-lg px-3 py-2.5 border border-green-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-green-400" />
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-green-400">Your Advantage</h5>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{analysis.your_unique_advantage}</p>
              </div>

              {/* Focus area */}
              <div className="bg-blue-500/10 rounded-lg px-3 py-2.5 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Target className="w-4 h-4 text-blue-400" />
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-blue-400">Focus Area</h5>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{analysis.focus_area}</p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

export function CompetitorAnalysisSection({ analyses }: CompetitorAnalysisSectionProps) {
  if (!analyses || analyses.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center">
            <Target className="w-3 h-3 text-blue-400" />
          </span>
          Competitive Deep-Dive
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Strengths, weaknesses & your unique advantages vs each competitor
        </p>
      </div>

      {/* Analysis cards */}
      <div className="space-y-2.5">
        {analyses.map((analysis, i) => (
          <AnalysisCard key={i} analysis={analysis} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
