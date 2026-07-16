import { useState } from "react";
import { useParams, Link } from "wouter";
import { generateAssessmentPdf } from "@/lib/pdfReport";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetAssessment, getGetAssessmentQueryKey,
  useGetAssessmentScore, getGetAssessmentScoreQueryKey,
  useGetAssessmentGaps, getGetAssessmentGapsQueryKey,
  useGetAssessmentSummary, getGetAssessmentSummaryQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip 
} from "recharts";
import { Download, ChevronLeft, AlertTriangle, ShieldCheck, DownloadCloud, Layers, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { RemediationPlan } from "@/components/features/RemediationPlan";

const GRADE_COLORS: Record<string, string> = {
  'A': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  'B': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  'C': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  'D': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  'F': 'text-red-500 bg-red-500/10 border-red-500/20',
};

const RISK_COLORS: Record<string, string> = {
  'Low': 'bg-emerald-500 text-white',
  'Medium': 'bg-amber-500 text-white',
  'High': 'bg-orange-500 text-white',
  'Critical': 'bg-red-500 text-white',
};

export default function ResultsDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "es" | "pt-BR";
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const { data: assessment, isLoading: loadingAsses } = useGetAssessment(id, { query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) } });
  const { data: score, isLoading: loadingScore } = useGetAssessmentScore(id, { query: { enabled: !!id, queryKey: getGetAssessmentScoreQueryKey(id) } });
  const { data: gaps, isLoading: loadingGaps } = useGetAssessmentGaps(id, { query: { enabled: !!id, queryKey: getGetAssessmentGapsQueryKey(id) } });
  const summaryLangParam = { lang } as any;
  const { data: summary, isLoading: loadingSumm } = useGetAssessmentSummary(id, summaryLangParam, { query: { enabled: !!id, queryKey: [...getGetAssessmentSummaryQueryKey(id), lang] } });

  const handleExportPdf = async () => {
    if (!assessment) return;
    setExporting(true);
    try {
      await generateAssessmentPdf(assessment, t, lang);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportJson = () => {
    if (!score || !gaps || !summary || !assessment) return;
    const data = { assessment, score, summary, gaps };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-${id}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingAsses || loadingScore || loadingGaps || loadingSumm) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!assessment || !score || !gaps || !summary) {
    return <div className="p-8 text-center text-destructive">{t('common.error')}</div>;
  }

  const radarData = score.frameworkScores.map(fs => ({
    subject: fs.frameworkName,
    score: fs.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:bg-white print:text-black print:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Link href={`/assessments/${id}`}>
                <span className="hover:text-primary cursor-pointer flex items-center text-sm font-medium">
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t('assessment.back')}
                </span>
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('results.title')}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{assessment.name} • {assessment.systemName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href={`/assessments/${id}/compliance`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">{t('compliance.title')}</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1.5">
              <DownloadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">{t('results.exportJson')}</span>
              <span className="sm:hidden">JSON</span>
            </Button>
            <Button size="sm" onClick={handleExportPdf} disabled={exporting} className="gap-1.5" data-testid="button-export-pdf">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{t('results.exportPdf')}</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden print:block mb-8">
        <h1 className="text-4xl font-bold border-b pb-4 mb-4 text-black">AI Security Assessment Report</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>System:</strong> {assessment.systemName}</div>
          <div><strong>Assessment:</strong> {assessment.name}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          <div><strong>Status:</strong> {assessment.status}</div>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <Card className="flex flex-col items-center justify-center p-6 md:p-8 text-center bg-gradient-to-br from-card to-card/50">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">{t('results.overallScore')}</div>
          <div className={cn("w-32 h-32 rounded-full flex items-center justify-center text-7xl font-bold border-4 shadow-xl mb-6", GRADE_COLORS[score.grade] || "text-foreground border-border")}>
            {score.grade}
          </div>
          <div className="text-4xl font-bold tracking-tighter mb-2">{Math.round(score.overallScore)}<span className="text-2xl text-muted-foreground">/100</span></div>
          <Badge className={cn("text-sm px-3 py-1", RISK_COLORS[score.riskLevel])}>{t(`common.riskLevel.${score.riskLevel}`, score.riskLevel)} {t('results.riskLevel')}</Badge>
        </Card>

        {/* Executive Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('results.executiveSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-base leading-relaxed print:text-black">{summary.summaryText}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {t('results.strengths')}</h4>
                <ul className="space-y-2">
                  {summary.strengths.slice(0,3).map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> 
                      <span className="print:text-black">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t('results.weaknesses')}</h4>
                <ul className="space-y-2">
                  {summary.weaknesses.slice(0,3).map((w, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span> 
                      <span className="print:text-black">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Frameworks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>{t('results.frameworkScores')}</CardTitle>
            <CardDescription>{t('results.frameworkScoresDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="print:break-inside-avoid">
          <CardHeader>
            <CardTitle>{t('results.frameworkBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {score.frameworkScores.map((fs) => (
              <div key={fs.frameworkId} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{fs.frameworkName}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px] uppercase", RISK_COLORS[fs.riskLevel]?.replace('text-white', ''))}>
                      {t(`common.riskLevel.${fs.riskLevel}`, fs.riskLevel)}
                    </Badge>
                    {Math.round(fs.score)}%
                  </span>
                </div>
                <Progress value={fs.score} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">{fs.answeredCount} / {fs.totalCount} answered</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Gaps */}
      <Card className="print:break-before-page print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {t('results.topGaps')}
          </CardTitle>
          <CardDescription>{t('results.topGapsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {gaps && gaps.length > 0 ? (
            <div className="space-y-4">
              {gaps.map((gap, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors print:border-b print:rounded-none">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{gap.frameworkName}</Badge>
                        <Badge variant="secondary" className="text-xs">{gap.section}</Badge>
                      </div>
                      <h4 className="text-base font-medium mt-2">{t(`questions.${gap.questionId}.text`, gap.questionText)}</h4>
                      {gap.remediation && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-md text-sm text-muted-foreground border-l-2 border-primary">
                          <strong className="text-foreground">{t('results.remediation')}</strong> {t(`questions.${gap.questionId}.remediation`, gap.remediation)}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="destructive" className="mb-2">{t('results.weight')}: {gap.weight}/3</Badge>
                      <div className="text-sm font-medium">Maturity: {gap.maturityLevel ?? 'N/A'}/3</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remediation Plan */}
      <RemediationPlan assessmentId={id} />
    </div>
  );
}
