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
  useUpdateAssessment 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronRight, Check, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Custom Segmented Control for Maturity Level
function MaturitySelector({ value, onChange }: { value: number | null, onChange: (v: number | null) => void }) {
  const options = [
    { val: 0, label: "0", desc: "Not Implemented" },
    { val: 1, label: "1", desc: "Partially" },
    { val: 2, label: "2", desc: "Largely" },
    { val: 3, label: "3", desc: "Fully" },
    { val: null, label: "N/A", desc: "Not Applicable" }
  ];

  return (
    <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg w-max border border-border/50">
      {options.map((opt, i) => {
        const isSelected = value === opt.val;
        return (
          <button
            key={i}
            onClick={() => onChange(opt.val)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              isSelected 
                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/50" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
  onSave 
}: { 
  question: any, 
  answer: any, 
  onSave: (qId: number, val: number | null, notes: string) => void 
}) {
  const [localLevel, setLocalLevel] = useState<number | null>(answer?.maturityLevel ?? null);
  const [localNotes, setLocalNotes] = useState(answer?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const triggerSave = (level: number | null, notes: string) => {
    setIsSaving(true);
    onSave(question.id, level, notes);
    
    // Simulate save delay for UI
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
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-normal">Section: {question.section}</Badge>
              <div className="flex gap-0.5 ml-2" title={`Criticality: ${question.weight}/3`}>
                {[1,2,3].map(i => (
                  <div key={i} className={cn("w-2 h-2 rounded-full", i <= question.weight ? "bg-orange-500" : "bg-muted")} />
                ))}
              </div>
            </div>
            <h4 className="text-base font-medium leading-tight">{question.text}</h4>
            {question.remediation && (
              <p className="text-sm text-muted-foreground mt-2 border-l-2 pl-3 py-1 border-muted italic">
                {question.remediation}
              </p>
            )}
          </div>
          
          <div className="w-full lg:w-72 shrink-0 space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Maturity</span>
              <div className="h-5 flex items-center">
                {isSaving ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving
                  </span>
                ) : showSaved ? (
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                ) : null}
              </div>
            </div>
            
            <MaturitySelector value={localLevel} onChange={handleLevelChange} />
            
            <Textarea 
              placeholder="Evidence / Notes (optional)" 
              className="h-20 text-sm resize-none"
              value={localNotes}
              onChange={handleNotesChange}
            />
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

  const [activeFwId, setActiveFwId] = useState<number | null>(null);

  // Initialize active framework
  useEffect(() => {
    if (frameworks && frameworks.length > 0 && !activeFwId) {
      setActiveFwId(frameworks[0].id);
    }
  }, [frameworks, activeFwId]);

  if (loadingAsses || loadingFw || loadingQ || loadingAns) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="flex gap-6">
          <Skeleton className="w-64 h-[600px]" />
          <Skeleton className="flex-1 h-[600px]" />
        </div>
      </div>
    );
  }

  if (!assessment || !frameworks || !questions || !answers) {
    return <div className="p-8 text-center text-destructive">Failed to load assessment data.</div>;
  }

  const activeQuestions = questions.filter(q => q.frameworkId === activeFwId);
  const activeAnswers = answers.filter(a => activeQuestions.some(q => q.id === a.questionId));
  const answeredCount = activeAnswers.filter(a => a.maturityLevel !== null || (a.notes && a.notes.length > 0)).length;
  const progressPct = activeQuestions.length > 0 ? (answeredCount / activeQuestions.length) * 100 : 0;

  const handleSaveAnswer = (questionId: number, maturityLevel: number | null, notes: string) => {
    upsertAnswer.mutate(
      { assessmentId: id, questionId, data: { maturityLevel, notes } },
      {
        onSuccess: (data) => {
          // Patch cache directly to avoid refetch loops
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
          toast({ title: "Assessment Completed", description: "You can now view the results." });
        }
      }
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{assessment.name}</h1>
            <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'} className="uppercase">
              {assessment.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">System: {assessment.systemName}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/assessments/${id}/results`}>
            <Button variant="outline" className="gap-2">
              View Results <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {assessment.status !== 'completed' && (
            <Button onClick={handleComplete} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Mark as Completed
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-8 h-full min-h-[600px]">
        {/* Sidebar Nav */}
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

        {/* Main Content */}
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
                <QuestionItem 
                  key={q.id} 
                  question={q} 
                  answer={ans} 
                  onSave={handleSaveAnswer} 
                />
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
    </div>
  );
}
