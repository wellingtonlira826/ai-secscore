import { useState } from "react";
import {
  useListCollaborators, getListCollaboratorsQueryKey,
  useAddCollaborator, useRemoveCollaborator,
  type Collaborator, type CollaboratorInputRole,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function ShareDialog({ assessmentId }: { assessmentId: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = getListCollaboratorsQueryKey(assessmentId);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorInputRole>("viewer");

  const { data: collaborators } = useListCollaborators(assessmentId, {
    query: { enabled: open && !!assessmentId, queryKey },
  });
  const addCollaborator = useAddCollaborator();
  const removeCollaborator = useRemoveCollaborator();

  const refetch = () => queryClient.invalidateQueries({ queryKey });

  const handleError = (err: unknown) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    toast({
      title: t("common.error"),
      description: status === 400 ? t("share.invalidEmail") : t("share.error"),
      variant: "destructive",
    });
  };

  const handleAdd = () => {
    if (!email.trim()) return;
    addCollaborator.mutate(
      { assessmentId, data: { collaboratorEmail: email.trim(), role } },
      {
        onSuccess: () => {
          setEmail("");
          setRole("viewer");
          refetch();
          toast({ title: t("share.added") });
        },
        onError: handleError,
      },
    );
  };

  const handleRemove = (c: Collaborator) => {
    removeCollaborator.mutate(
      { assessmentId, collaboratorId: c.id },
      { onSuccess: refetch, onError: handleError },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("share.button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("share.title")}</DialogTitle>
          <DialogDescription>{t("share.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder={t("share.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={role} onValueChange={(v) => setRole(v as CollaboratorInputRole)}>
              <SelectTrigger className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{t("share.role.viewer")}</SelectItem>
                <SelectItem value="editor">{t("share.role.editor")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!email.trim() || addCollaborator.isPending} className="gap-1.5">
              <UserPlus className="w-4 h-4" />
              {t("share.add")}
            </Button>
          </div>

          <div className="space-y-2">
            {collaborators && collaborators.length > 0 ? (
              collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-card">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="truncate text-sm">{c.collaboratorEmail}</span>
                    <Badge variant="outline" className="text-[10px] uppercase shrink-0">{t(`share.role.${c.role}`)}</Badge>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleRemove(c)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t("share.empty")}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
