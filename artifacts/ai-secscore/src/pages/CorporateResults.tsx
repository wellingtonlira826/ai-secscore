import { useState } from "react";
import { useParams, useSearch, Link } from "wouter";
import { generateAssessmentPdf } from "@/lib/pdfReport";
import { useToast } from "@/hooks/use-toast";
import {
  useGetAssessment, getGetAssessmentQueryKey,
  useGetCorporateScore, getGetCorporateScoreQueryKey,
  useListMaturityLevels,
  useListCorpBenchmarkProfiles,
  useGetCorporateBenchmark, getGetCorporateBenchmarkQueryKey,
  type CorpDomainScore,
  type CorpIndexScore,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { ChevronLeft, AlertTriangle, ShieldAlert, Gauge, Bot, Sparkles, TrendingUp, TrendingDown, Minus, Download, Loader2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const LEVEL_TILE_STYLES: Record<number, string> = {
  1: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
  2: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  3: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  4: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  5: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
};

const LEVEL_DOT_STYLES: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-amber-500",
  4: "bg-blue-500",
  5: "bg-emerald-500",
};

const INDEX_ICONS: Record<string, typeof Gauge> = {
  maturity: Gauge,
  risk: ShieldAlert,
  genai_readiness: Sparkles,
  agent_readiness: Bot,
};

function fmtScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toFixed(1);
}

function IndexCard({ index }: { index: CorpIndexScore }) {
  const { t } = useTranslation();
  const Icon = INDEX_ICONS[index.key] ?? Gauge;
  const isRisk = index.key === "risk";
  return (
    <Card data-testid={`card-index-${index.key}`}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t(`corpResults.indices.${index.key}.name`)}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">{fmtScore(index.score)}</span>
          {!isRisk && index.maturityLevel != null && (
            <Badge variant="outline" className={cn("border", LEVEL_TILE_STYLES[index.maturityLevel])}>
              {t('corpResults.level', { level: index.maturityLevel })}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {t(`corpResults.indices.${index.key}.desc`)}
        </p>
      </CardContent>
    </Card>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  const { t } = useTranslation();
  if (delta == null) return <span className="text-muted-foreground">—</span>;
  const positive = delta > 0;
  const zero = delta === 0;
  const Icon = zero ? Minus : positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        zero ? "text-muted-foreground" : positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
      )}
      title={positive ? t('corpResults.benchmark.above') : zero ? undefined : t('corpResults.benchmark.below')}
    >
      <Icon className="w-3.5 h-3.5" />
      {positive ? "+" : ""}{delta.toFixed(1)}
    </span>
  );
}

function DomainTile({ domain }: { domain: CorpDomainScore }) {
  const { t } = useTranslation();
  const style = domain.maturityLevel != null
    ? LEVEL_TILE_STYLES[domain.maturityLevel]
    : "bg-muted/40 border-border text-muted-foreground";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          data-testid={`tile-domain-${domain.slug}`}
          className={cn("rounded-lg border p-2.5 flex flex-col gap-1 min-h-[76px] cursor-default", style)}
        >
          <div className="text-xs font-medium leading-tight line-clamp-2">{domain.name}</div>
          <div className="mt-auto flex items-center justify-between gap-1">
            <span className="text-sm font-bold tabular-nums">{fmtScore(domain.score)}</span>
            <span className="flex items-center gap-1">
              {domain.cappedByEliminatory && <AlertTriangle className="w-3.5 h-3.5" />}
              {domain.maturityLevel != null && (
                <span className="text-[10px] font-semibold uppercase">N{domain.maturityLevel}</span>
              )}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        <p className="font-medium">{domain.name}</p>
        <p className="text-xs mt-1">
          {t('corpResults.answeredOf', { answered: domain.answeredCount, total: domain.totalCount })}
        </p>
        {domain.cappedByEliminatory && (
          <p className="text-xs mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {t('corpResults.capped')}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default function CorporateResults() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const search = useSearch();
  const id = parseInt(params.id || "0");
  const initialTab = new URLSearchParams(search).get("tab") === "benchmark" ? "benchmark" : "overview";
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [profileSlug, setProfileSlug] = useState<string>("");

  const { data: assessment, isLoading: loadingAsses } = useGetAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) },
  });
  const { data: score, isLoading: loadingScore } = useGetCorporateScore(id, {
    query: { enabled: !!id, queryKey: getGetCorporateScoreQueryKey(id) },
  });
  const { data: levels } = useListMaturityLevels();
  const { data: profiles } = useListCorpBenchmarkProfiles();

  const effectiveProfile = profileSlug || profiles?.[0]?.slug || "";
  const benchmarkParams = { profile: effectiveProfile };
  const { data: benchmark, isLoading: loadingBench } = useGetCorporateBenchmark(id, benchmarkParams, {
    query: {
      enabled: !!id && !!effectiveProfile,
      queryKey: getGetCorporateBenchmarkQueryKey(id, benchmarkParams),
    },
  });

  const handleExportPdf = async () => {
    if (!assessment) return;
    setExporting(true);
    try {
      await generateAssessmentPdf(assessment, t, i18n.language);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loadingAsses || loadingScore) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!assessment || !score) {
    return <div className="p-8 text-center text-destructive">{t('common.error')}</div>;
  }

  const levelInfo = score.maturityLevel != null
    ? levels?.find((l) => l.level === score.maturityLevel)
    : undefined;

  const radarData = score.pillars.map((p) => ({
    subject: p.pillar,
    score: p.score ?? 0,
    fullMark: 100,
  }));

  const domainsByPillar = score.pillars.map((p) => ({
    pillar: p.pillar,
    pillarScore: p.score,
    pillarLevel: p.maturityLevel,
    domains: score.domains.filter((d) => d.pillar === p.pillar),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Link href={`/assessments/${id}`}>
            <span className="hover:text-primary cursor-pointer flex items-center text-sm font-medium" data-testid="link-back">
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('assessment.back')}
            </span>
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('corpResults.title')}</h1>
              <Badge variant="secondary">{t('corporate.badge')}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{assessment.name} • {assessment.systemName}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={`/assessments/${id}/recommendations`}>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-open-recommendations">
                <Lightbulb className="w-4 h-4" /> {t('corpRecs.openRecs')}
              </Button>
            </Link>
            <Button size="sm" onClick={handleExportPdf} disabled={exporting} className="gap-1.5" data-testid="button-export-pdf">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{t('results.exportPdf')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {score.missingRequired.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4" data-testid="alert-missing-required">
          <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {t('corpResults.missingRequiredTitle')}
          </div>
          <p className="text-sm mt-1 text-amber-700/90 dark:text-amber-400/90">
            {t('corpResults.missingRequired', { count: score.missingRequired.length })}
          </p>
        </div>
      )}
      {score.eliminatoryFailures.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4" data-testid="alert-eliminatory">
          <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {t('corpResults.eliminatoryTitle')}
          </div>
          <p className="text-sm mt-1 text-red-700/90 dark:text-red-400/90">{t('corpResults.eliminatoryDesc')}</p>
          <ul className="mt-2 space-y-1 text-sm text-red-700/90 dark:text-red-400/90 list-disc pl-5">
            {score.eliminatoryFailures.map((f) => (
              <li key={f.questionId}><span className="font-medium">{f.domainName}:</span> {f.text}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Overall + indices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1" data-testid="card-overall">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('corpResults.overallScore')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold tabular-nums" data-testid="text-overall-score">
                {fmtScore(score.overallScore)}
              </span>
              <span className="text-muted-foreground text-sm">/ 100</span>
            </div>
            {score.maturityLevel != null && (
              <div className="mt-3 flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", LEVEL_DOT_STYLES[score.maturityLevel])} />
                <span className="font-medium" data-testid="text-maturity-level">
                  {t('corpResults.level', { level: score.maturityLevel })}
                  {levelInfo ? ` — ${levelInfo.name}` : ""}
                </span>
              </div>
            )}
            {score.overallScore == null && (
              <p className="text-sm text-muted-foreground mt-2">{t('corpResults.noAnswers')}</p>
            )}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{t('corpResults.completion')}</span>
                <span>{t('corpResults.answeredOf', { answered: score.answeredCount, total: score.totalCount })} · {Math.round(score.completionPct)}%</span>
              </div>
              <Progress value={score.completionPct} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {score.indices.map((idx) => (
            <IndexCard key={idx.key} index={idx} />
          ))}
        </div>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">{t('corpResults.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="benchmark" data-testid="tab-benchmark">{t('corpResults.tabs.benchmark')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Radar */}
          <Card>
            <CardHeader>
              <CardTitle>{t('corpResults.radarTitle')}</CardTitle>
              <CardDescription>{t('corpResults.radarDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <RechartsTooltip formatter={(value: number) => value.toFixed(1)} />
                    <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>{t('corpResults.heatmapTitle')}</CardTitle>
              <CardDescription>{t('corpResults.heatmapDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <span key={lvl} className="flex items-center gap-1.5">
                    <span className={cn("w-2.5 h-2.5 rounded-full", LEVEL_DOT_STYLES[lvl])} />
                    {t('corpResults.level', { level: lvl })}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {t('corpResults.capped')}
                </span>
              </div>
              {domainsByPillar.map((group) => (
                <div key={group.pillar}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.pillar}</h4>
                    <span className="text-xs text-muted-foreground tabular-nums">{fmtScore(group.pillarScore)}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {group.domains.map((d) => (
                      <DomainTile key={d.domainId} domain={d} />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <CardTitle>{t('corpResults.benchmark.title')}</CardTitle>
                  <CardDescription className="mt-1.5">{t('corpResults.benchmark.desc')}</CardDescription>
                </div>
                <Select value={effectiveProfile} onValueChange={setProfileSlug}>
                  <SelectTrigger className="w-full sm:w-[240px]" data-testid="select-benchmark-profile">
                    <SelectValue placeholder={t('corpResults.benchmark.selectProfile')} />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingBench && <Skeleton className="h-64" />}
              {!loadingBench && benchmark && (
                <>
                  <p className="text-sm text-muted-foreground">{benchmark.profileDescription}</p>

                  {/* Overall comparison */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('corpResults.benchmark.you')}</div>
                      <div className="text-2xl font-bold tabular-nums mt-1" data-testid="text-benchmark-client">{fmtScore(benchmark.overallClient)}</div>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('corpResults.benchmark.market')}</div>
                      <div className="text-2xl font-bold tabular-nums mt-1" data-testid="text-benchmark-market">{fmtScore(benchmark.overallBenchmark)}</div>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{t('corpResults.benchmark.delta')}</div>
                      <div className="text-2xl mt-1" data-testid="text-benchmark-delta"><DeltaBadge delta={benchmark.overallDelta} /></div>
                    </div>
                  </div>

                  {/* Pillar comparison */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">{t('corpResults.benchmark.pillar')}</h4>
                    <div className="space-y-3">
                      {benchmark.pillars.map((p) => (
                        <div key={p.pillar}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium">{p.pillar}</span>
                            <span className="flex items-center gap-3 text-xs tabular-nums">
                              <span>{t('corpResults.benchmark.you')}: <strong>{fmtScore(p.clientScore)}</strong></span>
                              <span className="text-muted-foreground">{t('corpResults.benchmark.market')}: {fmtScore(p.benchmarkScore)}</span>
                              <DeltaBadge delta={p.delta} />
                            </span>
                          </div>
                          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-primary/80 rounded-full"
                              style={{ width: `${p.clientScore ?? 0}%` }}
                            />
                            <div
                              className="absolute inset-y-0 w-0.5 bg-foreground/60"
                              style={{ left: `${p.benchmarkScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domain table */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">{t('corpResults.benchmark.domain')}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="py-2 pr-2 font-medium">{t('corpResults.benchmark.domain')}</th>
                            <th className="py-2 px-2 font-medium text-right">{t('corpResults.benchmark.you')}</th>
                            <th className="py-2 px-2 font-medium text-right">{t('corpResults.benchmark.market')}</th>
                            <th className="py-2 pl-2 font-medium text-right">{t('corpResults.benchmark.delta')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {benchmark.domains.map((d) => (
                            <tr key={d.domainId} className="border-b border-border/50" data-testid={`row-benchmark-${d.slug}`}>
                              <td className="py-2 pr-2">
                                <div className="font-medium">{d.name}</div>
                                <div className="text-xs text-muted-foreground">{d.pillar}</div>
                              </td>
                              <td className="py-2 px-2 text-right tabular-nums">{fmtScore(d.clientScore)}</td>
                              <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">{fmtScore(d.benchmarkScore)}</td>
                              <td className="py-2 pl-2 text-right"><DeltaBadge delta={d.delta} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
