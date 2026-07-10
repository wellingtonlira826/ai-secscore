import { useState } from "react";
import {
  useListRemediationItems,
  getListRemediationItemsQueryKey,
  useCreateRemediationItem,
  useUpdateRemediationItem,
  useDeleteRemediationItem,
  type RemediationItem,
  type RemediationItemInputPriority,
  type RemediationItemStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ListChecks, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-emerald-500 text-white",
};

const STATUS_COLORS: Record<string, string> = {
  open: "border-red-500/40 text-red-500",
  in_progress: "border-amber-500/40 text-amber-500",
  resolved: "border-emerald-500/40 text-emerald-500",
};

export function RemediationPlan({ assessmentId }: { assessmentId: number }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = getListRemediationItemsQueryKey(assessmentId);

  const { data: items, isLoading } = useListRemediationItems(assessmentId, {
    query: { enabled: !!assessmentId, queryKey },
  });

  const createItem = useCreateRemediationItem();
  const updateItem = useUpdateRemediationItem();
  const deleteItem = useDeleteRemediationItem();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<RemediationItemInputPriority>("medium");

  const refetch = () => queryClient.invalidateQueries({ queryKey });

  const handleError = (err: unknown) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    toast({
      title: t("common.error"),
      description: status === 403 ? t("remediation.readOnly") : t("remediation.saveError"),
      variant: "destructive",
    });
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    createItem.mutate(
      {
        assessmentId,
        data: {
          title: title.trim(),
          owner: owner.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setOwner("");
          setDueDate("");
          setPriority("medium");
          setShowForm(false);
          refetch();
        },
        onError: handleError,
      },
    );
  };

  const handleStatusChange = (item: RemediationItem, status: RemediationItemStatus) => {
    updateItem.mutate(
      { assessmentId, itemId: item.id, data: { status } },
      { onSuccess: refetch, onError: handleError },
    );
  };

  const handleDelete = (item: RemediationItem) => {
    deleteItem.mutate(
      { assessmentId, itemId: item.id },
      { onSuccess: refetch, onError: handleError },
    );
  };

  return (
    <Card className="print:break-inside-avoid">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            {t("remediation.title")}
          </CardTitle>
          <CardDescription>{t("remediation.subtitle")}</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0 print:hidden" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span className="hidden sm:inline">{showForm ? t("common.cancel") : t("remediation.add")}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3 print:hidden">
            <Input
              placeholder={t("remediation.itemTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder={t("remediation.owner")} value={owner} onChange={(e) => setOwner(e.target.value)} />
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <Select value={priority} onValueChange={(v) => setPriority(v as RemediationItemInputPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">{t("remediation.priority.critical")}</SelectItem>
                  <SelectItem value="high">{t("remediation.priority.high")}</SelectItem>
                  <SelectItem value="medium">{t("remediation.priority.medium")}</SelectItem>
                  <SelectItem value="low">{t("remediation.priority.low")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleCreate} disabled={!title.trim() || createItem.isPending}>
                {t("remediation.add")}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : items && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="p-4 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("text-[10px] uppercase", PRIORITY_COLORS[item.priority])}>
                      {t(`remediation.priority.${item.priority}`)}
                    </Badge>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    {item.owner && <span>{t("remediation.owner")}: {item.owner}</span>}
                    {item.dueDate && <span>{t("remediation.due")}: {new Date(item.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 print:hidden">
                  <Select value={item.status} onValueChange={(v) => handleStatusChange(item, v as RemediationItemStatus)}>
                    <SelectTrigger className={cn("h-8 w-[140px] text-xs", STATUS_COLORS[item.status])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t("remediation.status.open")}</SelectItem>
                      <SelectItem value="in_progress">{t("remediation.status.in_progress")}</SelectItem>
                      <SelectItem value="resolved">{t("remediation.status.resolved")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Badge variant="outline" className={cn("hidden print:inline-flex text-[10px] uppercase", STATUS_COLORS[item.status])}>
                  {t(`remediation.status.${item.status}`)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
            {t("remediation.empty")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
