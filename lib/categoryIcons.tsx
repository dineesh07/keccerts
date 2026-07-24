/**
 * Category icon helper — returns the JSX icon element for each category.
 * Kept separate from types/events.ts so the pure-data types file stays JSX-free.
 */

import { Code2, BrainCircuit, Zap, Star } from "lucide-react";
import type { Category } from "@/types";

export function getCategoryIcon(category: Category, size = 14) {
  switch (category) {
    case "Coding":    return <Code2       size={size} />;
    case "Quiz":      return <BrainCircuit size={size} />;
    case "Hackathon": return <Zap          size={size} />;
    case "Others":    return <Star         size={size} />;
  }
}
