"use client";

const AUDIENCE_OPTIONS = [
  { id: "startups", label: "Startups", emoji: "🚀" },
  { id: "smbs", label: "SMBs", emoji: "🏢" },
  { id: "enterprise", label: "Enterprise", emoji: "🏛️" },
  { id: "consumers", label: "Consumers", emoji: "👤" },
  { id: "students", label: "Students", emoji: "🎓" },
];

interface StepTwoProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function StepTwo({ selected, onChange }: StepTwoProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Who is it for?</h2>
        <p className="text-muted-foreground text-sm">
          Select all that apply. Your GTM strategy will be tailored to these audiences.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {AUDIENCE_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggle(option.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer
                ${isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                  : "bg-background text-foreground border-border hover:border-primary/60 hover:bg-muted/40"
                }
              `}
            >
              <span>{option.emoji}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selected.length} selected — you can pick multiple
        </p>
      )}
    </div>
  );
}
