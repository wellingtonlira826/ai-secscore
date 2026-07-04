import { useGetAssessmentHistory } from "@workspace/api-client-react";
import type { AssessmentHistoryGroup } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { LineChart as LineChartIcon, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

function SystemHistoryCard({ group }: { group: AssessmentHistoryGroup }) {
  const { t, i18n } = useTranslation();

  const points = [...group.points].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const chartData = points.map((p) => ({
    ...p,
    label: new Date(p.createdAt).toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
    }),
    score: Math.round(p.overallScore),
  }));

  const latest = points[points.length - 1];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate" title={group.systemName}>
            {group.systemName}
          </CardTitle>
          <CardDescription>
            {t("history.assessmentsCount", { count: points.length })}
          </CardDescription>
        </div>
        {latest && (
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold">{Math.round(latest.overallScore)}</div>
            <div className="text-xs text-muted-foreground">{t("history.latestScore")}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number) => [value, t("history.scoreOverTime")]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {points
            .slice()
            .reverse()
            .map((p) => (
              <Link key={p.assessmentId} href={`/assessments/${p.assessmentId}/results`}>
                <div className="group flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="min-w-0">
                    <div className="font-medium truncate" title={p.assessmentName}>
                      {p.assessmentName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString(i18n.language, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={p.status === "completed" ? "default" : "secondary"}>
                      {p.status === "completed"
                        ? t("assessments.status.completed")
                        : t("assessments.status.in_progress")}
                    </Badge>
                    <span className="text-sm font-semibold w-10 text-right">
                      {Math.round(p.overallScore)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function History() {
  const { t } = useTranslation();
  const { data: groups, isLoading, error } = useGetAssessmentHistory();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[420px]" />
          <Skeleton className="h-[420px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">{t("common.error")}</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("history.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("history.subtitle")}</p>
        </div>
        {groups && groups.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <TrendingUp className="w-4 h-4" />
            {t("history.systemsTracked")}: <span className="font-semibold text-foreground">{groups.length}</span>
          </div>
        )}
      </div>

      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <SystemHistoryCard key={group.systemName} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed rounded-xl bg-card/50">
          <LineChartIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">{t("history.empty")}</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">{t("history.emptyDesc")}</p>
        </div>
      )}
    </div>
  );
}
