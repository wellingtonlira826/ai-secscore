import { useState } from "react";
import { useListAssessments, useCreateAssessment, useDeleteAssessment, getListAssessmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, FileText, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Assessments() {
  const [_, setLocation] = useLocation();
  const { data: assessments, isLoading } = useListAssessments();
  const createAssessment = useCreateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({ name: "", systemName: "", description: "" });

  const handleCreate = () => {
    if (!newAssessment.name || !newAssessment.systemName) {
      toast({ title: "Error", description: "Name and System Name are required", variant: "destructive" });
      return;
    }
    
    createAssessment.mutate({ data: newAssessment }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
        setCreateDialogOpen(false);
        setNewAssessment({ name: "", systemName: "", description: "" });
        setLocation(`/assessments/${data.id}`);
      },
      onError: (err: any) => {
        toast({ title: "Failed to create", description: err.message || "Unknown error", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteAssessment.mutate({ assessmentId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() });
        toast({ title: "Deleted", description: "Assessment removed." });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1">Manage and evaluate AI systems.</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="w-4 h-4" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Assessment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Assessment Name</Label>
                <Input 
                  id="name" 
                  value={newAssessment.name} 
                  onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
                  placeholder="e.g. Q3 Compliance Audit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemName">System Name</Label>
                <Input 
                  id="systemName" 
                  value={newAssessment.systemName} 
                  onChange={e => setNewAssessment({...newAssessment, systemName: e.target.value})}
                  placeholder="e.g. Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
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
                {createAssessment.isPending ? "Creating..." : "Create Assessment"}
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
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Assessment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. All answers and scores will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(assessment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
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
                    <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                      {assessment.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm font-medium">{Math.round(assessment.completionPct)}% Complete</span>
                  </div>
                  <Progress value={assessment.completionPct} className="h-2" />
                  <div className="pt-2 flex items-center justify-between text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Open Assessment</span>
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
          <h3 className="text-lg font-medium">No Assessments Found</h3>
          <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            Create your first assessment to begin evaluating your AI systems against security frameworks.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>Create Assessment</Button>
        </div>
      )}
    </div>
  );
}

// Temporary icon for empty state
import { ClipboardList } from "lucide-react";
