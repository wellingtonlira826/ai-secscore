import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetAssessment, getGetAssessmentQueryKey,
  useGetCorporateRecommendations, getGetCorporateRecommendationsQueryKey,
  type RecommendedRisk, type RecBacklogItem, type RecRoadmapInitiative,
  type RecImpact, type RecEffort, type RecHorizon,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft, AlertTriangle, TrendingUp, Zap, FolderKanban, GraduationCap,
  Wrench, Download, FileText, FileCode2, CalendarRange, Grid2x2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
  high: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
};

const HORIZONS: RecHorizon[] = ["0-6", "6-12", "12-24"];

function fmtScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toFixed(1);
}

function ImpactEffortBadges({ impact, effort }: { impact: RecImpact; effort: RecEffort }) {
  const { t } = useTranslation();
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className="text-[10px]">{t(`corpRecs.impact.${impact}`)}</Badge>
      <Badge variant="outline" className="text-[10px]">{t(`corpRecs.effort.${effort}`)}</Badge>
    </span>
  );
}

function RiskRow({ risk }: { risk: RecommendedRisk }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3 rounded-lg border p-3 print:break-inside-avoid" data-testid={`row-risk-${risk.domainSlug}`}>
      <div className="text-lg font-bold tabular-nums text-muted-foreground w-7 shrink-0">{risk.rank}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{risk.title}</span>
          <Badge variant="outline" className={cn("border text-[10px] uppercase", SEVERITY_STYLES[risk.severity])}>
            {t(`corpRecs.severity.${risk.severity}`)}
          </Badge>
          {risk.cappedByEliminatory && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {risk.domainName} · {risk.pillar} · {t('corpRecs.domainScore')}: {fmtScore(risk.domainScore)}
        </p>
      </div>
    </div>
  );
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportBacklogCsv(backlog: RecBacklogItem[], t: (k: string) => string) {
  const cols = ["rank", "title", "type", "domain", "pillar", "impact", "effort", "horizon", "priority", "score"];
  const header = cols.map((c) => csvEscape(t(`corpRecs.backlogCols.${c}`))).join(",");
  const rows = backlog.map((b) =>
    [
      b.rank,
      csvEscape(b.title),
      csvEscape(t(`corpRecs.types.${b.type}`)),
      csvEscape(b.domainName),
      csvEscape(b.pillar),
      csvEscape(t(`corpRecs.impact.${b.impact}`)),
      csvEscape(t(`corpRecs.effort.${b.effort}`)),
      csvEscape(t(`corpRecs.horizon.${b.horizon}`)),
      b.priorityScore,
      b.domainScore ?? "",
    ].join(","),
  );
  const blob = new Blob(["\uFEFF" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backlog-priorizado.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function RoadmapColumn({ horizon, items }: { horizon: RecHorizon; items: RecRoadmapInitiative[] }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border p-3 print:break-inside-avoid" data-testid={`roadmap-${horizon}`}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarRange className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">{t(`corpRecs.horizon.${horizon}`)}</h4>
        <Badge variant="secondary" className="ml-auto text-[10px]">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={`${item.domainSlug}-${item.type}-${i}`} className="rounded-md border bg-muted/30 p-2.5">
            <div className="flex items-start gap-1.5">
              {item.type === "quick_win"
                ? <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                : <FolderKanban className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />}
              <span className="text-sm leading-snug">{item.title}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">{item.domainName}</span>
              <ImpactEffortBadges impact={item.impact} effort={item.effort} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
      </div>
    </div>
  );
}

function SwotQuadrant({ label, items, tone }: {
  label: string;
  items: Array<{ domainName: string; text: string }>;
  tone: string;
}) {
  return (
    <div className={cn("rounded-lg border p-3 print:break-inside-avoid", tone)}>
      <h4 className="text-sm font-semibold mb-2">{label}</h4>
      <ul className="space-y-1.5 text-sm">
        {items.map((s, i) => (
          <li key={i} className="leading-snug">
            <span className="font-medium">{s.domainName}</span>
            {s.text !== s.domainName && <span className="text-muted-foreground"> — {s.text}</span>}
          </li>
        ))}
        {items.length === 0 && <li className="text-muted-foreground text-xs">—</li>}
      </ul>
    </div>
  );
}

type PrintMode = "executive" | "technical" | null;

export default function CorporateRecommendations() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [printMode, setPrintMode] = useState<PrintMode>(null);

  const { data: assessment, isLoading: loadingAsses } = useGetAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) },
  });
  const { data: recs, isLoading: loadingRecs } = useGetCorporateRecommendations(id, {
    query: { enabled: !!id, queryKey: getGetCorporateRecommendationsQueryKey(id) },
  });

  useEffect(() => {
    if (!printMode) return;
    const timer = window.setTimeout(() => window.print(), 50);
    const reset = () => setPrintMode(null);
    window.addEventListener("afterprint", reset);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", reset);
    };
  }, [printMode]);

  if (loadingAsses || loadingRecs) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!assessment || !recs) {
    return <div className="p-8 text-center text-destructive">{t('common.error')}</div>;
  }

  const hasData = recs.topRisks.length > 0;
  const isTech = printMode === "technical";

  const recommendationsBody = (
    <div className="space-y-6">
      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> {t('corpRecs.sections.risks')}</CardTitle>
          <CardDescription>{t('corpRecs.sections.risksDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recs.topRisks.map((r) => <RiskRow key={r.domainId} risk={r} />)}
        </CardContent>
      </Card>

      <Card className="print:border-0 print:shadow-none print:break-before-page">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> {t('corpRecs.sections.opportunities')}</CardTitle>
          <CardDescription>{t('corpRecs.sections.opportunitiesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recs.topOpportunities.map((o) => (
            <div key={o.domainId} className="flex gap-3 rounded-lg border p-3 print:break-inside-avoid" data-testid={`row-opportunity-${o.domainSlug}`}>
              <div className="text-lg font-bold tabular-nums text-muted-foreground w-7 shrink-0">{o.rank}</div>
              <div className="min-w-0 flex-1">
                <span className="font-medium">{o.title}</span>
                <p className="text-sm text-muted-foreground mt-1">{o.description}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{o.domainName} · {o.pillar}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:border-0 print:shadow-none print:break-before-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> {t('corpRecs.sections.quickWins')}</CardTitle>
            <CardDescription>{t('corpRecs.sections.quickWinsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recs.quickWins.map((qw) => (
              <div key={qw.domainId} className="rounded-lg border p-3 print:break-inside-avoid" data-testid={`row-quickwin-${qw.domainSlug}`}>
                <div className="text-sm font-medium leading-snug">{qw.title}</div>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{qw.domainName}</span>
                  <ImpactEffortBadges impact={qw.impact} effort={qw.effort} />
                </div>
              </div>
            ))}
            {recs.quickWins.length === 0 && <p className="text-sm text-muted-foreground">{t('corpRecs.noGaps')}</p>}
          </CardContent>
        </Card>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FolderKanban className="w-4 h-4 text-blue-500" /> {t('corpRecs.sections.projects')}</CardTitle>
            <CardDescription>{t('corpRecs.sections.projectsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recs.priorityProjects.map((p) => (
              <div key={p.domainId} className="rounded-lg border p-3 print:break-inside-avoid" data-testid={`row-project-${p.domainSlug}`}>
                <div className="text-sm font-medium leading-snug">{p.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{p.domainName} · {t(`corpRecs.horizon.${p.horizon}`)}</span>
                  <ImpactEffortBadges impact={p.impact} effort={p.effort} />
                </div>
              </div>
            ))}
            {recs.priorityProjects.length === 0 && <p className="text-sm text-muted-foreground">{t('corpRecs.noGaps')}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-6">
        <Card className="print:border-0 print:shadow-none print:break-before-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-500" /> {t('corpRecs.sections.trainings')}</CardTitle>
            <CardDescription>{t('corpRecs.sections.trainingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recs.trainings.map((tr) => (
              <div key={tr.domainId} className="rounded-lg border p-3 print:break-inside-avoid" data-testid={`row-training-${tr.domainSlug}`}>
                <div className="text-sm font-medium leading-snug">{tr.title}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('corpRecs.audience')}: {tr.audience} · {tr.domainName}</p>
              </div>
            ))}
            {recs.trainings.length === 0 && <p className="text-sm text-muted-foreground">{t('corpRecs.noGaps')}</p>}
          </CardContent>
        </Card>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4 text-cyan-500" /> {t('corpRecs.sections.tools')}</CardTitle>
            <CardDescription>{t('corpRecs.sections.toolsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recs.tools.map((tool) => (
              <div key={tool.domainId} className="rounded-lg border p-3 print:break-inside-avoid" data-testid={`row-tools-${tool.domainSlug}`}>
                <div className="text-sm font-medium">{tool.domainName}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {tool.tools.map((name) => (
                    <Badge key={name} variant="secondary" className="text-[10px]">{name}</Badge>
                  ))}
                </div>
              </div>
            ))}
            {recs.tools.length === 0 && <p className="text-sm text-muted-foreground">{t('corpRecs.noGaps')}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const roadmapBody = (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader>
        <CardTitle>{t('corpRecs.roadmapTitle')}</CardTitle>
        <CardDescription>{t('corpRecs.roadmapDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:block print:space-y-4">
          {HORIZONS.map((h) => (
            <RoadmapColumn key={h} horizon={h} items={recs.roadmap.filter((r) => r.horizon === h)} />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const swotBody = (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Grid2x2 className="w-4 h-4" /> {t('corpRecs.swotTitle')}</CardTitle>
        <CardDescription>{t('corpRecs.swotDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SwotQuadrant label={t('corpRecs.swotQuad.strengths')} items={recs.swot.strengths} tone="bg-emerald-500/5 border-emerald-500/30" />
          <SwotQuadrant label={t('corpRecs.swotQuad.weaknesses')} items={recs.swot.weaknesses} tone="bg-red-500/5 border-red-500/30" />
          <SwotQuadrant label={t('corpRecs.swotQuad.opportunities')} items={recs.swot.opportunities} tone="bg-blue-500/5 border-blue-500/30" />
          <SwotQuadrant label={t('corpRecs.swotQuad.threats')} items={recs.swot.threats} tone="bg-amber-500/5 border-amber-500/30" />
        </div>
      </CardContent>
    </Card>
  );

  const backlogBody = (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <CardTitle>{t('corpRecs.backlogTitle')}</CardTitle>
            <CardDescription className="mt-1.5">{t('corpRecs.backlogDesc')}</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 print:hidden"
            onClick={() => exportBacklogCsv(recs.backlog, t)}
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4" /> {t('corpRecs.exportCsv')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-2 font-medium">{t('corpRecs.backlogCols.rank')}</th>
                <th className="py-2 px-2 font-medium">{t('corpRecs.backlogCols.title')}</th>
                <th className="py-2 px-2 font-medium">{t('corpRecs.backlogCols.type')}</th>
                <th className="py-2 px-2 font-medium">{t('corpRecs.backlogCols.domain')}</th>
                <th className="py-2 px-2 font-medium">{t('corpRecs.backlogCols.impact')}</th>
                <th className="py-2 px-2 font-medium">{t('corpRecs.backlogCols.horizon')}</th>
                <th className="py-2 pl-2 font-medium text-right">{t('corpRecs.backlogCols.priority')}</th>
              </tr>
            </thead>
            <tbody>
              {recs.backlog.map((b) => (
                <tr key={b.rank} className="border-b border-border/50" data-testid={`row-backlog-${b.rank}`}>
                  <td className="py-2 pr-2 tabular-nums text-muted-foreground">{b.rank}</td>
                  <td className="py-2 px-2 font-medium">{b.title}</td>
                  <td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{t(`corpRecs.types.${b.type}`)}</Badge></td>
                  <td className="py-2 px-2 text-muted-foreground">{b.domainName}</td>
                  <td className="py-2 px-2">{t(`corpRecs.impact.${b.impact}`)}</td>
                  <td className="py-2 px-2">{t(`corpRecs.horizon.${b.horizon}`)}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{b.priorityScore.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recs.backlog.length === 0 && <p className="text-sm text-muted-foreground mt-3">{t('corpRecs.empty')}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:bg-white print:text-black">
      {/* Screen header */}
      <div className="flex flex-col gap-3 print:hidden">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link href={`/assessments/${id}/corporate-results`}>
            <span className="hover:text-primary cursor-pointer flex items-center text-sm font-medium" data-testid="link-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('assessment.back')}
            </span>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('corpRecs.title')}</h1>
              <Badge variant="secondary">{t('corporate.badge')}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{assessment.name} • {assessment.systemName} — {t('corpRecs.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPrintMode("executive")} data-testid="button-print-executive">
              <FileText className="w-4 h-4" /> {t('corpRecs.printExecutive')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPrintMode("technical")} data-testid="button-print-technical">
              <FileCode2 className="w-4 h-4" /> {t('corpRecs.printTechnical')}
            </Button>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">
          {isTech ? t('corpRecs.reportTechnical') : t('corpRecs.reportExecutive')}
        </h1>
        <p className="text-sm mt-1">{assessment.name} • {assessment.systemName}</p>
        <p className="text-xs mt-0.5">
          {t('corpRecs.generatedOn', { date: new Date().toLocaleDateString(i18n.language) })}
          {recs.generatedForScore != null && <> · {t('corpRecs.overallScore')}: {fmtScore(recs.generatedForScore)} / 100</>}
        </p>
        <hr className="my-4" />
      </div>

      {!hasData && (
        <Card className="print:hidden">
          <CardContent className="p-8 text-center text-muted-foreground">{t('corpRecs.empty')}</CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* Screen: tabbed */}
          <div className="print:hidden">
            <Tabs defaultValue="recommendations">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="recommendations" data-testid="tab-recommendations">{t('corpRecs.tabs.recommendations')}</TabsTrigger>
                <TabsTrigger value="roadmap" data-testid="tab-roadmap">{t('corpRecs.tabs.roadmap')}</TabsTrigger>
                <TabsTrigger value="swot" data-testid="tab-swot">{t('corpRecs.tabs.swot')}</TabsTrigger>
                <TabsTrigger value="backlog" data-testid="tab-backlog">{t('corpRecs.tabs.backlog')}</TabsTrigger>
              </TabsList>
              <TabsContent value="recommendations" className="mt-4">{recommendationsBody}</TabsContent>
              <TabsContent value="roadmap" className="mt-4">{roadmapBody}</TabsContent>
              <TabsContent value="swot" className="mt-4">{swotBody}</TabsContent>
              <TabsContent value="backlog" className="mt-4">{backlogBody}</TabsContent>
            </Tabs>
          </div>

          {/* Print: linear report. Executive = risks/opps/swot/roadmap; technical adds full detail + backlog. */}
          <div className="hidden print:block space-y-6">
            {isTech ? (
              <>
                {recommendationsBody}
                {roadmapBody}
                {swotBody}
                {backlogBody}
              </>
            ) : (
              <>
                <Card className="print:border-0 print:shadow-none">
                  <CardHeader>
                    <CardTitle>{t('corpRecs.sections.risks')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recs.topRisks.map((r) => <RiskRow key={r.domainId} risk={r} />)}
                  </CardContent>
                </Card>
                <Card className="print:border-0 print:shadow-none print:break-before-page">
                  <CardHeader>
                    <CardTitle>{t('corpRecs.sections.opportunities')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recs.topOpportunities.map((o) => (
                      <div key={o.domainId} className="rounded-lg border p-3 print:break-inside-avoid">
                        <span className="font-medium">{o.rank}. {o.title}</span>
                        <p className="text-sm text-muted-foreground mt-1">{o.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {swotBody}
                {roadmapBody}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
