import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeData } from "@/types/data";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 28,
    color: "#111827",
  },
  heading: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 700,
  },
  text: {
    marginBottom: 3,
    lineHeight: 1.3,
  },
  bullet: {
    marginBottom: 3,
    lineHeight: 1.3,
    marginLeft: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    marginBottom: 8,
  },
});

export function ResumePdfDocument({ resume }: { resume: ResumeData }) {
  const experienceItems = resume.experience.filter((item) => item.role || item.company || item.highlights);
  const educationItems = resume.education.filter((item) => item.school || item.degree || item.year);
  const skillItems = resume.skills.filter(Boolean);
  const contactItems = [resume.email, resume.phone, resume.location, resume.website, resume.github].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{resume.fullName || "Your Name"}</Text>
        <View style={styles.divider} />
        <Text style={styles.text}>{contactItems.join(" | ")}</Text>

        <Text style={styles.sectionTitle}>SUMMARY</Text>
        <Text style={styles.text}>{resume.summary}</Text>

        <Text style={styles.sectionTitle}>EXPERIENCE</Text>
        {experienceItems.map((item, idx) => (
          <View key={`${item.company}-${idx}`}>
            <Text style={styles.bullet}>
              {"• "}
              {[item.role, item.company].filter(Boolean).join(" - ")}
              {(item.startDate || item.endDate) && ` (${item.startDate} to ${item.endDate})`}
            </Text>
            {item.highlights
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, lineIdx) => (
                <Text key={`${item.company}-${idx}-line-${lineIdx}`} style={styles.bullet}>
                  {"• "}
                  {line}
                </Text>
              ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>EDUCATION</Text>
        {educationItems.map((item, idx) => (
          <Text key={`${item.school}-${idx}`} style={styles.bullet}>
            {"• "}
            {item.degree}, {item.school} ({item.year})
          </Text>
        ))}

        <Text style={styles.sectionTitle}>SKILLS</Text>
        <Text style={styles.text}>{skillItems.join(", ")}</Text>
      </Page>
    </Document>
  );
}

export function CoverLetterPdfDocument({ coverLetter }: { coverLetter: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Cover Letter</Text>
        <View style={styles.divider} />
        <Text style={styles.text}>{coverLetter}</Text>
      </Page>
    </Document>
  );
}
