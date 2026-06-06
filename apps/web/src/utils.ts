import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getRiskColor(score: number): string {
  // Health score: higher = better
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-orange-400";
  return "text-red-400";
}

export function getRiskLabel(score: number): string {
  // Health score: higher = better
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 25) return "Fair";
  return "Poor";
}