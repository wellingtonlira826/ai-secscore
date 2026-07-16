import { useState } from "react";
import { Link } from "wouter";
import { useListAssessments, type Assessment } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { generateAssessmentPdf } from "@/lib/pdfReport";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { data: assessments, isLoading } = useListAssessments();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const handlePdf = async (assessment: Assessment) => {
    setGeneratingId(assessment.id);
    try {
      await generateAssessmentPdf(assessment, t, i18n.language);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setGeneratingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  const resultsPath = (a: { id: number; type?: string }) =>
    a.type === "corporate"
      ? `/assessments/${a.id}/corporate-results`
      : `/assessments/${a.id}/results`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("reports.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
      </div>

      {assessments && assessments.length > 0 ? (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate" title={assessment.name}>
                      {assessment.name}
                    </h3>
                    <Badge variant="secondary">
                      {assessment.type === "corporate"
                        ? t("reports.typeCorporate")
                        : t("reports.typeSecurity")}
                    </Badge>
                    <Badge variant={assessment.status === "completed" ? "default" : "outline"}>
                      {assessment.status === "completed"
                        ? t("assessments.status.completed")
                        : t("assessments.status.in_progress")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5" title={assessment.systemName}>
                    {assessment.systemName}
                  </p>
                  <div className="flex items-center gap-3 mt-3 max-w-xs">
                    <Progress value={assessment.completionPct} className="h-2" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Math.round(assessment.completionPct)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handlePdf(assessment)}
                    disabled={generatingId !== null}
                    data-testid={`button-report-pdf-${assessment.id}`}
                  >
                    {generatingId === assessment.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {t("reports.generatePdf")}
                  </Button>
                  <Link href={resultsPath(assessment)}>
                    <Button size="sm" variant="outline" data-testid={`button-report-view-${assessment.id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t("reports.viewResults")}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed rounded-xl bg-card/50">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">{t("reports.empty")}</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">{t("reports.emptyDesc")}</p>
        </div>
      )}
    </div>
  );
}
