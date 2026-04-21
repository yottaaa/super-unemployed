export type ResumeExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  highlights: string;
};

export type ResumeEducation = {
  school: string;
  degree: string;
  year: string;
};

export type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  github?: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
};

export type UserDocument = {
  user_id: string;
  resume_json: ResumeData;
  cover_letter: string;
  updated_at?: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url?: string | null;
  tags: string[];
  created_at?: string;
  user_id: string;
};

export const trackerStatuses = ["viewed", "applied", "interviewed", "hired", "rejected"] as const;
export type TrackerStatus = (typeof trackerStatuses)[number];

export type JobTrackerItem = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  source_url: string;
  source_type: "listing" | "external";
  source_job_id?: string | null;
  status: TrackerStatus;
  created_at?: string;
  updated_at?: string;
};

export const interviewStatuses = ["upcoming", "done", "cancelled"] as const;
export type InterviewStatus = (typeof interviewStatuses)[number];

export type InterviewItem = {
  id: string;
  user_id: string;
  tracker_item_id: string;
  job_name: string;
  interview_date: string;
  status: InterviewStatus;
  created_at?: string;
  updated_at?: string;
};

export type RoadmapStep = {
  id: string;
  title: string;
  details: string;
  resource_url: string;
  order_index: number;
  created_at?: string;
  user_id: string;
};

export type Roadmap = {
  id: string;
  user_id: string;
  career_title: string;
  steps: RoadmapStep[];
  created_at?: string;
};

export const emptyResume: ResumeData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  github: "",
  summary: "",
  experience: [{ company: "", role: "", startDate: "", endDate: "", highlights: "" }],
  education: [{ school: "", degree: "", year: "" }],
  skills: [],
};
