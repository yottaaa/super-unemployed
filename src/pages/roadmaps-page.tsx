import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { createRoadmap, getRoadmapById, listRoadmaps, updateRoadmap } from "@/lib/api";
import type { Roadmap } from "@/types/data";

export function RoadmapsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "owned">("all");
  const [searchTitle, setSearchTitle] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);
  const [careerTitle, setCareerTitle] = useState("");
  const [careerDescription, setCareerDescription] = useState("");
  const [steps, setSteps] = useState([{ title: "", details: "", resourceUrl: "" }]);
  const [isLoading, setIsLoading] = useState(true);

  const editId = searchParams.get("edit");

  const refresh = async (query?: string, scope: "all" | "owned" = ownershipFilter) => {
    setIsLoading(true);
    try {
      const data = await listRoadmaps(scope, query);
      setRoadmaps(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load roadmaps");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh(searchTitle, ownershipFilter);
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
        const r = await getRoadmapById(editId);
        if (cancelled) {
          return;
        }
        if (!r) {
          toast.error("Roadmap not found");
          clearEditParam();
          return;
        }
        if (r.user_id !== session.user.id) {
          toast.error("You can only edit your own roadmaps");
          clearEditParam();
          return;
        }
        setEditingRoadmap(r);
        setCareerTitle(r.career_title);
        setCareerDescription(r.career_description ?? "");
        setSteps(
          r.steps.map((step) => ({
            title: step.title,
            details: step.details,
            resourceUrl: step.resource_url,
          })),
        );
        setDrawerOpen(true);
        clearEditParam();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load roadmap");
          clearEditParam();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editId, session?.user?.id, setSearchParams]);

  const onSearch = async () => {
    await refresh(searchTitle, ownershipFilter);
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { title: "", details: "", resourceUrl: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateStep = (index: number, key: "title" | "details" | "resourceUrl", value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const submitRoadmap = async () => {
    const validSteps = steps.filter((step) => step.title.trim() && step.resourceUrl.trim());
    if (!careerTitle.trim()) {
      toast.error("Career title is required");
      return;
    }
    if (validSteps.length === 0) {
      toast.error("Add at least one step with title and URL");
      return;
    }

    try {
      const payload = {
        careerTitle: careerTitle.trim(),
        careerDescription: careerDescription.trim(),
        steps: validSteps.map((step) => ({
          title: step.title.trim(),
          details: step.details.trim(),
          resourceUrl: step.resourceUrl.trim(),
        })),
      };
      if (editingRoadmap) {
        await updateRoadmap(editingRoadmap.id, payload);
        toast.success("Roadmap updated");
      } else {
        await createRoadmap(payload);
        toast.success("Roadmap shared");
      }
      setDrawerOpen(false);
      setEditingRoadmap(null);
      setCareerTitle("");
      setCareerDescription("");
      setSteps([{ title: "", details: "", resourceUrl: "" }]);
      await refresh(searchTitle, ownershipFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save roadmap");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Education Roadmaps / Career Paths</h2>
      <Card className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row">
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
          <Input
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            placeholder="Search roadmap title"
            className="md:flex-1"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSearch}>
              Search
            </Button>
            <Button
              onClick={() => {
                setEditingRoadmap(null);
                setCareerTitle("");
                setCareerDescription("");
                setSteps([{ title: "", details: "", resourceUrl: "" }]);
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Roadmap
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-medium">Recently Added Roadmaps</h3>
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Card key={`roadmap-skeleton-${index}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-6 w-2/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-9 w-24 shrink-0 self-start sm:self-center" />
              </Card>
            ))
          : roadmaps.map((roadmap) => (
              <Card
                key={roadmap.id}
                className="flex flex-col gap-4 border-slate-800 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="text-lg font-semibold leading-snug text-slate-50">{roadmap.career_title}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">
                    {roadmap.career_description.trim() ? roadmap.career_description : "No description yet."}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {roadmap.steps.length} {roadmap.steps.length === 1 ? "step" : "steps"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                  <Button asChild variant="default" size="sm" className="w-full">
                    <Link to={`/app/roadmaps/${roadmap.id}`}>View</Link>
                  </Button>
                  {ownershipFilter === "owned" ? (
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={`/app/roadmaps?edit=${roadmap.id}`}>Edit</Link>
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} aria-label="Close drawer" />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{editingRoadmap ? "Update Roadmap" : "Create Roadmap"}</h3>
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Career path title</Label>
                <Input value={careerTitle} onChange={(e) => setCareerTitle(e.target.value)} placeholder="Frontend Engineer Path" />
              </div>
              <div className="space-y-2">
                <Label>Career path description</Label>
                <textarea
                  value={careerDescription}
                  onChange={(e) => setCareerDescription(e.target.value)}
                  placeholder="What this path covers and who it is for"
                  className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              {steps.map((step, idx) => (
                <Card key={`new-step-${idx}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Step {idx + 1}</p>
                    {steps.length > 1 ? (
                      <Button variant="outline" size="sm" onClick={() => removeStep(idx)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={step.title} onChange={(e) => updateStep(idx, "title", e.target.value)} placeholder="Learn JavaScript basics" />
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <textarea
                      value={step.details}
                      onChange={(e) => updateStep(idx, "details", e.target.value)}
                      className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Resource URL</Label>
                    <Input
                      type="url"
                      value={step.resourceUrl}
                      onChange={(e) => updateStep(idx, "resourceUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </Card>
              ))}
              <Button variant="outline" onClick={addStep}>
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
              <Button className="w-full" onClick={submitRoadmap}>
                {editingRoadmap ? "Update Roadmap" : "Share Roadmap"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
