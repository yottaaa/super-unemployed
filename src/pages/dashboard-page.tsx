import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listInterviews, listTrackerItems } from "@/lib/api";
import { formatInManila, getManilaDateParts, MANILA_TIMEZONE } from "@/lib/time";
import { trackerStatuses, type InterviewItem, type TrackerStatus } from "@/types/data";

const trackerStatusLabel: Record<TrackerStatus, string> = {
  viewed: "Viewed",
  applied: "Applied",
  interviewed: "Interviewed",
  hired: "Hired",
  rejected: "Rejected",
};

const interviewStatusColor = {
  upcoming: "bg-blue-400",
  done: "bg-emerald-400",
  cancelled: "bg-rose-400",
} as const;

const interviewStatusTextColor = {
  upcoming: "text-blue-300",
  done: "text-emerald-300",
  cancelled: "text-rose-300",
} as const;

export function DashboardPage() {
  const [trackerCounts, setTrackerCounts] = useState<Record<TrackerStatus, number>>({
    viewed: 0,
    applied: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0,
  });
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const nowParts = getManilaDateParts(new Date());
    return new Date(nowParts.year, nowParts.month - 1, 1);
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [trackerItems, interviewItems] = await Promise.all([listTrackerItems(), listInterviews()]);
        const counts = { viewed: 0, applied: 0, interviewed: 0, hired: 0, rejected: 0 } as Record<TrackerStatus, number>;
        trackerItems.forEach((item) => {
          counts[item.status] += 1;
        });
        setTrackerCounts(counts);
        setInterviews(interviewItems);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard widgets");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const interviewsByDay = useMemo(() => {
    const map = new Map<number, InterviewItem[]>();
    interviews.forEach((item) => {
      const date = getManilaDateParts(item.interview_date);
      if (date.year !== year || date.month !== month + 1) {
        return;
      }
      const day = date.day;
      const existing = map.get(day) ?? [];
      existing.push(item);
      map.set(day, existing);
    });
    return map;
  }, [interviews, month, year]);

  const cells = useMemo(() => {
    const list: Array<{ day?: number }> = [];
    for (let i = 0; i < firstDay; i += 1) {
      list.push({});
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push({ day });
    }
    return list;
  }, [daysInMonth, firstDay]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <Card>
        <h3 className="text-lg font-medium">Welcome</h3>
        <p className="mt-1 text-sm text-slate-300">
          Use the editors to maintain one ATS-friendly resume and cover letter, browse jobs, and build your education roadmap.
        </p>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-medium">Job Management Overview</h3>
        <div className="grid gap-3 md:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div key={`status-skeleton-${index}`} className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="mt-2 h-7 w-10" />
                </div>
              ))
            : trackerStatuses.map((status) => (
                <div key={status} className="rounded-md border border-slate-800 bg-slate-900/40 p-3">
                  <p className="text-xs text-slate-400">{trackerStatusLabel[status]}</p>
                  <p className="text-2xl font-semibold">{trackerCounts[status]}</p>
                </div>
              ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Interview Calendar</h3>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={`${year}-${String(month + 1).padStart(2, "0")}`}
              onChange={(e) => {
                const [nextYear, nextMonth] = e.target.value.split("-").map(Number);
                if (!nextYear || !nextMonth) {
                  return;
                }
                setDisplayedMonth(new Date(nextYear, nextMonth - 1, 1));
              }}
              className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            />
            <Badge>{new Date(year, month, 1).toLocaleString("en-PH", { month: "long", year: "numeric" })}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nowParts = getManilaDateParts(new Date());
                setDisplayedMonth(new Date(nowParts.year, nowParts.month - 1, 1));
              }}
            >
              Today
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={`calendar-skeleton-${index}`} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                <p key={label}>{label}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((cell, index) => {
                if (!cell.day) {
                  return <div key={`empty-${index}`} className="h-20 rounded-md border border-transparent" />;
                }
                const dayInterviews = interviewsByDay.get(cell.day) ?? [];
                return (
                  <div key={cell.day} className="group relative h-20 rounded-md border border-slate-800 bg-slate-900/40 p-2">
                    <p className="text-sm font-medium">{cell.day}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dayInterviews.slice(0, 4).map((interview) => (
                        <span
                          key={interview.id}
                          className={`h-2 w-2 rounded-full ${interviewStatusColor[interview.status]}`}
                          title={`${interview.job_name} - ${interview.status} (${formatInManila(interview.interview_date, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })} ${MANILA_TIMEZONE})`}
                        />
                      ))}
                    </div>
                    {dayInterviews.length > 0 ? (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 hidden w-64 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-950 p-3 shadow-xl group-hover:block">
                        <p className="mb-2 text-xs font-semibold text-slate-200">Interviews ({dayInterviews.length})</p>
                        <div className="space-y-2">
                          {dayInterviews.slice(0, 5).map((interview) => (
                            <div key={`hover-${interview.id}`} className="text-xs">
                              <p className="truncate text-slate-100">{interview.job_name}</p>
                              <p className="text-slate-400">{formatInManila(interview.interview_date, { timeStyle: "short" })}</p>
                              <p className={interviewStatusTextColor[interview.status]}>{interview.status}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-4 text-xs">
          <Legend colorClass="bg-blue-400" label="Upcoming" />
          <Legend colorClass="bg-emerald-400" label="Done" />
          <Legend colorClass="bg-rose-400" label="Cancelled" />
        </div>
      </Card>
    </div>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}
