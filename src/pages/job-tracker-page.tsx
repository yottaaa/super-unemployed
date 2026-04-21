import { useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createTrackerItem, listTrackerItems, updateTrackerStatus } from "@/lib/api";
import { trackerStatuses, type JobTrackerItem, type TrackerStatus } from "@/types/data";

const statusLabel: Record<TrackerStatus, string> = {
  viewed: "Viewed",
  applied: "Applied",
  interviewed: "Interviewed",
  hired: "Hired",
  rejected: "Rejected",
};

export function JobTrackerPage() {
  const [items, setItems] = useState<JobTrackerItem[]>([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await listTrackerItems();
      setItems(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load tracker");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return items;
    }
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.source_url.toLowerCase().includes(term),
    );
  }, [items, search]);

  const grouped = useMemo(
    () =>
      trackerStatuses.reduce(
        (acc, status) => {
          acc[status] = filtered.filter((item) => item.status === status);
          return acc;
        },
        {} as Record<TrackerStatus, JobTrackerItem[]>,
      ),
    [filtered],
  );

  const onDropTo = async (target: TrackerStatus) => {
    if (!draggedId) {
      return;
    }

    const current = items.find((item) => item.id === draggedId);
    if (!current || current.status === target) {
      setDraggedId(null);
      return;
    }

    const previous = [...items];
    setItems((prev) => prev.map((item) => (item.id === draggedId ? { ...item, status: target } : item)));
    setDraggedId(null);

    try {
      await updateTrackerStatus(current.id, target);
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "Failed to move card");
    }
  };

  const submitNew = async () => {
    if (!position.trim()) {
      toast.error("Position is required");
      return;
    }
    if (!sourceUrl.trim()) {
      toast.error("Source URL is required");
      return;
    }

    try {
      await createTrackerItem({
        title: position.trim(),
        description: description.trim(),
        source_url: sourceUrl.trim(),
        source_type: "external",
        status: "viewed",
      });
      setPosition("");
      setDescription("");
      setSourceUrl("");
      setDrawerOpen(false);
      toast.success("Tracker job created");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tracker job");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Job Tracker Board</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search tracked jobs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tracked Job
          </Button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-5 md:grid-cols-2">
        {trackerStatuses.map((status) => (
          <div
            key={status}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => void onDropTo(status)}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">{statusLabel[status]}</p>
              <Badge>{grouped[status].length}</Badge>
            </div>
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 2 }).map((_, index) => (
                    <Card key={`${status}-skeleton-${index}`} className="space-y-2 border-slate-700 bg-slate-900">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                    </Card>
                  ))
                : grouped[status].map((item) => (
                    <Card
                      key={item.id}
                      draggable
                      onDragStart={() => setDraggedId(item.id)}
                      className="cursor-grab space-y-2 border-slate-700 bg-slate-900"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-1 h-4 w-4 text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.title}</p>
                          {item.description ? <p className="mt-1 text-xs text-slate-300 line-clamp-3">{item.description}</p> : null}
                          <a
                            href={item.source_url}
                            target={item.source_url.startsWith("/") ? undefined : "_blank"}
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-cyan-300 hover:underline"
                          >
                            Source
                          </a>
                        </div>
                      </div>
                    </Card>
                  ))}
            </div>
          </div>
        ))}
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} aria-label="Close drawer" />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add Job to Tracker</h3>
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Position / Job Name</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Frontend Engineer at Acme" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Link / Source</Label>
                <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://linkedin.com/jobs/..." />
              </div>
              <Button className="w-full" onClick={submitNew}>
                Add to Tracker
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
