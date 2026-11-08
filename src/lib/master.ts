import type { LineStatus, MasterHealth } from "@/lib/types";

export const MASTER_HEALTH: Record<MasterHealth, { label: string; className: string }> = {
  healthy: { label: "Ready", className: "status--healthy" },
  needs: { label: "Needs stock", className: "status--low" },
  critical: { label: "Critical", className: "status--out" }
};

export const ITEM_HEALTH: Record<MasterHealth, { label: string; className: string }> = {
  healthy: { label: "Covered", className: "status--healthy" },
  needs: { label: "Needs stock", className: "status--low" },
  critical: { label: "Critical", className: "status--out" }
};

export const LINE_HEALTH: Record<LineStatus, { label: string; className: string }> = {
  covered: { label: "Covered", className: "status--healthy" },
  short: { label: "Short", className: "status--low" },
  missing: { label: "Missing", className: "status--out" }
};

export function coverageOf(covered: number, total: number) {
  return total > 0 ? Math.round((covered / total) * 100) : 100;
}

export function lineStatusOf(required: number, onHand: number): LineStatus {
  if (onHand >= required) return "covered";
  return onHand <= 0 ? "missing" : "short";
}

export function centreHealthOf(input: {
  requiredUnits: number;
  shortfallUnits: number;
  coveredCount: number;
  missingCount: number;
  lineCount: number;
}): MasterHealth {
  if (input.shortfallUnits <= 0) return "healthy";
  const shortfallShare = input.shortfallUnits / Math.max(1, input.requiredUnits);
  return input.missingCount >= 2 ||
    shortfallShare >= 0.4 ||
    input.coveredCount / Math.max(1, input.lineCount) < 0.5
    ? "critical"
    : "needs";
}

export function itemHealthOf(input: {
  shortfallUnits: number;
  missingCount: number;
  coverage: number;
}): MasterHealth {
  if (input.shortfallUnits <= 0) return "healthy";
  return input.missingCount >= 4 || input.coverage < 50 ? "critical" : "needs";
}

export function departmentHealthOf(input: {
  shortfallUnits: number;
  coverage: number;
  missingCount: number;
  lineCount: number;
}): MasterHealth {
  if (input.shortfallUnits <= 0) return "healthy";
  return input.coverage < 55 || input.missingCount / Math.max(1, input.lineCount) >= 0.12
    ? "critical"
    : "needs";
}

export function locationStatusOf(shortfall: number, onHand: number): LineStatus {
  if (shortfall <= 0) return "covered";
  return onHand <= 0 ? "missing" : "short";
}

export function centreTypeClass(type: string) {
  return String(type || "Centre").toLowerCase();
}
