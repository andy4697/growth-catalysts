"use client";

const STAGE_OPTIONS = [
  {
    id: "idea",
    label: "Just an idea",
    description: "I haven't built anything yet",
    emoji: "💡",
  },
  {
    id: "built",
    label: "Built it, no users",
    description: "I have a product but no one using it",
    emoji: "🔨",
  },
  {
    id: "users",
    label: "Have some users",
    description: "People are already using my product",
    emoji: "🚀",
  },
];

interface StepThreeProps {
  selected: string;
  onChange: (stage: string) => void;
}

export function StepThree({ selected, onChange }: StepThreeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">What stage are you at?</h2>
        <p className="text-muted-foreground text-sm">
          This shapes the type of GTM advice you&apos;ll get.
        </p>
      </div>

      <div className="space-y-3">
        {STAGE_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`
                w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer
                ${isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/20"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{option.emoji}</span>
                <div className="flex-1">
                  <div className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
