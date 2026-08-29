/** Fixed demo farmer (Ramesh) helper, maintaining backward compatibility while referencing shared store. */
import { getFarmerFarms } from "@/services";
import type { Farm } from "@/types";

export async function getDemoFarms(user?: any): Promise<Farm[]> {
  return getFarmerFarms(user || null);
}

export const DEMO_OFFICER = { name: "A. Deshmukh", phone: "+91 98230 11234" };
