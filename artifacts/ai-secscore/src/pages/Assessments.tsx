import { useState } from "react";
import { useListAssessments, useCreateAssessment, useDeleteAssessment, useDuplicateAssessment, useListSharedAssessments, getListAssessmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Copy, FileText, ChevronRight, ClipboardList, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Assessments() {
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  const { data: assessments, isLoading } = useListAssessments();
  const createAssessment = useCreateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const duplicateAssessment = useDuplicateAssessment();
  const { data: shared } = useListSharedAssessments();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ name: "", systemName: "", description: "" });
  const [newType, setNewType] = useState<"security" | "corporate">("security");

  const handleCreate = () => {
    if (!newAssessment.name || !newAssessment.systemName) {
      toast({ title: t('common.error'), description: "Name and System Name are required", variant: "destructive" });
      return;
    }
    
    createAssessment.mutate({ data: { ...newAssessment, type: newType } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
        setCreateDialogOpen(false);
        setNewAssessment({ name: "", systemName: "", description: "" });
        setNewType("security");
        setLocation(`/assessments/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: t('common.error'), description: err.message || "Unknown error", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteAssessment.mutate({ assessmentId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
        toast({ title: t('common.delete'), description: "Assessment removed." });
      }
    });
  };

  const handleDuplicate = (id: number) => {
    duplicateAssessment.mutate({ assessmentId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
        toast({ title: t('assessments.duplicated') });
      },
      onError: (err: any) => {
        toast({ title: t('common.error'), description: err?.message || t('assessments.duplicateError'), variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('assessments.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('assessments.subtitle')}</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="w-4 h-4" />
              {t('assessments.new')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('assessments.createTitle')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t('assessments.type')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType("security")}
                    className={`p-3 rounded-lg border text-left transition-colors ${newType === "security" ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                  >
                    <div className="text-sm font-medium">{t('assessments.typeSecurity')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t('assessments.typeSecurityDesc')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("corporate")}
                    className={`p-3 rounded-lg border text-left transition-colors ${newType === "corporate" ? "border-primary bg-primary/10" : "border-border hover:bg-accent"}`}
                  >
                    <div className="text-sm font-medium">{t('assessments.typeCorporate')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t('assessments.typeCorporateDesc')}</div>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">{t('assessments.name')}</Label>
                <Input 
                  id="name" 
                  value={newAssessment.name} 
                  onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
                  placeholder="e.g. Q3 Compliance Audit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemName">{t('assessments.systemName')}</Label>
                <Input 
                  id="systemName" 
                  value={newAssessment.systemName} 
                  onChange={e => setNewAssessment({...newAssessment, systemName: e.target.value})}
                  placeholder="e.g. Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('assessments.description')}</Label>
                <Textarea 
                  id="description" 
                  value={newAssessment.description} 
                  onChange={e => setNewAssessment({...newAssessment, description: e.target.value})}
                  placeholder="Brief description of the system being evaluated"
                />
              </div>
            </div>
            <DialogFooter>
              <Button disabled={createAssessment.isPending} onClick={handleCreate}>
                {createAssessment.isPending ? t('common.loading') : t('assessments.createTitle')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : assessments && assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(assessment => (
            <Card key={assessment.id} className="flex flex-col relative group">
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  disabled={duplicateAssessment.isPending}
                  onClick={() => handleDuplicate(assessment.id)}
                  title={t('assessments.duplicate') as string}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('assessments.delete')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('assessments.deleteDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(assessment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <Link href={`/assessments/${assessment.id}`} className="flex-1 p-6 flex flex-col cursor-pointer hover:bg-accent/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-[85%]">
                    <h3 className="font-semibold text-lg truncate" title={assessment.name}>{assessment.name}</h3>
                    <p className="text-sm text-muted-foreground truncate" title={assessment.systemName}>{assessment.systemName}</p>
                  </div>
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'}>
                        {assessment.status === 'completed' ? t('assessments.status.completed') : t('assessments.status.in_progress')}
                      </Badge>
                      {assessment.type === 'corporate' && (
                        <Badge variant="secondary">{t('corporate.badge')}</Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">{Math.round(assessment.completionPct)}% {t('assessment.progress')}</span>
                  </div>
                  <Progress value={assessment.completionPct} className="h-2" />
                  <div className="pt-2 flex items-center justify-between text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {t('assessments.open')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed rounded-xl bg-card/50">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium">{t('assessments.noAssessments')}</h3>
          <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            {t('assessments.startFirst')}
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>{t('assessments.createTitle')}</Button>
        </div>
      )}

      {shared && shared.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">{t('share.sharedWithMe')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shared.map((s) => (
              <Link key={s.id} href={`/assessments/${s.id}`}>
                <Card className="flex flex-col cursor-pointer hover:bg-accent/30 transition-colors h-full">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg truncate" title={s.name}>{s.name}</h3>
                        <p className="text-sm text-muted-foreground truncate" title={s.systemName}>{s.systemName}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {s.role === 'editor' ? t('share.role.editor') : t('share.role.viewer')}
                      </Badge>
                    </div>
                    <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
                      <span className="truncate" title={s.ownerEmail ?? undefined}>{s.ownerEmail}</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
