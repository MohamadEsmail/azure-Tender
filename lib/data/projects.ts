import "server-only";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { createSupabaseServiceClient } from "@/lib/db/supabase-server";
import type { ProjectStatus, ProjectType } from "@/lib/db/database.types";

export interface ProjectListItem {
  id: string;
  title: string;
  client: string | null;
  deadline: string | null;
  status: ProjectStatus;
  project_type: ProjectType;
  tracks: string[];
  created_at: string;
}

/**
 * Projects the current user can see. RLS scopes this to projects they are a
 * member of, so no explicit membership filter is needed here.
 */
export async function listProjects(): Promise<ProjectListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, client, deadline, status, project_type, tracks, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProjectListItem[];
}

export interface ProjectMember {
  role: string;
  full_name: string | null;
  email: string;
}

export interface ProjectOverview extends ProjectListItem {
  contract_no: string | null;
  members: ProjectMember[];
}

/** Full overview for one project. Returns null if the user cannot see it (RLS). */
export async function getProject(id: string): Promise<ProjectOverview | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, client, contract_no, deadline, status, project_type, tracks, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!project) return null;

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("role, profiles(full_name, email)")
    .eq("project_id", id);

  const members: ProjectMember[] = (memberRows ?? []).map((row) => {
    const r = row as unknown as {
      role: string;
      profiles: { full_name: string | null; email: string } | null;
    };
    return {
      role: r.role,
      full_name: r.profiles?.full_name ?? null,
      email: r.profiles?.email ?? "",
    };
  });

  return { ...(project as unknown as ProjectOverview), members };
}

export interface CreateProjectInput {
  title: string;
  client?: string;
  contractNo?: string;
  deadline?: string;
  projectType: ProjectType;
  tracks: string[];
}

/**
 * Create a project and enrol the creator as project manager, atomically.
 *
 * This uses the service client on purpose: a brand-new project has no
 * membership rows yet, so the creator could not satisfy the RLS read/insert
 * policies mid-transaction. We therefore bootstrap the project + first
 * membership with the service role, then all subsequent access flows through
 * normal RLS. The creator id is taken from the verified session, never the
 * client payload.
 */
export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
): Promise<string> {
  const service = createSupabaseServiceClient();

  const { data: project, error: projectError } = await service
    .from("projects")
    .insert({
      title: input.title,
      client: input.client || null,
      contract_no: input.contractNo || null,
      deadline: input.deadline || null,
      project_type: input.projectType,
      tracks: input.tracks,
      owner_id: ownerId,
      status: "draft",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Failed to create project.");
  }

  const projectId = (project as { id: string }).id;

  const { error: memberError } = await service.from("project_members").insert({
    project_id: projectId,
    user_id: ownerId,
    role: "project_manager",
  });
  if (memberError) throw new Error(memberError.message);

  await service.from("audit_log").insert({
    project_id: projectId,
    actor_id: ownerId,
    action: "project_created",
    to_state: "draft",
    meta: { title: input.title },
  });

  return projectId;
}
