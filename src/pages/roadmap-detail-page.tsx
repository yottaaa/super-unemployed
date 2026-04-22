import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { deleteRoadmap, getRoadmapById } from "@/lib/api";
import type { Roadmap } from "@/types/data";

export function RoadmapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getRoadmapById(id);
        setRoadmap(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load roadmap");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const isOwner = Boolean(session?.user?.id && roadmap?.user_id === session.user.id);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card className="space-y-3">
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </Card>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="space-y-4">
        <p className="text-slate-300">Roadmap not found.</p>
        <Button asChild variant="outline">
          <Link to="/app/roadmaps">Back to Roadmaps</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">Roadmap</h2>
        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/app/roadmaps?edit=${roadmap.id}`}>Edit</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!window.confirm("Delete this roadmap?")) {
                    return;
                  }
                  try {
                    await deleteRoadmap(roadmap.id);
                    toast.success("Roadmap deleted");
                    void navigate("/app/roadmaps");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to delete roadmap");
                  }
                }}
              >
                Delete
              </Button>
            </>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link to="/app/roadmaps">Back to Roadmaps</Link>
          </Button>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <h3 className="text-xl font-semibold">{roadmap.career_title}</h3>
          {roadmap.career_description.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{roadmap.career_description}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No description provided.</p>
          )}
          <p className="mt-3 text-xs text-slate-500">{roadmap.steps.length} steps</p>
        </div>

        <ol className="relative ml-4 border-l border-slate-800">
          {roadmap.steps.map((step) => (
            <li key={step.id} className="mb-6 ml-6">
              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-cyan-400" />
              <h4 className="text-base font-medium">
                {step.order_index}. {step.title}
              </h4>
              {step.details ? <p className="mt-1 text-sm text-slate-300">{step.details}</p> : null}
              {step.resource_url ? (
                <a
                  href={step.resource_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-cyan-300 hover:underline"
                >
                  Open resource
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
