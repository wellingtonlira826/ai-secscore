import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getAssessment,
  getAssessmentScore,
  getAssessmentGaps,
  getAssessmentSummary,
  getCorporateScore,
  listMaturityLevels,
  type Assessment,
} from "@workspace/api-client-react";
import type { TFunction } from "i18next";

const BRAND: [number, number, number] = [30, 64, 175];
const MUTED: [number, number, number] = [100, 116, 139];
const PAGE_MARGIN = 14;

function localeFor(lang: string): string {
  if (lang.startsWith("pt")) return "pt-BR";
  if (lang.startsWith("es")) return "es";
  return "en-US";
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

function drawHeader(
  doc: jsPDF,
  reportTitle: string,
  assessment: Assessment,
  t: TFunction,
  lang: string
): number {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("AI SecScore", PAGE_MARGIN, 11);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(reportTitle, PAGE_MARGIN, 19);

  let y = 36;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(assessment.name, PAGE_MARGIN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${t("pdf.system")}: ${assessment.systemName}`, PAGE_MARGIN, y);
  y += 5;
  const dateStr = new Date().toLocaleDateString(localeFor(lang), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(t("pdf.generatedAt", { date: dateStr }), PAGE_MARGIN, y);
  doc.setTextColor(0, 0, 0);
  return y + 8;
}

function addFooters(doc: jsPDF, t: TFunction): void {
  const total = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(t("pdf.page", { page: i, total }), pageW - PAGE_MARGIN, pageH - 8, {
      align: "right",
    });
    doc.text("AI SecScore", PAGE_MARGIN, pageH - 8);
  }
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y > pageH - 40) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND);
  doc.text(title, PAGE_MARGIN, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 6;
}

function bulletList(doc: jsPDF, items: string[], y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(9.5);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, pageW - PAGE_MARGIN * 2 - 5);
    const blockH = lines.length * 4.5 + 2;
    if (y + blockH > pageH - 18) {
      doc.addPage();
      y = 20;
    }
    doc.circle(PAGE_MARGIN + 1.2, y - 1.2, 0.8, "F");
    doc.text(lines, PAGE_MARGIN + 5, y);
    y += blockH;
  }
  return y + 2;
}

function paragraph(doc: jsPDF, text: string, y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(9.5);
  const lines = doc.splitTextToSize(text, pageW - PAGE_MARGIN * 2);
  for (const line of lines) {
    if (y > pageH - 18) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, PAGE_MARGIN, y);
    y += 4.5;
  }
  return y + 4;
}

function statRow(
  doc: jsPDF,
  stats: { label: string; value: string }[],
  y: number
): number {
  const pageW = doc.internal.pageSize.getWidth();
  const boxW = (pageW - PAGE_MARGIN * 2 - (stats.length - 1) * 4) / stats.length;
  const boxH = 20;
  stats.forEach((s, i) => {
    const x = PAGE_MARGIN + i * (boxW + 4);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(s.label, x + 4, y + 7, { maxWidth: boxW - 8 });
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(s.value, x + 4, y + 16);
    doc.setFont("helvetica", "normal");
  });
  return y + boxH + 8;
}

function lastTableY(doc: jsPDF): number {
  return ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 20) + 10;
}

async function generateSecurityPdf(
  assessment: Assessment,
  t: TFunction,
  lang: string
): Promise<void> {
  const [score, gaps, summary] = await Promise.all([
    getAssessmentScore(assessment.id),
    getAssessmentGaps(assessment.id),
    getAssessmentSummary(assessment.id, { lang } as never),
  ]);

  const doc = new jsPDF();
  let y = drawHeader(doc, t("pdf.securityReport"), assessment, t, lang);

  y = statRow(
    doc,
    [
      { label: t("pdf.overallScore"), value: `${Math.round(score.overallScore)}/100` },
      { label: t("pdf.grade"), value: String(score.grade) },
      { label: t("pdf.riskLevel"), value: String(score.riskLevel) },
      { label: t("pdf.answered"), value: `${score.answeredCount}/${score.totalCount}` },
    ],
    y
  );

  y = sectionTitle(doc, t("pdf.frameworkBreakdown"), y);
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [[t("pdf.framework"), t("pdf.score"), t("pdf.riskLevel"), t("pdf.answered")]],
    body: score.frameworkScores.map((f) => [
      f.frameworkName,
      `${Math.round(f.score)}/100`,
      String(f.riskLevel),
      `${f.answeredCount}/${f.totalCount}`,
    ]),
    headStyles: { fillColor: BRAND, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });
  y = lastTableY(doc);

  y = sectionTitle(doc, t("pdf.executiveSummary"), y);
  y = paragraph(doc, summary.summaryText, y);

  if (summary.strengths.length > 0) {
    y = sectionTitle(doc, t("pdf.strengths"), y);
    doc.setFillColor(22, 163, 74);
    y = bulletList(doc, summary.strengths, y);
  }
  if (summary.weaknesses.length > 0) {
    y = sectionTitle(doc, t("pdf.weaknesses"), y);
    doc.setFillColor(220, 38, 38);
    y = bulletList(doc, summary.weaknesses, y);
  }
  if (summary.recommendations.length > 0) {
    y = sectionTitle(doc, t("pdf.recommendations"), y);
    doc.setFillColor(...BRAND);
    y = bulletList(doc, summary.recommendations, y);
  }

  if (gaps.length > 0) {
    y = sectionTitle(doc, t("pdf.topGaps"), y);
    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [[t("pdf.question"), t("pdf.framework"), t("pdf.score"), t("pdf.remediation")]],
      body: gaps.slice(0, 20).map((g) => [
        g.questionText,
        g.frameworkName,
        `${Math.round(g.score)}`,
        g.remediation ?? "—",
      ]),
      headStyles: { fillColor: BRAND, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 70 }, 3: { cellWidth: 60 } },
    });
  }

  addFooters(doc, t);
  doc.save(`AI-SecScore_${sanitizeFilename(assessment.name)}.pdf`);
}

async function generateCorporatePdf(
  assessment: Assessment,
  t: TFunction,
  lang: string
): Promise<void> {
  const [score, levels] = await Promise.all([
    getCorporateScore(assessment.id),
    listMaturityLevels(),
  ]);

  const levelName = (lvl: number | null): string => {
    if (lvl == null) return "—";
    const found = levels.find((l) => l.level === lvl);
    return found ? `${lvl} — ${found.name}` : String(lvl);
  };

  const doc = new jsPDF();
  let y = drawHeader(doc, t("pdf.corporateReport"), assessment, t, lang);

  y = statRow(
    doc,
    [
      {
        label: t("pdf.overallScore"),
        value: score.overallScore != null ? `${Math.round(score.overallScore)}/100` : "—",
      },
      { label: t("pdf.maturityLevel"), value: score.maturityLevel != null ? String(score.maturityLevel) : "—" },
      { label: t("pdf.completion"), value: `${Math.round(score.completionPct)}%` },
      { label: t("pdf.answered"), value: `${score.answeredCount}/${score.totalCount}` },
    ],
    y
  );

  y = sectionTitle(doc, t("pdf.indices"), y);
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [[t("pdf.index"), t("pdf.score"), t("pdf.level")]],
    body: score.indices.map((idx) => [
      t(`corpResults.indices.${idx.key}.name`),
      idx.score != null ? `${Math.round(idx.score)}/100` : "—",
      levelName(idx.maturityLevel),
    ]),
    headStyles: { fillColor: BRAND, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });
  y = lastTableY(doc);

  y = sectionTitle(doc, t("pdf.pillars"), y);
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [[t("pdf.pillar"), t("pdf.score"), t("pdf.level")]],
    body: score.pillars.map((p) => [
      p.pillar,
      p.score != null ? `${Math.round(p.score)}/100` : "—",
      levelName(p.maturityLevel),
    ]),
    headStyles: { fillColor: BRAND, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });
  y = lastTableY(doc);

  y = sectionTitle(doc, t("pdf.domains"), y);
  const hasCapped = score.domains.some((d) => d.cappedByEliminatory);
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [[t("pdf.domain"), t("pdf.pillar"), t("pdf.score"), t("pdf.level"), t("pdf.answered")]],
    body: score.domains.map((d) => [
      d.cappedByEliminatory ? `${d.name} *` : d.name,
      d.pillar,
      d.score != null ? `${Math.round(d.score)}` : "—",
      levelName(d.maturityLevel),
      `${d.answeredCount}/${d.totalCount}`,
    ]),
    headStyles: { fillColor: BRAND, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  });
  y = lastTableY(doc);

  if (hasCapped) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(t("pdf.cappedNote"), PAGE_MARGIN, y - 5);
    doc.setTextColor(0, 0, 0);
  }

  if (score.eliminatoryFailures.length > 0) {
    y = sectionTitle(doc, t("pdf.eliminatoryFailures"), y);
    doc.setFillColor(220, 38, 38);
    y = bulletList(
      doc,
      score.eliminatoryFailures.map((f) => `${f.domainName}: ${f.text}`),
      y
    );
  }

  if (score.missingRequired.length > 0) {
    y = sectionTitle(doc, `${t("pdf.missingRequired")} (${score.missingRequired.length})`, y);
    doc.setFillColor(217, 119, 6);
    y = bulletList(
      doc,
      score.missingRequired.slice(0, 15).map((f) => `${f.domainName}: ${f.text}`),
      y
    );
  }

  addFooters(doc, t);
  doc.save(`AI-SecScore_${sanitizeFilename(assessment.name)}.pdf`);
}

export async function generateAssessmentPdf(
  assessmentOrId: Assessment | number,
  t: TFunction,
  lang: string
): Promise<void> {
  const assessment =
    typeof assessmentOrId === "number" ? await getAssessment(assessmentOrId) : assessmentOrId;
  if (assessment.type === "corporate") {
    await generateCorporatePdf(assessment, t, lang);
  } else {
    await generateSecurityPdf(assessment, t, lang);
  }
}
