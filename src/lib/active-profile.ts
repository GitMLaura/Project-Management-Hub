import { cookies } from "next/headers";
import { PROFILE_COOKIE, resolveProfile, type DemoProfile } from "@/lib/demo-profiles";

// Server-side helper: reads the cookie and returns the active demo profile.
export async function getActiveProfile(): Promise<DemoProfile> {
  const cookieStore = await cookies();
  return resolveProfile(cookieStore.get(PROFILE_COOKIE)?.value);
}
