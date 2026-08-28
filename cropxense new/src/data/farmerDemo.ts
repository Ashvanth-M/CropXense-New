/** Fixed demo farmer (Ramesh) used across the /farmer route tree. */
import { getAdvisories, getAssessments, getFarms } from "@/services";
import type { Farm } from "@/types";

const OPEN = ["detected", "awaiting_validation", "expert_confirmed", "field_confirmed"];

/**
 * Returns three fields for the demo farmer, with a field that has an open case
 * and a live advisory first — the farmer app should open on real work, not an
 * empty state.
 */
export async function getDemoFarms(): Promise<Farm[]> {
  const [farms, advisories, assessments] = await Promise.all([
    getFarms({ query: "Ramesh" }),
    getAdvisories(),
    getAssessments(),
  ]);
  const withAdvisory = new Set(advisories.map((a) => a.farmId));
  const withOpenCase = new Set(assessments.filter((a) => OPEN.includes(a.status)).map((a) => a.farmId));

  const score = (f: Farm) =>
    (withAdvisory.has(f.id) ? 0 : 4) + (withOpenCase.has(f.id) ? 0 : 2) + (f.health === "healthy" ? 1 : 0);

  const ranked = [...farms].sort((a, b) => score(a) - score(b));
  const lead = advisories.map((a) => a.farmId).find((id) => !ranked.some((f) => f.id === id));
  if (score(ranked[0]!) > 0 && lead) {
    const all = await getFarms({});
    const leadFarm = all.find((f) => f.id === lead);
    if (leadFarm) return [leadFarm, ...ranked.filter((f) => f.id !== lead)].slice(0, 3);
  }
  return ranked.slice(0, 3);
}

export const DEMO_OFFICER = { name: "A. Deshmukh", phone: "+91 98230 11234" };
