"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Building2, ExternalLink, Copy, Check, Sparkles, Users2, TrendingUp, Star } from "lucide-react";
import { EnrichedContact } from "@/types/gtm";

interface ContactsSectionProps {
  contacts: EnrichedContact[];
  isMocked: boolean;
}

const CONTACT_TYPE_CONFIG = {
  angel_investor: {
    label: "Angel Investor",
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    gradient: "from-yellow-500 to-amber-600",
  },
  competitor_employee: {
    label: "Competitor Intel",
    icon: TrendingUp,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    gradient: "from-red-500 to-rose-600",
  },
  potential_customer: {
    label: "Potential Customer",
    icon: Users2,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    gradient: "from-blue-500 to-blue-700",
  },
  champion: {
    label: "Champion / Advocate",
    icon: Sparkles,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    gradient: "from-purple-500 to-violet-600",
  },
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-emerald-500 to-emerald-700",
];

function CopyHookButton({ hook }: { hook: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(hook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
      title="Copy outreach hook"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ContactCard({ contact, index }: { contact: EnrichedContact; index: number }) {
  const typeConfig = CONTACT_TYPE_CONFIG[contact.contact_type] ?? CONTACT_TYPE_CONFIG.potential_customer;
  const TypeIcon = typeConfig.icon;
  const avatarGradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  const initials = contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.12 }}
    >
      <Card className="border border-border hover:border-primary/30 transition-all duration-200 hover:shadow-md overflow-hidden">
        {/* Top type bar */}
        <div className={`h-0.5 bg-gradient-to-r ${avatarGradient}`} />

        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
              {initials}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{contact.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-primary font-medium truncate">{contact.title}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{contact.company}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {contact.linkedin_url && (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] transition-colors"
                      title="View on LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact type badge */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={`text-xs ${typeConfig.bg} ${typeConfig.color} border`}>
              <TypeIcon className="w-2.5 h-2.5 mr-1" />
              {typeConfig.label}
            </Badge>
          </div>

          {/* Why relevant — Gemini-generated from real profile */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Why reach out</p>
            <p className="text-xs text-foreground leading-relaxed">{contact.why_relevant}</p>
          </div>

          {/* Outreach hook — personalised first line */}
          <div className="bg-muted/30 rounded-lg px-3 py-2 border border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-green-400 uppercase tracking-wider">Outreach opener</p>
              <CopyHookButton hook={contact.outreach_hook} />
            </div>
            <p className="text-xs text-foreground leading-relaxed italic">&ldquo;{contact.outreach_hook}&rdquo;</p>
          </div>

          {/* Cold email draft — personalised full email */}
          <div className="bg-blue-500/5 rounded-lg px-3 py-2.5 border border-blue-500/20">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">Cold email draft</p>
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{contact.email_draft}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ContactsSection({ contacts, isMocked }: ContactsSectionProps) {
  if (!contacts || contacts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-[#0077B5]/10 flex items-center justify-center">
              <Linkedin className="w-3 h-3 text-[#0077B5]" />
            </span>
            People to Reach Out To
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isMocked
              ? "Sample profiles analysed by Gemini — add Happenstance API key for real people"
              : "Real profiles found by Happenstance · Analysed & enriched by Gemini"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isMocked && (
            <Badge variant="outline" className="text-xs border-dashed">Sample</Badge>
          )}
          <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            AI Enriched
          </Badge>
        </div>
      </div>

      {/* Contact cards */}
      <div className="space-y-3">
        {contacts.map((contact, i) => (
          <ContactCard key={i} contact={contact} index={i} />
        ))}
      </div>

      {!isMocked && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Profiles sourced from Happenstance · Intelligence by Gemini
        </p>
      )}
    </motion.div>
  );
}
