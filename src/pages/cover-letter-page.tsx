import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDocument, upsertUserDocument } from "@/lib/api";
import { CoverLetterPdfDocument } from "@/features/resume/resume-pdf";
import { emptyResume, type ResumeData } from "@/types/data";

export function CoverLetterPage() {
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const doc = await getUserDocument();
        if (doc) {
          setResume(doc.resume_json);
          setCoverLetter(doc.cover_letter ?? "");
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load cover letter data"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const save = async () => {
    try {
      await upsertUserDocument({
        resume_json: resume,
        cover_letter: coverLetter,
      });
      toast.success("Cover letter saved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save"));
    }
  };

  const downloadCoverLetterPdf = async () => {
    const blob = await pdf(<CoverLetterPdfDocument coverLetter={coverLetter} />).toBlob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cover-letter.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Card className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-48" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Cover Letter</h2>
        <Button onClick={save}>Save</Button>
      </div>
      <Card className="space-y-3">
        <Label>Cover letter content</Label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          className="min-h-60 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <Button variant="secondary" onClick={downloadCoverLetterPdf}>
          Export Cover Letter PDF
        </Button>
      </Card>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }
  return fallback;
}
