import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createInterview, listAppliedTrackerItems, listInterviews, updateInterviewStatus } from "@/lib/api";
import { formatInManila, MANILA_TIMEZONE } from "@/lib/time";
import type { InterviewItem, JobTrackerItem, InterviewStatus } from "@/types/data";

const interviewStatusClass: Record<InterviewStatus, string> = {
  upcoming: "border-blue-500/50 bg-blue-500/10 text-blue-300",
  done: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-rose-500/50 bg-rose-500/10 text-rose-300",
};

export function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<JobTrackerItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trackerItemId, setTrackerItemId] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const [interviewsData, appliedData] = await Promise.all([listInterviews(), listAppliedTrackerItems()]);
      setInterviews(interviewsData);
      setAppliedJobs(appliedData);
      if (!trackerItemId && appliedData.length > 0) {
        setTrackerItemId(appliedData[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load interviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async () => {
    const selected = appliedJobs.find((item) => item.id === trackerItemId);
    if (!selected) {
      toast.error("Select an applied job");
      return;
    }
    if (!interviewDate) {
      toast.error("Interview date is required");
      return;
    }

    try {
      await createInterview({
        trackerItemId: selected.id,
        jobName: selected.title,
        interviewDate,
      });
      toast.success("Interview scheduled");
      setDrawerOpen(false);
      setInterviewDate("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create interview");
    }
  };

  const updateStatus = async (item: InterviewItem, status: InterviewStatus) => {
    try {
      await updateInterviewStatus(item.id, status);
      toast.success("Interview updated");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update interview");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Interviews</h2>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Interview
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={`interview-skeleton-${index}`} className="space-y-2">
                <Skeleton className="h-6 w-2/5" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))
          : interviews.map((interview) => (
              <Card key={interview.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium">{interview.job_name}</p>
                  <Badge className={interviewStatusClass[interview.status]}>{interview.status}</Badge>
                </div>
                <p className="text-sm text-slate-300">
                  Interview date (Asia/Manila): {formatInManila(interview.interview_date, { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void updateStatus(interview, "upcoming")}>
                    Set Upcoming
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void updateStatus(interview, "done")}>
                    Mark Done
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void updateStatus(interview, "cancelled")}>
                    Cancel
                  </Button>
                </div>
              </Card>
            ))}
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} aria-label="Close drawer" />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Log Upcoming Interview</h3>
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Applied Job</Label>
                <select
                  value={trackerItemId}
                  onChange={(e) => setTrackerItemId(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
                >
                  {appliedJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date of interview</Label>
                <Input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                <p className="text-xs text-slate-400">Saved and displayed in {MANILA_TIMEZONE}</p>
              </div>
              <Button className="w-full" onClick={submit}>
                Save Interview
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
