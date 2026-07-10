import { useRef, useState } from "react";
import {
  useListEvidence, getListEvidenceQueryKey,
  useRequestUploadUrl, useAddEvidence, useDeleteEvidence,
  type Evidence,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, Trash2, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toDownloadUrl(objectPath: string): string {
  return `/api/storage/objects/${objectPath.replace(/^\/objects\//, "")}`;
}

export function QuestionEvidence({
  assessmentId,
  questionId,
  canEdit = true,
}: {
  assessmentId: number;
  questionId: number;
  canEdit?: boolean;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const queryKey = getListEvidenceQueryKey(assessmentId, questionId);
  const { data: evidence } = useListEvidence(assessmentId, questionId, {
    query: { enabled: expanded && !!assessmentId, queryKey },
  });

  const requestUploadUrl = useRequestUploadUrl();
  const addEvidence = useAddEvidence();
  const deleteEvidence = useDeleteEvidence();

  const refetch = () => queryClient.invalidateQueries({ queryKey });

  const handleError = (err: unknown) => {
    const status = (err as { response?: { status?: number } })?.response?.status;
    toast({
      title: t("common.error"),
      description: status === 403 ? t("remediation.readOnly") : t("evidence.uploadError"),
      variant: "destructive",
    });
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type || "application/octet-stream" },
      });

      const put = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) throw new Error("upload failed");

      await addEvidence.mutateAsync({
        assessmentId,
        questionId,
        data: {
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
          objectPath,
        },
      });

      refetch();
      toast({ title: t("evidence.uploadSuccess") });
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (e: Evidence) => {
    deleteEvidence.mutate(
      { assessmentId, evidenceId: e.id },
      { onSuccess: refetch, onError: handleError },
    );
  };

  const count = evidence?.length ?? 0;

  return (
    <div className="pt-3 border-t border-border/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Paperclip className="w-3.5 h-3.5" />
        {t("evidence.title")}
        {count > 0 && <span className="text-primary">({count})</span>}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {evidence && evidence.length > 0 ? (
            evidence.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30 text-sm">
                <a
                  href={toDownloadUrl(e.objectPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 hover:text-primary"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{e.fileName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(e.fileSize)}</span>
                </a>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">{t("evidence.noEvidence")}</p>
          )}

          {canEdit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 w-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? t("evidence.uploading") : t("evidence.upload")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
