import { useEffect, useState, type ReactNode } from "react";
import { pdf } from "@react-pdf/renderer";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserDocument, upsertUserDocument } from "@/lib/api";
import { ResumePdfDocument } from "@/features/resume/resume-pdf";
import { emptyResume, type ResumeData } from "@/types/data";

const stepOrder = ["Profile", "Experience", "Education", "Skills"] as const;
type Step = (typeof stepOrder)[number];

export function ResumeEditorPage() {
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [coverLetter, setCoverLetter] = useState("");
  const [currentStep, setCurrentStep] = useState<Step>("Profile");
  const [skillInput, setSkillInput] = useState("");
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
        toast.error(getErrorMessage(error, "Failed to load resume data"));
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
      toast.success("Resume saved");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save"));
    }
  };

  const updateExperience = (index: number, key: keyof ResumeData["experience"][number], value: string) => {
    const experience = [...resume.experience];
    experience[index] = { ...experience[index], [key]: value };
    setResume({ ...resume, experience });
  };

  const addExperience = () => {
    setResume({
      ...resume,
      experience: [...resume.experience, { company: "", role: "", startDate: "", endDate: "", highlights: "" }],
    });
  };

  const removeExperience = (index: number) => {
    setResume({
      ...resume,
      experience: resume.experience.filter((_, idx) => idx !== index),
    });
  };

  const updateEducation = (index: number, key: keyof ResumeData["education"][number], value: string) => {
    const education = [...resume.education];
    education[index] = { ...education[index], [key]: value };
    setResume({ ...resume, education });
  };

  const addEducation = () => {
    setResume({
      ...resume,
      education: [...resume.education, { school: "", degree: "", year: "" }],
    });
  };

  const removeEducation = (index: number) => {
    setResume({
      ...resume,
      education: resume.education.filter((_, idx) => idx !== index),
    });
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) {
      return;
    }
    if (!resume.skills.includes(value)) {
      setResume({
        ...resume,
        skills: [...resume.skills, value],
      });
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setResume({
      ...resume,
      skills: resume.skills.filter((item) => item !== skill),
    });
  };

  const downloadResumePdf = async () => {
    const blob = await pdf(<ResumePdfDocument resume={resume} />).toBlob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resume.pdf";
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
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Resume</h2>
        <Button onClick={save}>Save</Button>
      </div>
      <Card className="space-y-3">
        <div className="flex gap-2">
          {stepOrder.map((step) => (
            <Button key={step} variant={currentStep === step ? "default" : "outline"} size="sm" onClick={() => setCurrentStep(step)}>
              {step}
            </Button>
          ))}
        </div>

        {currentStep === "Profile" && (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Full name" value={resume.fullName} onChange={(value) => setResume({ ...resume, fullName: value })} />
            <Field label="Email" value={resume.email} onChange={(value) => setResume({ ...resume, email: value })} />
            <Field label="Phone" value={resume.phone} onChange={(value) => setResume({ ...resume, phone: value })} />
            <Field label="Location" value={resume.location} onChange={(value) => setResume({ ...resume, location: value })} />
            <Field label="Website (optional)" value={resume.website ?? ""} onChange={(value) => setResume({ ...resume, website: value })} />
            <Field label="GitHub (optional)" value={resume.github ?? ""} onChange={(value) => setResume({ ...resume, github: value })} />
            <div className="space-y-1 md:col-span-2">
              <Label>Professional summary</Label>
              <textarea
                value={resume.summary}
                onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {currentStep === "Experience" && (
          <div className="space-y-3">
            {resume.experience.map((exp, idx) => (
              <Card key={`exp-${idx}`} className="space-y-2">
                <SectionHeader>
                  <p className="text-sm font-medium text-slate-300">Experience {idx + 1}</p>
                  {resume.experience.length > 1 ? (
                    <Button variant="outline" size="sm" onClick={() => removeExperience(idx)}>
                      <X className="mr-1 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  ) : null}
                </SectionHeader>
                <Field label="Role" value={exp.role} onChange={(value) => updateExperience(idx, "role", value)} />
                <Field label="Company" value={exp.company} onChange={(value) => updateExperience(idx, "company", value)} />
                <div className="grid gap-2 md:grid-cols-2">
                  <Field label="Start" value={exp.startDate} onChange={(value) => updateExperience(idx, "startDate", value)} />
                  <Field label="End" value={exp.endDate} onChange={(value) => updateExperience(idx, "endDate", value)} />
                </div>
                <div className="space-y-1">
                  <Label>Highlights</Label>
                  <textarea
                    value={exp.highlights}
                    onChange={(e) => updateExperience(idx, "highlights", e.target.value)}
                    className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    placeholder="Use one bullet point per line"
                  />
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={addExperience}>
              <Plus className="mr-2 h-4 w-4" />
              Add experience
            </Button>
          </div>
        )}

        {currentStep === "Education" && (
          <div className="space-y-3">
            {resume.education.map((edu, idx) => (
              <Card key={`edu-${idx}`} className="space-y-2">
                <SectionHeader>
                  <p className="text-sm font-medium text-slate-300">Education {idx + 1}</p>
                  {resume.education.length > 1 ? (
                    <Button variant="outline" size="sm" onClick={() => removeEducation(idx)}>
                      <X className="mr-1 h-3.5 w-3.5" />
                      Remove
                    </Button>
                  ) : null}
                </SectionHeader>
                <Field label="School" value={edu.school} onChange={(value) => updateEducation(idx, "school", value)} />
                <Field label="Degree" value={edu.degree} onChange={(value) => updateEducation(idx, "degree", value)} />
                <Field label="Year" value={edu.year} onChange={(value) => updateEducation(idx, "year", value)} />
              </Card>
            ))}
            <Button variant="outline" onClick={addEducation}>
              <Plus className="mr-2 h-4 w-4" />
              Add education
            </Button>
          </div>
        )}

        {currentStep === "Skills" && (
          <div className="space-y-3">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill"
              />
              <Button type="button" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <Badge key={skill} className="gap-1 pr-1">
                  {skill}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-slate-700"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Button variant="secondary" onClick={downloadResumePdf}>
          Export Resume PDF
        </Button>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between">{children}</div>;
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
