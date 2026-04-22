import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { createJob, createTrackerItemFromJob, deleteJob, getJobById, listJobs, updateJob } from "@/lib/api";
import type { Job } from "@/types/data";

const jobSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(2),
  location: z.string().min(2),
  description: z.string().min(8),
  applyUrl: z.string().trim().optional(),
  tags: z.string().min(2),
});

type JobForm = z.infer<typeof jobSchema>;

const defaultTags = ["Remote", "JavaScript", "Full-time", "Frontend", "Backend"];

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const editId = searchParams.get("edit");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "owned">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      description: "",
      applyUrl: "",
      tags: "Remote, JavaScript",
    },
  });

  const refreshJobs = async (scope: "all" | "owned" = ownershipFilter) => {
    setIsLoading(true);
    try {
      const items = await listJobs(scope);
      setJobs(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshJobs(ownershipFilter);
  }, [ownershipFilter]);

  useEffect(() => {
    if (!editId || !session?.user?.id) {
      return;
    }
    let cancelled = false;

    const clearEditParam = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("edit");
          return next;
        },
        { replace: true },
      );
    };

    void (async () => {
      try {
        const job = await getJobById(editId);
        if (cancelled) {
          return;
        }
        if (!job) {
          toast.error("Job not found");
          clearEditParam();
          return;
        }
        if (job.user_id !== session.user.id) {
          toast.error("You can only edit your own jobs");
          clearEditParam();
          return;
        }
        setEditingJob(job);
        form.reset({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          applyUrl: job.apply_url ?? "",
          tags: job.tags.join(", "),
        });
        setDialogOpen(true);
        clearEditParam();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load job");
          clearEditParam();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editId, session?.user?.id, setSearchParams]);

  const tags = useMemo(() => {
    const all = new Set<string>(defaultTags);
    jobs.forEach((job) => job.tags.forEach((tag) => all.add(tag)));
    return ["All", ...Array.from(all)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const passesTag = selectedTag === "All" || job.tags.includes(selectedTag);
      const passesLocation = selectedLocation === "All" || job.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const search = searchTerm.trim().toLowerCase();
      const passesSearch =
        !search ||
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        job.description.toLowerCase().includes(search);
      return passesTag && passesLocation && passesSearch;
    });
  }, [jobs, searchTerm, selectedLocation, selectedTag]);

  const onSubmit = async (values: JobForm) => {
    const parsedTags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    try {
      const payload = {
        title: values.title,
        company: values.company,
        location: values.location,
        description: values.description,
        apply_url: values.applyUrl?.trim() ? values.applyUrl.trim() : null,
        tags: parsedTags,
      };
      if (editingJob) {
        await updateJob(editingJob.id, payload);
        toast.success("Job updated");
      } else {
        await createJob(payload);
        toast.success("Job posted");
      }
      form.reset();
      setEditingJob(null);
      setDialogOpen(false);
      await refreshJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save job");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Job Management</h2>
        <Button
          onClick={() => {
            setEditingJob(null);
            form.reset({ title: "", company: "", location: "", description: "", applyUrl: "", tags: "Remote, JavaScript" });
            setDialogOpen(true);
          }}
        >
          Post Job
        </Button>
      </div>

      <Card className="space-y-2">
        <p className="text-sm text-slate-400">Search and filters</p>
        <div className="flex gap-2">
          {(["all", "owned"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`rounded-md border px-3 py-1 text-sm ${
                ownershipFilter === filter ? "border-cyan-500 text-cyan-300" : "border-slate-700 text-slate-300"
              }`}
              onClick={() => setOwnershipFilter(filter)}
            >
              {filter === "all" ? "All" : "Owned"}
            </button>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Search jobs by title or company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          >
            <option value="All">All locations</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`rounded-md border px-3 py-1 text-sm ${
                selectedTag === tag ? "border-cyan-500 text-cyan-300" : "border-slate-700 text-slate-300"
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`job-skeleton-${index}`} className="space-y-3">
                <Skeleton className="h-6 w-2/5" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </Card>
            ))
          : filteredJobs.map((job) => (
              <Card key={job.id} className="space-y-2">
                <h3 className="text-lg font-medium">{job.title}</h3>
                <p className="text-sm">
                  {job.company} - {job.location}
                </p>
                <p className="text-sm">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <Badge key={`${job.id}-${tag}`}>{tag}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/app/jobs/${job.id}`}>View Job</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
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
                  {session?.user?.id === job.user_id ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingJob(job);
                          form.reset({
                            title: job.title,
                            company: job.company,
                            location: job.location,
                            description: job.description,
                            applyUrl: job.apply_url ?? "",
                            tags: job.tags.join(", "),
                          });
                          setDialogOpen(true);
                        }}
                      >
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!window.confirm("Delete this job?")) {
                            return;
                          }
                          try {
                            await deleteJob(job.id);
                            toast.success("Job deleted");
                            await refreshJobs();
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to delete job");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  ) : null}
                </div>
              </Card>
            ))}
      </div>

      {dialogOpen ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/70" onClick={() => setDialogOpen(false)} aria-label="Close drawer" />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{editingJob ? "Update job" : "Post a new job"}</h3>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Job title</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Company</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Location</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Tags (comma separated)</Label>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Example: Remote, JavaScript, Full-time</FormDescription>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Description</Label>
                      <FormControl>
                        <textarea
                          {...field}
                          className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Apply URL (optional)</Label>
                      <FormControl>
                        <Input {...field} placeholder="https://..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormMessage />
                <Button type="submit" className="w-full">
                  Save job
                </Button>
              </form>
            </Form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
