"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface GtmCardProps {
  title: string;
  content: string;
  icon: LucideIcon;
  index: number;
  accentColor?: string;
}

export function GtmCard({
  title,
  content,
  icon: Icon,
  index,
  accentColor = "border-l-primary",
}: GtmCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: "easeOut" }}
    >
      <Card className={`border-l-4 ${accentColor} hover:shadow-md transition-shadow duration-200`}>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm leading-relaxed text-foreground">{content}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
