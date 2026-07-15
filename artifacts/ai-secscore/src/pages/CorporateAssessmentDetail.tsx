import { useState, useRef, useEffect, useMemo } from "react";
import {
  useListCorpDomains,
  useListCorpQuestions,
  useListCorpAnswers,
  getListCorpAnswersQueryKey,
  useUpsertCorpAnswer,
  useListMaturityLevels,
  useUpdateAssessment,
  getGetAssessmentQueryKey,
  useListSharedAssessments,
  type Assessment,
  type CorpQuestion,
  type CorpAnswer,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, Check, Loader2, Layers, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShareDialog } from "@/components/features/ShareDialog";

const CRITICALITY_STYLES: Record<string, string> = {
  baixa: "bg-slate-500/10 text-slate-500 border-slate-500/30",
  media: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  alta: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  critica: "bg-red-500/10 text-red-600 border-red-500/30",
};

function isAnswered(a: CorpAnswer | undefined): boolean {
  if (!a) return false;
  return (
    a.boolValue !== null ||
    a.scaleValue !== null ||
    a.choiceValue !== null ||
    (a.textValue !== null && a.textValue.length > 0) ||
    a.percentValue !== null
  );
}

type SaveValues = {
  boolValue?: boolean | null;
  scaleValue?: number | null;
  choiceValue?: string | null;
  textValue?: string | null;
  percentValue?: number | null;
  notes?: string | null;
};

function CorpQuestionItem({
  question,
  answer,
  onSave,
  canEdit,
}: {
  question: CorpQuestion;
  answer: CorpAnswer | undefined;
  onSave: (questionId: number, values: SaveValues) => void;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const [bool, setBool] = useState<boolean | null>(answer?.boolValue ?? null);
  const [scale, setScale] = useState<number | null>(answer?.scaleValue ?? null);
  const [choice, setChoice] = useState<string | null>(answer?.choiceValue ?? null);
  const [text, setText] = useState<string>(answer?.textValue ?? "");
  const [percent, setPercent] = useState<string>(answer?.percentValue != null ? String(answer.percentValue) : "");
  const [notes, setNotes] = useState<string>(answer?.notes ?? "");
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentValues = (): SaveValues => ({
    boolValue: bool,
    scaleValue: scale,
    choiceValue: choice,
    textValue: text.length > 0 ? text : null,
    percentValue: percent !== "" ? Number(percent) : null,
    notes: notes.length > 0 ? notes : null,
  });

  const triggerSave = (override: SaveValues) => {
    if (!canEdit) return;
    setIsSaving(true);
    onSave(question.id, { ...currentValues(), ...override });
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 400);
  };

  const debouncedSave = (override: SaveValues) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerSave(override), 600);
  };

  return (
    <Card className="border-l-4 border-l-transparent hover:border-l-primary/50 transition-colors">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-xs font-normal capitalize", CRITICALITY_STYLES[question.criticality])}>
              {t(`corporate.criticality.${question.criticality}`)}
            </Badge>
            {question.required && (
              <Badge variant="outline" className="text-xs font-normal">{t('corporate.required')}</Badge>
            )}
            {question.eliminatory && (
              <Badge variant="outline" className="text-xs font-normal bg-red-500/10 text-red-600 border-red-500/30">
                {t('corporate.eliminatory')}
              </Badge>
            )}
            <div className="flex gap-0.5" title={`${t('corporate.weight')}: ${question.weight}/5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full", i <= question.weight ? "bg-orange-500" : "bg-muted")} />
              ))}
            </div>
          </div>
          <h4 className="text-sm md:text-base font-medium leading-snug">{question.text}</h4>
          <p className="text-xs md:text-sm text-muted-foreground">{question.description}</p>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            <Info className="w-3 h-3" />
            {showDetails ? t('corporate.hideDetails') : t('corporate.showDetails')}
          </button>
          {showDetails && (
            <div className="text-xs md:text-sm text-muted-foreground border-l-2 pl-3 py-1 border-muted space-y-1.5">
              <p><span className="font-medium text-foreground">{t('corporate.objective')}:</span> {question.objective}</p>
              <p><span className="font-medium text-foreground">{t('corporate.justification')}:</span> {question.justification}</p>
              <p><span className="font-medium text-foreground">{t('corporate.marketReference')}:</span> {question.marketReference}</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">{t('corporate.answer')}</span>
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

          {question.answerType === "yes_no" && (
            <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/50">
              {[{ v: true, label: "Sim" }, { v: false, label: "Não" }].map((opt) => (
                <button
                  key={String(opt.v)}
                  disabled={!canEdit}
                  onClick={() => { setBool(opt.v); triggerSave({ boolValue: opt.v }); }}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    bool === opt.v
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/50"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !canEdit && "opacity-60 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {question.answerType === "scale_1_5" && (
            <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/50">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  disabled={!canEdit}
                  onClick={() => { setScale(v); triggerSave({ scaleValue: v }); }}
                  title={t(`corporate.scale.${v}`) as string}
                  className={cn(
                    "flex-1 min-w-[2.5rem] px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    scale === v
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/50"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !canEdit && "opacity-60 cursor-not-allowed hover:bg-transparent",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {question.answerType === "multiple_choice" && (
            <Select
              value={choice ?? ""}
              onValueChange={(v) => { setChoice(v); triggerSave({ choiceValue: v }); }}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('corporate.selectOption') as string} />
              </SelectTrigger>
              <SelectContent>
                {(question.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {question.answerType === "percent" && (
            <div className="flex items-center gap-2 max-w-[200px]">
              <Input
                type="number"
                min={0}
                max={100}
                value={percent}
                disabled={!canEdit}
                onChange={(e) => {
                  const raw = e.target.value;
                  setPercent(raw);
                  const num = raw === "" ? null : Math.max(0, Math.min(100, Number(raw)));
                  debouncedSave({ percentValue: num });
                }}
                placeholder="0-100"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}

          {question.answerType === "text" && (
            <Textarea
              placeholder={t('corporate.textAnswer') as string}
              className="h-20 text-sm resize-none"
              value={text}
              disabled={!canEdit}
              onChange={(e) => {
                setText(e.target.value);
                debouncedSave({ textValue: e.target.value.length > 0 ? e.target.value : null });
              }}
            />
          )}

          <Textarea
            placeholder={t('assessment.notes') as string}
            className="h-16 text-sm resize-none"
            value={notes}
            disabled={!canEdit}
            onChange={(e) => {
              setNotes(e.target.value);
              debouncedSave({ notes: e.target.value.length > 0 ? e.target.value : null });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MaturityModelDialog() {
  const { t } = useTranslation();
  const { data: levels } = useListMaturityLevels();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('corporate.maturityModel')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('corporate.maturityModel')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(levels ?? []).map((lvl) => (
            <div key={lvl.level} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {lvl.level}
                </span>
                <h4 className="font-semibold">{lvl.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{lvl.description}</p>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                {lvl.characteristics.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CorporateAssessmentDetail({ assessment }: { assessment: Assessment }) {
  const id = assessment.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const { data: domains, isLoading: loadingDomains } = useListCorpDomains();
  const { data: questions, isLoading: loadingQ } = useListCorpQuestions();
  const { data: answers, isLoading: loadingAns } = useListCorpAnswers(id, {
    query: { enabled: !!id, queryKey: getListCorpAnswersQueryKey(id) },
  });

  const upsertAnswer = useUpsertCorpAnswer();
  const updateAssessment = useUpdateAssessment();

  const { user } = useAuth();
  const { data: sharedAssessments } = useListSharedAssessments();

  const [activeDomainId, setActiveDomainId] = useState<number | null>(null);

  useEffect(() => {
    if (domains && domains.length > 0 && !activeDomainId) {
      setActiveDomainId(domains[0].id);
    }
  }, [domains, activeDomainId]);

  const pillars = useMemo(() => {
    if (!domains) return [];
    const byPillar = new Map<string, typeof domains>();
    for (const d of domains) {
      const list = byPillar.get(d.pillar) ?? [];
      list.push(d);
      byPillar.set(d.pillar, list);
    }
    return Array.from(byPillar.entries());
  }, [domains]);

  if (loadingDomains || loadingQ || loadingAns) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-full md:w-72 h-48 md:h-[600px]" />
          <Skeleton className="flex-1 h-[400px] md:h-[600px]" />
        </div>
      </div>
    );
  }

  if (!domains || !questions || !answers) {
    return <div className="p-8 text-center text-destructive">{t('common.error')}</div>;
  }

  const isOwner = !!user && assessment.userId === user.id;
  const sharedRole = sharedAssessments?.find((s) => s.id === id)?.role;
  const canEdit = isOwner || sharedRole === "editor";

  const answersByQuestion = new Map(answers.map((a) => [a.questionId, a]));
  const answeredTotal = questions.filter((q) => isAnswered(answersByQuestion.get(q.id))).length;
  const totalPct = questions.length > 0 ? (answeredTotal / questions.length) * 100 : 0;

  const activeQuestions = questions.filter((q) => q.domainId === activeDomainId);
  const activeAnswered = activeQuestions.filter((q) => isAnswered(answersByQuestion.get(q.id))).length;
  const activePct = activeQuestions.length > 0 ? (activeAnswered / activeQuestions.length) * 100 : 0;
  const activeDomain = domains.find((d) => d.id === activeDomainId);

  const domainProgress = (domainId: number) => {
    const dq = questions.filter((q) => q.domainId === domainId);
    const done = dq.filter((q) => isAnswered(answersByQuestion.get(q.id))).length;
    return { done, total: dq.length };
  };

  const handleSaveAnswer = (questionId: number, values: SaveValues) => {
    upsertAnswer.mutate(
      { assessmentId: id, questionId, data: values },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getListCorpAnswersQueryKey(id), (old: CorpAnswer[] | undefined) => {
            if (!old) return [data];
            const exists = old.find((a) => a.id === data.id);
            if (exists) return old.map((a) => (a.id === data.id ? data : a));
            return [...old, data];
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: t('common.error') });
        },
      },
    );
  };

  const handleComplete = () => {
    updateAssessment.mutate(
      { assessmentId: id, data: { status: 'completed' } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAssessmentQueryKey(id) });
          toast({ title: t('assessment.markComplete') });
        },
        onError: () => {
          toast({ variant: "destructive", title: t('common.error') });
        },
      },
    );
  };

  const domainNav = (
    <div className="space-y-4">
      {pillars.map(([pillar, pillarDomains]) => (
        <div key={pillar} className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{pillar}</h4>
          {pillarDomains.map((d) => {
            const { done, total } = domainProgress(d.id);
            const isDone = total > 0 && done === total;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDomainId(d.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors border",
                  activeDomainId === d.id
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "bg-card border-transparent hover:bg-accent hover:border-border text-muted-foreground",
                )}
              >
                <div className="truncate pr-2">
                  <div className="truncate text-sm">{d.name}</div>
                  <div className="text-xs opacity-70 mt-0.5">{done} / {total}</div>
                </div>
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">{assessment.name}</h1>
            <Badge variant="secondary" className="shrink-0">{t('corporate.badge')}</Badge>
            <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'} className="uppercase shrink-0">
              {assessment.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{assessment.systemName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <MaturityModelDialog />
          {isOwner && <ShareDialog assessmentId={id} />}
          {canEdit && assessment.status !== 'completed' && (
            <Button onClick={handleComplete} size="sm" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('assessment.markComplete')}</span>
              <span className="sm:hidden">✓</span>
            </Button>
          )}
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span>{t('corporate.overallProgress')}</span>
          <span>{answeredTotal} / {questions.length} · {Math.round(totalPct)}%</span>
        </div>
        <Progress value={totalPct} className="h-2" />
      </div>

      {/* Mobile: domain select */}
      {isMobile && (
        <div className="space-y-3">
          <Select value={activeDomainId?.toString() ?? ""} onValueChange={(v) => setActiveDomainId(parseInt(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('corporate.selectDomain') as string} />
            </SelectTrigger>
            <SelectContent>
              {pillars.map(([pillar, pillarDomains]) => (
                <div key={pillar}>
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">{pillar}</div>
                  {pillarDomains.map((d) => {
                    const { done, total } = domainProgress(d.id);
                    return (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} ({done}/{total})
                      </SelectItem>
                    );
                  })}
                </div>
              ))}
            </SelectContent>
          </Select>

          <div className="bg-card p-3 rounded-xl border border-border">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="truncate pr-2">{activeDomain?.name}</span>
              <span className="shrink-0">{Math.round(activePct)}%</span>
            </div>
            <Progress value={activePct} className="h-2" />
          </div>
        </div>
      )}

      {/* Desktop layout */}
      {!isMobile && (
        <div className="flex gap-8 min-h-[600px]">
          <div className="w-72 shrink-0">{domainNav}</div>

          <div className="flex-1 max-w-4xl space-y-6">
            <div className="bg-card p-4 rounded-xl border border-border sticky top-0 z-10 shadow-sm">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>{activeDomain?.name}</span>
                <span>{Math.round(activePct)}%</span>
              </div>
              <Progress value={activePct} className="h-2" />
              {activeDomain && (
                <p className="text-xs text-muted-foreground mt-2">{activeDomain.description}</p>
              )}
            </div>

            <div className="space-y-4 pb-20">
              {activeQuestions.map((q) => (
                <CorpQuestionItem
                  key={q.id}
                  question={q}
                  answer={answersByQuestion.get(q.id)}
                  onSave={handleSaveAnswer}
                  canEdit={canEdit}
                />
              ))}
              {activeQuestions.length === 0 && (
                <div className="p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  {t('corporate.noQuestions')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile: questions list */}
      {isMobile && (
        <div className="space-y-3 pb-8">
          {activeQuestions.map((q) => (
            <CorpQuestionItem
              key={q.id}
              question={q}
              answer={answersByQuestion.get(q.id)}
              onSave={handleSaveAnswer}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
