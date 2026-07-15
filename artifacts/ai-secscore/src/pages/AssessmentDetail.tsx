import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetAssessment, 
  getGetAssessmentQueryKey,
  useListFrameworks, 
  useListQuestions, 
  useListAnswers, 
  getListAnswersQueryKey,
  useUpsertAnswer, 
  useUpdateAssessment,
  useListSharedAssessments,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Check, Loader2, ArrowRight, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShareDialog } from "@/components/features/ShareDialog";
import { QuestionEvidence } from "@/components/features/QuestionEvidence";
import CorporateAssessmentDetail from "./CorporateAssessmentDetail";

function MaturitySelector({ value, onChange, disabled }: { value: number | null, onChange: (v: number | null) => void, disabled?: boolean }) {
  const { t } = useTranslation();
  const options = [
    { val: 0, label: t('assessment.maturity.0'), desc: "Not Implemented" },
    { val: 1, label: t('assessment.maturity.1'), desc: "Partially" },
    { val: 2, label: t('assessment.maturity.2'), desc: "Largely" },
    { val: 3, label: t('assessment.maturity.3'), desc: "Fully" },
    { val: null, label: t('assessment.maturity.na'), desc: "Not Applicable" }
  ];

  return (
    <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/50">
      {options.map((opt, i) => {
        const isSelected = value === opt.val;
        return (
          <button
            key={i}
            onClick={() => onChange(opt.val)}
            disabled={disabled}
            className={cn(
              "flex-1 min-w-[2.5rem] px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              isSelected 
                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/50" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              disabled && "opacity-60 cursor-not-allowed hover:bg-transparent"
            )}
            title={opt.desc}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function QuestionItem({ 
  question, 
  answer, 
  onSave,
  assessmentId,
  canEdit,
}: { 
  question: any, 
  answer: any, 
  onSave: (qId: number, val: number | null, notes: string) => void,
  assessmentId: number,
  canEdit: boolean,
}) {
  const { t } = useTranslation();
  const [localLevel, setLocalLevel] = useState<number | null>(answer?.maturityLevel ?? null);
  const [localNotes, setLocalNotes] = useState(answer?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const triggerSave = (level: number | null, notes: string) => {
    if (!canEdit) return;
    setIsSaving(true);
    onSave(question.id, level, notes);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 400);
  };

  const handleLevelChange = (v: number | null) => {
    setLocalLevel(v);
    triggerSave(v, localNotes);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(localLevel, e.target.value);
    }, 600);
  };

  return (
    <Card className="border-l-4 border-l-transparent hover:border-l-primary/50 transition-colors">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-normal truncate max-w-[200px]">{question.section}</Badge>
              <div className="flex gap-0.5" title={`Criticality: ${question.weight}/3`}>
                {[1,2,3].map(i => (
                  <div key={i} className={cn("w-2 h-2 rounded-full", i <= question.weight ? "bg-orange-500" : "bg-muted")} />
                ))}
              </div>
            </div>
            <h4 className="text-sm md:text-base font-medium leading-snug">{t(`questions.${question.id}.text`, question.text) as string}</h4>
            {question.remediation && (
              <p className="text-xs md:text-sm text-muted-foreground mt-2 border-l-2 pl-3 py-1 border-muted italic">
                {t(`questions.${question.id}.remediation`, question.remediation) as string}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">{t('assessment.maturity.0') === '0' ? 'Maturity' : 'Maturidade'}</span>
              <div className="h-5 flex items-center">
                {isSaving ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> {t('assessment.saving')}
                  </span>
                ) : showSaved ? (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {t('assessment.saved')}
                  </span>
                ) : null}
              </div>
            </div>
            
            <MaturitySelector value={localLevel} onChange={handleLevelChange} disabled={!canEdit} />
            
            <Textarea 
              placeholder={t('assessment.notes')}
              className="h-16 md:h-20 text-sm resize-none"
              value={localNotes}
              onChange={handleNotesChange}
              disabled={!canEdit}
            />

            <QuestionEvidence assessmentId={assessmentId} questionId={question.id} canEdit={canEdit} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssessmentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const { data: assessment, isLoading: loadingAsses } = useGetAssessment(id, { 
    query: { enabled: !!id, queryKey: getGetAssessmentQueryKey(id) } 
  });
  const { data: frameworks, isLoading: loadingFw } = useListFrameworks();
  const { data: questions, isLoading: loadingQ } = useListQuestions();
  const { data: answers, isLoading: loadingAns } = useListAnswers(id, {
    query: { enabled: !!id, queryKey: getListAnswersQueryKey(id) }
  });
  
  const upsertAnswer = useUpsertAnswer();
  const updateAssessment = useUpdateAssessment();

  const { user } = useAuth();
  const { data: sharedAssessments } = useListSharedAssessments();

  const [activeFwId, setActiveFwId] = useState<number | null>(null);

  useEffect(() => {
    if (frameworks && frameworks.length > 0 && !activeFwId) {
      setActiveFwId(frameworks[0].id);
    }
  }, [frameworks, activeFwId]);

  if (loadingAsses || loadingFw || loadingQ || loadingAns) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-full md:w-64 h-48 md:h-[600px]" />
          <Skeleton className="flex-1 h-[400px] md:h-[600px]" />
        </div>
      </div>
    );
  }

  if (!assessment || !frameworks || !questions || !answers) {
    return <div className="p-8 text-center text-destructive">{t('common.error')}</div>;
  }

  if (assessment.type === "corporate") {
    return <CorporateAssessmentDetail assessment={assessment} />;
  }

  const isOwner = !!user && assessment.userId === user.id;
  const sharedRole = sharedAssessments?.find((s) => s.id === id)?.role;
  const canEdit = isOwner || sharedRole === "editor";

  const activeQuestions = questions.filter(q => q.frameworkId === activeFwId);
  const activeAnswers = answers.filter(a => activeQuestions.some(q => q.id === a.questionId));
  const answeredCount = activeAnswers.filter(a => a.maturityLevel !== null || (a.notes && a.notes.length > 0)).length;
  const progressPct = activeQuestions.length > 0 ? (answeredCount / activeQuestions.length) * 100 : 0;

  const handleSaveAnswer = (questionId: number, maturityLevel: number | null, notes: string) => {
    upsertAnswer.mutate(
      { assessmentId: id, questionId, data: { maturityLevel, notes } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getListAnswersQueryKey(id), (old: any) => {
            if (!old) return [data];
            const exists = old.find((a: any) => a.id === data.id);
            if (exists) return old.map((a: any) => a.id === data.id ? data : a);
            return [...old, data];
          });
        }
      }
    );
  };

  const handleComplete = () => {
    updateAssessment.mutate(
      { assessmentId: id, data: { status: 'completed' } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAssessmentQueryKey(id) });
          toast({ title: t('assessment.markComplete'), description: t('assessment.viewResults') });
        },
        onError: () => {
          toast({ variant: "destructive", title: t('common.error') });
        }
      }
    );
  };

  const handleSchedule = (days: string) => {
    const val = days === "0" ? null : parseInt(days);
    updateAssessment.mutate(
      { assessmentId: id, data: { reviewFrequencyDays: val } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAssessmentQueryKey(id) });
          toast({ title: t('schedule.saved') });
        },
        onError: () => {
          toast({ variant: "destructive", title: t('common.error') });
        }
      }
    );
  };

  const nextReviewAt = assessment.nextReviewAt ? new Date(assessment.nextReviewAt) : null;
  const isOverdue = nextReviewAt ? nextReviewAt.getTime() < Date.now() : false;

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">{assessment.name}</h1>
            <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'} className="uppercase shrink-0">
              {assessment.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">System: {assessment.systemName}</p>
          {nextReviewAt && (
            <p className={cn("mt-1 text-xs flex items-center gap-1.5", isOverdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
              <CalendarClock className="w-3.5 h-3.5" />
              {isOverdue ? t('schedule.overdue') : t('schedule.nextReview')}: {nextReviewAt.toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canEdit && (
            <Select value={(assessment.reviewFrequencyDays ?? 0).toString()} onValueChange={handleSchedule}>
              <SelectTrigger className="h-9 w-[150px] text-xs gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('schedule.none')}</SelectItem>
                <SelectItem value="30">{t('schedule.days', { count: 30 })}</SelectItem>
                <SelectItem value="90">{t('schedule.days', { count: 90 })}</SelectItem>
                <SelectItem value="180">{t('schedule.days', { count: 180 })}</SelectItem>
                <SelectItem value="365">{t('schedule.days', { count: 365 })}</SelectItem>
              </SelectContent>
            </Select>
          )}
          {isOwner && <ShareDialog assessmentId={id} />}
          <Link href={`/assessments/${id}/results`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              {t('assessment.viewResults')} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
          {canEdit && assessment.status !== 'completed' && (
            <Button onClick={handleComplete} size="sm" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('assessment.markComplete')}</span>
              <span className="sm:hidden">Complete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: framework select dropdown */}
      {isMobile && (
        <div className="space-y-3">
          <Select value={activeFwId?.toString() ?? ""} onValueChange={(v) => setActiveFwId(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Framework" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map(fw => {
                const fwQuestions = questions.filter(q => q.frameworkId === fw.id);
                const fwAnswers = answers.filter(a => fwQuestions.some(q => q.id === a.questionId));
                const fwAnswered = fwAnswers.filter(a => a.maturityLevel !== null || (a.notes && a.notes.length > 0)).length;
                return (
                  <SelectItem key={fw.id} value={fw.id.toString()}>
                    {fw.slug} ({fwAnswered}/{fwQuestions.length})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Progress bar */}
          <div className="bg-card p-3 rounded-xl border border-border">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="truncate pr-2">{frameworks.find(f => f.id === activeFwId)?.name}</span>
              <span className="shrink-0">{Math.round(progressPct)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </div>
      )}

      {/* Desktop: two-column layout */}
      {!isMobile && (
        <div className="flex gap-8 min-h-[600px]">
          {/* Framework nav sidebar */}
          <div className="w-64 shrink-0 space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Frameworks</h3>
            {frameworks.map(fw => {
              const fwQuestions = questions.filter(q => q.frameworkId === fw.id);
              const fwAnswers = answers.filter(a => fwQuestions.some(q => q.id === a.questionId));
              const fwAnswered = fwAnswers.filter(a => a.maturityLevel !== null || (a.notes && a.notes.length > 0)).length;
              const isDone = fwQuestions.length > 0 && fwAnswered === fwQuestions.length;
              
              return (
                <button
                  key={fw.id}
                  onClick={() => setActiveFwId(fw.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors border",
                    activeFwId === fw.id 
                      ? "bg-primary/10 border-primary/30 text-primary font-medium" 
                      : "bg-card border-transparent hover:bg-accent hover:border-border text-muted-foreground"
                  )}
                >
                  <div className="truncate pr-2">
                    <div className="truncate">{fw.slug}</div>
                    <div className="text-xs opacity-70 mt-0.5">{fwAnswered} / {fwQuestions.length}</div>
                  </div>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="flex-1 max-w-4xl space-y-6">
            <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-6 sticky top-0 z-10 shadow-sm">
              <div className="flex-1">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>{frameworks.find(f => f.id === activeFwId)?.name}</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            </div>

            <div className="space-y-4 pb-20">
              {activeQuestions.map(q => {
                const ans = answers.find(a => a.questionId === q.id);
                return (
                  <QuestionItem key={q.id} question={q} answer={ans} onSave={handleSaveAnswer} assessmentId={id} canEdit={canEdit} />
                );
              })}
              {activeQuestions.length === 0 && (
                <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  No questions found for this framework.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile: questions list */}
      {isMobile && (
        <div className="space-y-3 pb-8">
          {activeQuestions.map(q => {
            const ans = answers.find(a => a.questionId === q.id);
            return (
              <QuestionItem key={q.id} question={q} answer={ans} onSave={handleSaveAnswer} assessmentId={id} canEdit={canEdit} />
            );
          })}
          {activeQuestions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              No questions found for this framework.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
