"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PROFILE_COOKIE, isDemoProfileId } from "@/lib/demo-profiles";

export type SwitchProfileResult = { ok: true } | { ok: false; error: string };

export async function switchProfile(
  profileId: string,
): Promise<SwitchProfileResult> {
  // Validate on the server: the browser can send any value.
  if (!isDemoProfileId(profileId)) {
    return { ok: false, error: "Perfil inválido. Escolha um dos perfis da lista." };
  }

  const cookieStore = await cookies();
  cookieStore.set(PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
