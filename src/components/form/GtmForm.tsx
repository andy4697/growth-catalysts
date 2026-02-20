"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { StepThree } from "./StepThree";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Button } from "@/components/ui/button";
import { FormData } from "@/types/gtm";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface GtmFormProps {
  onSubmit: (data: FormData) => void;
  error: string | null;
}

const TOTAL_STEPS = 3;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export function GtmForm({ onSubmit, error }: GtmFormProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    helps: "",
    to: "",
    target: [],
    stage: "",
  });

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const canProceedStep1 = formData.helps.trim().length > 0 && formData.to.trim().length > 0;
  const canProceedStep2 = formData.target.length > 0;
  const canProceedStep3 = formData.stage.length > 0;

  const canProceed =
    (step === 1 && canProceedStep1) ||
    (step === 2 && canProceedStep2) ||
    (step === 3 && canProceedStep3);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed) {
      if (step < TOTAL_STEPS) {
        goNext();
      } else {
        onSubmit(formData);
      }
    }
  };

  return (
    <div className="w-full max-w-xl" onKeyDown={handleKeyDown}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini AI + Happenstance
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-3">GTM Spark</h1>
        <p className="text-muted-foreground text-base">
          Answer 3 questions. Get your complete Go-To-Market plan.
        </p>
      </motion.div>

      {/* Progress Bar */}
      <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <div className="mt-8 min-h-[280px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            {step === 1 && (
              <StepOne
                helps={formData.helps}
                to={formData.to}
                onChange={(helps, to) =>
                  setFormData((f) => ({ ...f, helps, to }))
                }
              />
            )}
            {step === 2 && (
              <StepTwo
                selected={formData.target}
                onChange={(target) => setFormData((f) => ({ ...f, target }))}
              />
            )}
            {step === 3 && (
              <StepThree
                selected={formData.stage}
                onChange={(stage) => setFormData((f) => ({ ...f, stage }))}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-destructive text-sm mt-4 text-center bg-destructive/10 rounded-lg py-2 px-3"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {step < TOTAL_STEPS ? (
          <Button onClick={goNext} disabled={!canProceed} className="gap-2">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => onSubmit(formData)}
            disabled={!canProceedStep3}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
          >
            <Sparkles className="w-4 h-4" />
            Generate My GTM Plan
          </Button>
        )}
      </div>
    </div>
  );
}
