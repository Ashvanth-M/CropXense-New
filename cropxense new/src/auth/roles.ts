/**
 * CropXense Strict 3-Role Architecture & Demo User Accounts.
 *
 * EXACTLY 3 ROLES:
 * 1. Farmer — "My Farm" -> /farmer
 * 2. Field Extension Officer — "Field Operations" -> /app
 * 3. Plant Protection Expert — "Expert Validation" -> /expert
 */

export type UserRole = "farmer" | "officer" | "expert";

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  district: string;
  designation?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  officer: "Field Extension Officer",
  expert: "Plant Protection Expert",
};

export const ROLE_DASHBOARD_NAMES: Record<UserRole, string> = {
  farmer: "My Farm",
  officer: "Field Operations",
  expert: "Expert Validation",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  farmer:
    "Monitor your fields, detect crop threats and receive localized advisories.",
  officer:
    "Monitor reported cases, investigate crop-health problems and coordinate field response.",
  expert:
    "Validate crop-health assessments and provide expert guidance.",
};

/** Where each role lands after authentication. */
export const ROLE_REDIRECT: Record<UserRole, string> = {
  farmer: "/farmer",
  officer: "/app",
  expert: "/expert",
};

/** Pre-seeded demo accounts with shared password for SIH presentations. */
export const DEMO_PASSWORD = "cropxense";

export const DEMO_USERS: DemoUser[] = [
  {
    email: "farmer@cropxense.demo",
    password: DEMO_PASSWORD,
    name: "Ramesh Kumar",
    role: "farmer",
    district: "Akola",
    designation: "Registered Farmer",
  },
  {
    email: "officer@cropxense.demo",
    password: DEMO_PASSWORD,
    name: "Priya Sharma",
    role: "officer",
    district: "Akola",
    designation: "Field Extension Officer",
  },
  {
    email: "expert@cropxense.demo",
    password: DEMO_PASSWORD,
    name: "Dr. Anjali Patil",
    role: "expert",
    district: "Maharashtra",
    designation: "Senior Plant Pathologist",
  },
];
