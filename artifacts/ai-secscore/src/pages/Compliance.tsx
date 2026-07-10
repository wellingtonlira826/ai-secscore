import { useParams, Link } from "wouter";
import {
  useGetComplianceView, getGetComplianceViewQueryKey,
  useGetAssessment, getGetAssessmentQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ExternalLink, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const RISK_COLORS: Record<string, string> = {
  Low: "bg-emerald-500 text-white",
  Medium: "bg-amber-500 text-white",
  High: "bg-orange-500 text-white",
  Critical: "bg-red-500 text-white",
};

export default function Compliance() {
  const { t } = useTranslation();
  const params = useParams();
  const id = parseInt(params.id || "0");

  const { data: assessment } = useGetAssessment(id, {
    query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) },
  });
  const { data: view, isLoading } = useGetComplianceView(id, {
    query: { enabled: !!id, queryKey: getGetComplianceViewQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!view) {
    return <div className="p-8 text-center text-destructive">{t("common.error")}</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Link href={`/assessments/${id}/results`}>
          <span className="hover:text-primary cursor-pointer flex items-center text-sm font-medium text-muted-foreground w-fit">
            <ChevronLeft className="w-4 h-4 mr-1" /> {t("results.title")}
          </span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="w-7 h-7 text-primary" />
          {t("compliance.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("compliance.subtitle")}
          {assessment && <> — {assessment.name} • {assessment.systemName}</>}
        </p>
      </div>

      {view.categories.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl">
          {t("common.noData")}
        </div>
      ) : (
        <div className="space-y-6">
          {view.categories.map((cat) => (
            <Card key={cat.category}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t(`compliance.category.${cat.category}`, cat.category)}</CardTitle>
                    <CardDescription>{t("compliance.avgScore")}: {Math.round(cat.avgScore)}%</CardDescription>
                  </div>
                  <div className="text-2xl font-bold tracking-tighter shrink-0">{Math.round(cat.avgScore)}<span className="text-sm text-muted-foreground">%</span></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cat.frameworks.map((fw) => (
                  <div key={fw.frameworkId} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        {fw.frameworkName}
                        {fw.referenceUrl && (
                          <a href={fw.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge className={cn("text-[10px] uppercase", RISK_COLORS[fw.riskLevel])}>
                          {t(`common.riskLevel.${fw.riskLevel}`, fw.riskLevel)}
                        </Badge>
                        {Math.round(fw.score)}%
                      </span>
                    </div>
                    <Progress value={fw.score} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">{fw.answeredCount} / {fw.totalCount}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
