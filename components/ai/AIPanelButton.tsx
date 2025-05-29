"use client";

import {
  Brain,
} from "lucide-react";
import { useAIPanel } from "./AIPanelContext";

export default function AIPanelButton() {
  const { showAIPanel, setShowAIPanel } = useAIPanel();

  return (
    <button
      className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-slate-100 text-slate-600 hover:text-[#0c77f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c77f2]/40"
      aria-label="Ask AI"
      onClick={() => setShowAIPanel(!showAIPanel)}
    >
      <Brain size={24} />
    </button>
  );
}
