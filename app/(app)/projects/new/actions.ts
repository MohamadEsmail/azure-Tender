"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createProject } from "@/lib/data/projects";
import type { ProjectType } from "@/lib/db/database.types";

export interface NewProjectState {
  error?: string;
}

const VALID_TYPES: ProjectType[] = ["tender", "pitch", "hybrid"];

export async function createProjectAction(
  _prev: NewProjectState,
  formData: FormData,
): Promise<NewProjectState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "اسم المشروع مطلوب." };

  const projectType = String(formData.get("project_type") ?? "tender");
  if (!VALID_TYPES.includes(projectType as ProjectType)) {
    return { error: "نوع المشروع غير صالح." };
  }

  const tracks = formData.getAll("tracks").map(String);
  if (tracks.length === 0) {
    return { error: "اختر مسارًا واحدًا على الأقل." };
  }

  const projectId = await createProject(user.id, {
    title,
    client: String(formData.get("client") ?? "").trim() || undefined,
    contractNo: String(formData.get("contract_no") ?? "").trim() || undefined,
    deadline: String(formData.get("deadline") ?? "") || undefined,
    projectType: projectType as ProjectType,
    tracks,
  });

  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}`);
}
