"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { analyzeImage, validateScreenUpload } from "@/lib/image-analysis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkFeaturePermission } from "@/lib/supabase/spec-permission";

export type ScreenActionResult = { ok: true } | { ok: false; error: string };

// FormData: projectId, featureId, name, file (PNG or JPG, up to 4 MB).
export async function uploadScreen(formData: FormData): Promise<ScreenActionResult> {
  const projectId = formData.get("projectId");
  const featureId = formData.get("featureId");
  const name = formData.get("name");
  const file = formData.get("file");
  if (
    typeof projectId !== "string" ||
    typeof featureId !== "string" ||
    typeof name !== "string" ||
    !(file instanceof File)
  ) {
    return { ok: false, error: "Dados inválidos. Recarregue a página e tente de novo." };
  }

  const problem = validateScreenUpload({ name, size: file.size });
  if (problem) return { ok: false, error: problem };
  const denied = await checkFeaturePermission(projectId, featureId);
  if (denied) return { ok: false, error: denied };

  const bytes = new Uint8Array(await file.arrayBuffer());
  let analysis;
  try {
    analysis = analyzeImage(bytes); // checks the real type from the file's bytes
  } catch (caught) {
    return { ok: false, error: caught instanceof Error ? caught.message : "Imagem inválida." };
  }

  const supabase = createSupabaseServerClient();
  const extension = analysis.type === "png" ? "png" : "jpg";
  const storagePath = `${projectId}/${randomUUID()}.${extension}`;
  const uploaded = await supabase.storage.from("screens").upload(storagePath, bytes, {
    contentType: analysis.type === "png" ? "image/png" : "image/jpeg",
    upsert: false,
  });
  if (uploaded.error) {
    return { ok: false, error: "Não foi possível enviar a imagem. Tente novamente." };
  }

  const { error } = await supabase.from("screens").insert({
    project_id: projectId,
    feature_id: featureId,
    name: name.trim(),
    storage_path: storagePath,
    sha256: analysis.sha256,
    phash: analysis.phash,
    width: analysis.width,
    height: analysis.height,
    size_bytes: file.size,
  });
  if (error) {
    return { ok: false, error: "A imagem foi enviada, mas não foi possível registrar a tela. Tente novamente." };
  }

  revalidatePath(`/projects/${projectId}/spec`, "layout");
  return { ok: true };
}

// Keeps only one screen of a group as the reference. Nothing is deleted (demo has no delete).
export async function setReferenceScreen(
  projectId: string,
  screenId: string,
  groupIds: string[],
): Promise<ScreenActionResult> {
  if (!groupIds.includes(screenId)) return { ok: false, error: "Tela fora do grupo." };

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("screens")
    .select("id, feature_id")
    .eq("project_id", projectId)
    .in("id", groupIds);
  if (error || !data || data.length !== groupIds.length) {
    return { ok: false, error: "Não foi possível carregar as telas do grupo." };
  }

  const features = [...new Set(data.map((row) => row.feature_id as string))];
  for (const featureId of features) {
    const denied = await checkFeaturePermission(projectId, featureId);
    if (denied) return { ok: false, error: denied };
  }

  const cleared = await supabase
    .from("screens")
    .update({ is_reference: false })
    .eq("project_id", projectId)
    .in("id", groupIds);
  if (cleared.error) return { ok: false, error: "Não foi possível atualizar a referência." };
  const marked = await supabase
    .from("screens")
    .update({ is_reference: true })
    .eq("project_id", projectId)
    .eq("id", screenId);
  if (marked.error) return { ok: false, error: "Não foi possível atualizar a referência." };

  revalidatePath(`/projects/${projectId}/spec`, "layout");
  return { ok: true };
}
