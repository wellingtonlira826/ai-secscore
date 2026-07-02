import { useState } from "react";
import { 
  useListAssessments,
  useCompareAssessments,
  getCompareAssessmentsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { GitCompare, ArrowRight, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function CompareAssessments() {
  const { t } = useTranslation();
  const { data: assessments, isLoading: loadingAssessments } = useListAssessments();
  
  const [id1, setId1] = useState<string>("");
  const [id2, setId2] = useState<string>("");

  const numId1 = parseInt(id1);
  const numId2 = parseInt(id2);
  const isReady = !isNaN(numId1) && !isNaN(numId2) && numId1 !== numId2;

  const { data: comparison, isLoading: loadingCompare } = useCompareAssessments(
    { id1: numId1, id2: numId2 },
    { query: { enabled: isReady, queryKey: getCompareAssessmentsQueryKey({ id1: numId1, id2: numId2 }) } }
  );

  const formatDiff = (diff: number) => {
    if (diff > 0) return <span className="text-emerald-500 flex items-center"><ArrowUp className="w-3 h-3 mr-1"/>+{diff.toFixed(1)}</span>;
    if (diff < 0) return <span className="text-red-500 flex items-center"><ArrowDown className="w-3 h-3 mr-1"/>{diff.toFixed(1)}</span>;
    return <span className="text-muted-foreground flex items-center"><Minus className="w-3 h-3 mr-1"/>0.0</span>;
  };

  const chartData = comparison?.frameworkDiffs.map(fd => ({
    name: fd.frameworkName,
    [comparison.assessment1.assessmentId]: Math.round(fd.score1),
    [comparison.assessment2.assessmentId]: Math.round(fd.score2),
  })) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('compare.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('compare.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            {t('compare.noSelection')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Select value={id1} onValueChange={setId1}>
                <SelectTrigger>
                  <SelectValue placeholder={t('compare.selectFirst')} />
                </SelectTrigger>
                <SelectContent>
                  {assessments?.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()} disabled={a.id.toString() === id2}>
                      {a.name} ({a.systemName}) - {a.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="shrink-0 text-muted-foreground p-2 bg-muted rounded-full">
              <ArrowRight className="w-5 h-5 hidden md:block" />
              <ArrowDown className="w-5 h-5 md:hidden" />
            </div>

            <div className="flex-1 w-full">
              <Select value={id2} onValueChange={setId2}>
                <SelectTrigger>
                  <SelectValue placeholder={t('compare.selectSecond')} />
                </SelectTrigger>
                <SelectContent>
                  {assessments?.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()} disabled={a.id.toString() === id1}>
                      {a.name} ({a.systemName}) - {a.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isReady && loadingCompare && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      )}

      {isReady && comparison && !loadingCompare && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6 flex flex-col justify-center border-l-4 border-l-muted">
              <div className="text-sm font-medium text-muted-foreground mb-2">{t('compare.baseline')}</div>
              <div className="text-4xl font-bold mb-2">{Math.round(comparison.assessment1.overallScore)}</div>
              <Badge variant="outline" className="mx-auto">{comparison.assessment1.grade} {t('results.grade')}</Badge>
            </Card>
            
            <Card className="text-center p-6 flex flex-col justify-center items-center bg-primary/5 border-primary/20">
              <div className="text-sm font-medium text-muted-foreground mb-2">{t('compare.overallProgression')}</div>
              <div className="text-5xl font-bold">
                {formatDiff(comparison.overallDiff)}
              </div>
            </Card>

            <Card className="text-center p-6 flex flex-col justify-center border-l-4 border-l-primary">
              <div className="text-sm font-medium text-muted-foreground mb-2">{t('compare.target')}</div>
              <div className="text-4xl font-bold mb-2">{Math.round(comparison.assessment2.overallScore)}</div>
              <Badge className="mx-auto bg-primary">{comparison.assessment2.grade} {t('results.grade')}</Badge>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('compare.comparison')}</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                    <Bar dataKey={comparison.assessment1.assessmentId.toString()} name={t('compare.baseline')} fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={comparison.assessment2.assessmentId.toString()} name={t('compare.target')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('compare.detailedDeltas')}</CardTitle>
                <CardDescription>{t('compare.detailedDeltasDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparison.frameworkDiffs.map(fd => (
                    <div key={fd.frameworkId} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="font-medium">{fd.frameworkName}</div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-muted-foreground w-12 text-right">{Math.round(fd.score1)}</div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50" />
                        <div className="font-medium w-12 text-right">{Math.round(fd.score2)}</div>
                        <div className="w-20 flex justify-end font-bold">
                          {formatDiff(fd.diff)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
