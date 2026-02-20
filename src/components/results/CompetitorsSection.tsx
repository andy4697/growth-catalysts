"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, ExternalLink, TrendingUp } from "lucide-react";
import { Competitor } from "@/types/gtm";

interface CompetitorsSectionProps {
  competitors: Competitor[];
}

const RANK_COLORS = [
  { border: "border-l-red-500", badge: "bg-red-500/10 text-red-400 border-red-500/30" },
  { border: "border-l-orange-500", badge: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  { border: "border-l-yellow-500", badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
];

function CompetitorCard({ competitor, index }: { competitor: Competitor; index: number }) {
  const style = RANK_COLORS[index % RANK_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={`border-l-4 ${style.border} hover:shadow-md transition-shadow duration-200`}>
        <CardContent className="p-4 space-y-2.5">
          {/* Name + link */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{competitor.name}</span>
              {competitor.url && (
                <a
                  href={competitor.url.startsWith("http") ? competitor.url : `https://${competitor.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title={`Visit ${competitor.name}`}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <Badge variant="outline" className={`text-xs shrink-0 ${style.badge}`}>
              Competitor #{index + 1}
            </Badge>
          </div>

          {/* What they do */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {competitor.description}
          </p>

          {/* Your gap / opportunity */}
          <div className="bg-muted/30 rounded-lg px-3 py-2 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs font-medium text-green-500 uppercase tracking-wider">
                Your opportunity
              </span>
            </div>
            <p className="text-xs leading-relaxed text-foreground">{competitor.gap}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CompetitorsSection({ competitors }: CompetitorsSectionProps) {
  if (!competitors || competitors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center">
            <Swords className="w-3 h-3 text-red-400" />
          </span>
          Competitive Landscape
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Who&apos;s already in this space — and where you can win
        </p>
      </div>

      {/* Competitor cards */}
      <div className="space-y-2.5">
        {competitors.map((competitor, i) => (
          <CompetitorCard key={i} competitor={competitor} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
