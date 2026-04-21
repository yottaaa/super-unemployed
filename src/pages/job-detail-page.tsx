import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createTrackerItemFromJob, getJobById } from "@/lib/api";
import type { Job } from "@/types/data";

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getJobById(id);
        setJob(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Card className="space-y-3">
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      </div>
    );
  }
  if (!job) {
    return <p className="text-slate-300">Job not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Job Detail</h2>
        <Button asChild variant="outline">
          <Link to="/app/jobs">Back to Jobs</Link>
        </Button>
      </div>
      <Card className="space-y-3">
        <h3 className="text-xl font-semibold">{job.title}</h3>
        <p className="text-sm text-slate-400">
          {job.company} - {job.location}
        </p>
        <p className="text-sm text-slate-200 whitespace-pre-wrap">{job.description}</p>
        <div className="flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <Badge key={`${job.id}-${tag}`}>{tag}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {job.apply_url ? (
            <Button asChild>
              <a href={job.apply_url} target="_blank" rel="noreferrer">
                Open Apply Link
              </a>
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await createTrackerItemFromJob(job.id);
                toast.success("Added to tracker");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to add to tracker");
              }
            }}
          >
            Track this job
          </Button>
        </div>
      </Card>
    </div>
  );
}
