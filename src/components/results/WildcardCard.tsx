"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { WildcardInsight } from "@/types/gtm";

interface WildcardCardProps {
  insight: WildcardInsight;
  isMocked: boolean;
  index: number;
}

export function WildcardCard({ insight, isMocked, index }: WildcardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
    >
      <div className="wildcard-glow rounded-xl">
        <Card className="border-2 border-yellow-500/60 bg-gradient-to-br from-yellow-950/40 to-amber-950/30 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500" />

          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-400">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-bold uppercase tracking-wider">
                  Surprise Opportunity
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isMocked && (
                  <Badge
                    variant="outline"
                    className="text-xs border-yellow-500/40 text-yellow-600 dark:text-yellow-400/70"
                  >
                    Sample
                  </Badge>
                )}
                <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs">
                  Wildcard ✦
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pb-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-yellow-500/70 mb-1.5">
                Unexpected Audience
              </p>
              <p className="text-sm font-semibold text-yellow-100 leading-snug">
                {insight.audience}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-yellow-500/70 mb-1.5">
                Why this works
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.rationale}
              </p>
            </div>

            <div className="pt-1 border-t border-yellow-500/20">
              <p className="text-xs text-yellow-600 dark:text-yellow-500/60 italic">
                Powered by Happenstance AI — surfaces the opportunity you&apos;d never find on your own.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
