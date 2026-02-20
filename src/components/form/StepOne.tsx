"use client";

const MAX_CHARS = 80;

interface StepOneProps {
  helps: string;
  to: string;
  onChange: (helps: string, to: string) => void;
}

export function StepOne({ helps, to, onChange }: StepOneProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Describe your product</h2>
        <p className="text-muted-foreground text-sm">
          Complete the sentence below. Be specific — the more precise you are, the better your GTM plan.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            My product helps...
          </label>
          <div className="relative">
            <input
              type="text"
              value={helps}
              onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS), to)}
              placeholder="e.g., early-stage founders"
              className="w-full rounded-lg border-2 border-input bg-background px-5 py-4 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring pr-16 min-h-16"
              autoFocus
            />
            <span className={`absolute right-4 top-4 text-sm font-medium tabular-nums ${helps.length >= MAX_CHARS ? "text-destructive" : "text-muted-foreground"}`}>
              {helps.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            ...to...
          </label>
          <div className="relative">
            <input
              type="text"
              value={to}
              onChange={(e) => onChange(helps, e.target.value.slice(0, MAX_CHARS))}
              placeholder="e.g., build their GTM strategy in minutes"
              className="w-full rounded-lg border-2 border-input bg-background px-5 py-4 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring pr-16 min-h-16"
            />
            <span className={`absolute right-4 top-4 text-sm font-medium tabular-nums ${to.length >= MAX_CHARS ? "text-destructive" : "text-muted-foreground"}`}>
              {to.length}/{MAX_CHARS}
            </span>
          </div>
        </div>
      </div>

      {/* Live preview */}
      {(helps || to) && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-2">Preview</span>
          <span className="font-medium leading-relaxed text-base">
            &ldquo;My product helps{" "}
            <span className={helps ? "text-primary" : "text-muted-foreground italic"}>{helps || "______"}</span>
            {" "}to{" "}
            <span className={to ? "text-primary" : "text-muted-foreground italic"}>{to || "______"}</span>
            &rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
