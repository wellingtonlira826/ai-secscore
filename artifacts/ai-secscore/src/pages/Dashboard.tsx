import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from "recharts";
import { ShieldAlert, Activity, CheckCircle2, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: dashboard, isLoading, error } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-destructive">
        {t('common.error')}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('dashboard.totalAssessments')}
          value={dashboard.totalAssessments} 
          icon={ListTodo} 
          description={t('dashboard.totalAssessmentsDesc')}
        />
        <StatCard 
          title={t('dashboard.inProgress')}
          value={dashboard.inProgressCount} 
          icon={Activity}
          description={t('dashboard.inProgressDesc')}
        />
        <StatCard 
          title={t('dashboard.completed')}
          value={dashboard.completedCount} 
          icon={CheckCircle2}
          description={t('dashboard.completedDesc')}
        />
        <StatCard 
          title={t('dashboard.avgScore')}
          value={dashboard.avgScore !== null ? Math.round(dashboard.avgScore) : "N/A"} 
          icon={ShieldAlert}
          description={t('dashboard.avgScoreDesc')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-[450px]">
          <CardHeader>
            <CardTitle>{t('dashboard.frameworkScores')}</CardTitle>
            <CardDescription>{t('dashboard.frameworkScoresDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {dashboard.topFrameworkScores && dashboard.topFrameworkScores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.topFrameworkScores} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="frameworkName" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={120} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t('dashboard.noFrameworkData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[450px]">
          <CardHeader>
            <CardTitle>{t('dashboard.recentAssessments')}</CardTitle>
            <CardDescription>{t('dashboard.recentAssessmentsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {dashboard.recentAssessments && dashboard.recentAssessments.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentAssessments.map((assessment) => (
                  <Link key={assessment.id} href={`/assessments/${assessment.id}`}>
                    <div className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                      <div>
                        <div className="font-semibold">{assessment.name}</div>
                        <div className="text-sm text-muted-foreground">{assessment.systemName}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                          {assessment.status === 'completed' ? t('assessments.status.completed') : t('assessments.status.in_progress')}
                        </Badge>
                        <div className="text-sm font-medium w-12 text-right">
                          {Math.round(assessment.completionPct)}%
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                {t('dashboard.noRecent')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
