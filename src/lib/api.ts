import { supabase } from "@/lib/supabase";
import { interviewStatuses, trackerStatuses, type InterviewItem, type InterviewStatus, type Job, type JobTrackerItem, type Roadmap, type RoadmapStep, type TrackerStatus, type UserDocument } from "@/types/data";
import { toUtcIsoFromManilaLocal } from "@/lib/time";
type FilterScope = "all" | "owned";

async function getActiveUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }
  if (!session?.user.id) {
    throw new Error("No active user session");
  }

  return session.user.id;
}

export async function getUserDocument() {
  const userId = await getActiveUserId();
  const [{ data: resumeData, error: resumeError }, { data: coverLetterData, error: coverLetterError }] =
    await Promise.all([
      supabase.from("resumes").select("user_id, content").eq("user_id", userId).maybeSingle<{ user_id: string; content: UserDocument["resume_json"] }>(),
      supabase
        .from("cover_letters")
        .select("user_id, content")
        .eq("user_id", userId)
        .maybeSingle<{ user_id: string; content: string }>(),
    ]);

  if (resumeError) {
    throw resumeError;
  }
  if (coverLetterError) {
    throw coverLetterError;
  }

  if (!resumeData && !coverLetterData) {
    return null;
  }

  return {
    user_id: userId,
    resume_json: resumeData?.content ?? {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      github: "",
      summary: "",
      experience: [],
      education: [],
      skills: [],
    },
    cover_letter: coverLetterData?.content ?? "",
  } satisfies UserDocument;
}

export async function upsertUserDocument(payload: Omit<UserDocument, "user_id">) {
  const userId = await getActiveUserId();
  const [resumeResult, coverLetterResult] = await Promise.all([
    supabase
      .from("resumes")
      .upsert(
        {
          user_id: userId,
          content: payload.resume_json,
        },
        { onConflict: "user_id" },
      ),
    supabase
      .from("cover_letters")
      .upsert(
        {
          user_id: userId,
          content: payload.cover_letter,
        },
        { onConflict: "user_id" },
      ),
  ]);

  if (resumeResult.error) {
    throw resumeResult.error;
  }
  if (coverLetterResult.error) {
    throw coverLetterResult.error;
  }
}

export async function listJobs(scope: FilterScope = "all") {
  let query = supabase.from("job_listings").select("*").order("created_at", { ascending: false });
  if (scope === "owned") {
    const userId = await getActiveUserId();
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    company: item.company,
    location: item.location ?? "Remote",
    description: item.description ?? "",
    apply_url: item.apply_url ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    created_at: item.created_at,
    user_id: item.user_id,
  })) as Job[];
}

export async function getJobById(id: string) {
  const { data, error } = await supabase.from("job_listings").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    title: data.title,
    company: data.company,
    location: data.location ?? "Remote",
    description: data.description ?? "",
    apply_url: data.apply_url ?? null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    created_at: data.created_at,
    user_id: data.user_id,
  } satisfies Job;
}

export async function createJob(job: Omit<Job, "id" | "created_at" | "user_id">) {
  const userId = await getActiveUserId();
  const { error } = await supabase.from("job_listings").insert({
    ...job,
    apply_url: job.apply_url ?? null,
    user_id: userId,
  });
  if (error) {
    throw error;
  }
}

export async function updateJob(id: string, payload: Omit<Job, "id" | "created_at" | "user_id">) {
  const userId = await getActiveUserId();
  const { error } = await supabase
    .from("job_listings")
    .update({
      title: payload.title,
      company: payload.company,
      location: payload.location,
      description: payload.description,
      apply_url: payload.apply_url ?? null,
      tags: payload.tags,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function deleteJob(id: string) {
  const userId = await getActiveUserId();
  const { error } = await supabase.from("job_listings").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    throw error;
  }
}

function normalizeTrackerStatus(value: unknown): TrackerStatus {
  if (typeof value === "string" && trackerStatuses.includes(value as TrackerStatus)) {
    return value as TrackerStatus;
  }
  return "viewed";
}

function mapTrackerItem(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    user_id: String(item.user_id),
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    source_url: String(item.source_url ?? ""),
    source_type: item.source_type === "listing" ? "listing" : "external",
    source_job_id: typeof item.source_job_id === "string" ? item.source_job_id : null,
    status: normalizeTrackerStatus(item.status),
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
    updated_at: typeof item.updated_at === "string" ? item.updated_at : undefined,
  } satisfies JobTrackerItem;
}

function normalizeInterviewStatus(value: unknown): InterviewStatus {
  if (typeof value === "string" && interviewStatuses.includes(value as InterviewStatus)) {
    return value as InterviewStatus;
  }
  return "upcoming";
}

export async function listTrackerItems() {
  const userId = await getActiveUserId();
  const { data, error } = await supabase
    .from("job_tracker_items")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    throw error;
  }
  return (data ?? []).map((item) => mapTrackerItem(item as Record<string, unknown>));
}

export async function listAppliedTrackerItems() {
  const items = await listTrackerItems();
  return items.filter((item) => item.status === "applied");
}

export async function createTrackerItem(payload: {
  title: string;
  description: string;
  source_url: string;
  source_type: "listing" | "external";
  source_job_id?: string | null;
  status?: TrackerStatus;
}) {
  const userId = await getActiveUserId();
  const { error } = await supabase.from("job_tracker_items").insert({
    user_id: userId,
    title: payload.title,
    description: payload.description,
    source_url: payload.source_url,
    source_type: payload.source_type,
    source_job_id: payload.source_job_id ?? null,
    status: payload.status ?? "viewed",
  });
  if (error) {
    throw error;
  }
}

export async function updateTrackerStatus(id: string, status: TrackerStatus) {
  const userId = await getActiveUserId();
  const { error } = await supabase
    .from("job_tracker_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

function mapInterviewItem(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    user_id: String(item.user_id),
    tracker_item_id: String(item.tracker_item_id),
    job_name: String(item.job_name ?? ""),
    interview_date: String(item.interview_date ?? ""),
    status: normalizeInterviewStatus(item.status),
    created_at: typeof item.created_at === "string" ? item.created_at : undefined,
    updated_at: typeof item.updated_at === "string" ? item.updated_at : undefined,
  } satisfies InterviewItem;
}

export async function listInterviews() {
  const userId = await getActiveUserId();
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("user_id", userId)
    .order("interview_date", { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map((item) => mapInterviewItem(item as Record<string, unknown>));
}

export async function createInterview(payload: { trackerItemId: string; jobName: string; interviewDate: string }) {
  const userId = await getActiveUserId();
  const interviewUtc = toUtcIsoFromManilaLocal(payload.interviewDate);
  const { error } = await supabase.from("interviews").insert({
    user_id: userId,
    tracker_item_id: payload.trackerItemId,
    job_name: payload.jobName,
    interview_date: interviewUtc,
    status: "upcoming",
  });
  if (error) {
    throw error;
  }
}

export async function updateInterviewStatus(id: string, status: InterviewStatus) {
  const userId = await getActiveUserId();
  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("tracker_item_id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<{ tracker_item_id: string }>();
  if (fetchError) {
    throw fetchError;
  }
  if (!interview) {
    throw new Error("Interview not found");
  }

  const { error } = await supabase
    .from("interviews")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }

  if (status === "done") {
    await updateTrackerStatus(interview.tracker_item_id, "interviewed");
  }
  if (status === "cancelled") {
    await updateTrackerStatus(interview.tracker_item_id, "rejected");
  }
}

export async function createTrackerItemFromJob(jobId: string) {
  const userId = await getActiveUserId();
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  const { data: existing, error: existingError } = await supabase
    .from("job_tracker_items")
    .select("id")
    .eq("user_id", userId)
    .eq("source_job_id", job.id)
    .limit(1);
  if (existingError) {
    throw existingError;
  }
  if ((existing ?? []).length > 0) {
    throw new Error("Job already exists in tracker");
  }

  await createTrackerItem({
    title: `${job.title} at ${job.company}`,
    description: job.description,
    source_type: "listing",
    source_job_id: job.id,
    source_url: `/app/jobs/${job.id}`,
    status: "viewed",
  });
}

function parseRoadmapSteps(steps: unknown, roadmapId: string, createdAt: string, userId: string) {
  const rawSteps = Array.isArray(steps) ? steps : [];
  return rawSteps
    .map((step, index) => {
      const candidate = typeof step === "object" && step !== null ? step : {};
      const resources = Array.isArray((candidate as { resources?: unknown }).resources)
        ? ((candidate as { resources?: Array<{ url?: string }> }).resources ?? [])
        : [];
      return {
        id:
          typeof (candidate as { id?: unknown }).id === "string"
            ? ((candidate as { id: string }).id ?? "")
            : `${roadmapId}-${index + 1}`,
        title: typeof (candidate as { title?: unknown }).title === "string" ? ((candidate as { title: string }).title ?? "") : "",
        details:
          typeof (candidate as { details?: unknown }).details === "string"
            ? ((candidate as { details: string }).details ?? "")
            : "",
        resource_url: typeof resources[0]?.url === "string" ? resources[0].url ?? "" : "",
        order_index:
          typeof (candidate as { step?: unknown }).step === "number"
            ? ((candidate as { step: number }).step ?? index + 1)
            : index + 1,
        created_at: createdAt,
        user_id: userId,
      } satisfies RoadmapStep;
    })
    .sort((a, b) => a.order_index - b.order_index);
}

type RoadmapDbRow = {
  id: string;
  user_id: string;
  career_title: string;
  created_at: string;
  steps: unknown;
  career_description?: unknown;
};

function mapRoadmapRow(item: RoadmapDbRow): Roadmap {
  const steps = parseRoadmapSteps(item.steps, item.id, item.created_at, item.user_id);
  return {
    id: item.id,
    user_id: item.user_id,
    career_title: item.career_title,
    career_description: typeof item.career_description === "string" ? item.career_description : "",
    steps,
    created_at: item.created_at,
  };
}

export async function listRoadmaps(scope: FilterScope = "all", searchTitle?: string) {
  let query = supabase.from("roadmaps").select("*").order("created_at", { ascending: false }).limit(20);
  if (scope === "owned") {
    const userId = await getActiveUserId();
    query = query.eq("user_id", userId);
  }
  if (searchTitle?.trim()) {
    query = query.ilike("career_title", `%${searchTitle.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => mapRoadmapRow(item as RoadmapDbRow));
}

export async function getRoadmapById(roadmapId: string) {
  const { data, error } = await supabase.from("roadmaps").select("*").eq("id", roadmapId).maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return mapRoadmapRow(data as RoadmapDbRow);
}

export async function listPublicRoadmaps(searchTitle?: string) {
  return listRoadmaps("all", searchTitle);
}

export async function createRoadmap(payload: {
  careerTitle: string;
  careerDescription: string;
  steps: Array<{ title: string; details: string; resourceUrl: string }>;
}) {
  const userId = await getActiveUserId();
  const normalizedSteps = payload.steps.map((step, index) => ({
    id: crypto.randomUUID(),
    step: index + 1,
    title: step.title,
    details: step.details,
    resources: [
      {
        title: "Resource",
        url: step.resourceUrl,
      },
    ],
  }));

  const { error } = await supabase.from("roadmaps").insert({
    user_id: userId,
    career_title: payload.careerTitle,
    career_description: payload.careerDescription.trim(),
    steps: normalizedSteps,
  });

  if (error) {
    throw error;
  }
}

export async function updateRoadmap(
  roadmapId: string,
  payload: {
    careerTitle: string;
    careerDescription: string;
    steps: Array<{ title: string; details: string; resourceUrl: string }>;
  },
) {
  const userId = await getActiveUserId();
  const normalizedSteps = payload.steps.map((step, index) => ({
    id: crypto.randomUUID(),
    step: index + 1,
    title: step.title,
    details: step.details,
    resources: [
      {
        title: "Resource",
        url: step.resourceUrl,
      },
    ],
  }));
  const { error } = await supabase
    .from("roadmaps")
    .update({
      career_title: payload.careerTitle,
      career_description: payload.careerDescription.trim(),
      steps: normalizedSteps,
    })
    .eq("id", roadmapId)
    .eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function deleteRoadmap(roadmapId: string) {
  const userId = await getActiveUserId();
  const { error } = await supabase.from("roadmaps").delete().eq("id", roadmapId).eq("user_id", userId);
  if (error) {
    throw error;
  }
}

export async function listRoadmapSteps() {
  const userId = await getActiveUserId();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; user_id: string; created_at: string; steps: unknown }>();

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return parseRoadmapSteps(data.steps, data.id, data.created_at, data.user_id);
}

export async function createRoadmapStep(step: Omit<RoadmapStep, "id" | "created_at" | "user_id">) {
  const userId = await getActiveUserId();
  const { data: existingRoadmap, error: fetchError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; steps: unknown }>();

  if (fetchError) {
    throw fetchError;
  }

  const newStep = {
    id: crypto.randomUUID(),
    step: step.order_index,
    title: step.title,
    details: step.details,
    resources: [
      {
        title: "Resource",
        url: step.resource_url,
      },
    ],
  };

  if (!existingRoadmap) {
    const { error } = await supabase.from("roadmaps").insert({
      user_id: userId,
      career_title: "My Career Path",
      career_description: "",
      steps: [newStep],
    });
    if (error) {
      throw error;
    }
    return;
  }

  const existingSteps = Array.isArray(existingRoadmap.steps) ? existingRoadmap.steps : [];
  const { error } = await supabase
    .from("roadmaps")
    .update({ steps: [...existingSteps, newStep] })
    .eq("id", existingRoadmap.id)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
