"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Gemini is thinking...",
  "Analyzing your market...",
  "Identifying your ideal customer...",
  "Crafting your pitch...",
  "Finding your best channel...",
  "Surfacing a surprise opportunity...",
  "Almost ready...",
];

function ThinkingDots() {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

export function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-10 min-h-[60vh]">
      {/* Pulsing orb */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 blur-2xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-xl"
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.7, 0.4, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative text-4xl z-10">✨</span>
      </div>

      {/* Rotating message */}
      <div className="text-center space-y-5 w-72">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-lg font-semibold tracking-tight"
          >
            {LOADING_MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
        <ThinkingDots />
      </div>

      <p className="text-xs text-muted-foreground max-w-xs text-center leading-relaxed">
        Running two AI models to build your plan.
        <br />
        This usually takes 15–30 seconds.
      </p>
    </div>
  );
}
