"use client";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["Your product", "Audience", "Stage"];

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(percentage)}% complete</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={`text-xs font-medium transition-colors duration-300 ${
              i + 1 <= currentStep ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
