import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListFrameworkWeights, useUpdateFrameworkWeights, getListFrameworkWeightsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function Settings() {
  const { data: weights, isLoading } = useListFrameworkWeights();
  const updateWeights = useUpdateFrameworkWeights();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [localWeights, setLocalWeights] = useState<Record<number, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when data loads
  if (weights && Object.keys(localWeights).length === 0 && !hasChanges) {
    const initial: Record<number, number> = {};
    weights.forEach(w => {
      initial[w.frameworkId] = w.weight;
    });
    setLocalWeights(initial);
  }

  const handleSliderChange = (frameworkId: number, val: number[]) => {
    setLocalWeights(prev => ({ ...prev, [frameworkId]: val[0] }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const payload = {
      data: {
        weights: Object.entries(localWeights).map(([id, weight]) => ({
          frameworkId: parseInt(id),
          weight
        }))
      }
    };

    updateWeights.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFrameworkWeightsQueryKey() });
        setHasChanges(false);
        toast({ title: "Settings Saved", description: "Framework weights updated successfully." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to save weights", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global platform preferences.</p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Framework Scoring Weights</CardTitle>
              <CardDescription>
                Adjust the importance of each framework when calculating overall assessment scores.
                A weight of 0 means the framework will not affect the overall score.
              </CardDescription>
            </div>
            <Button disabled={!hasChanges || updateWeights.isPending} onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              {updateWeights.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <div className="space-y-6">
              {[1,2,3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : weights && weights.length > 0 ? (
            weights.map((fw) => {
              const currentWeight = localWeights[fw.frameworkId] ?? fw.weight;
              return (
                <div key={fw.frameworkId} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{fw.frameworkName}</Label>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {currentWeight.toFixed(2)}x
                    </span>
                  </div>
                  <Slider 
                    value={[currentWeight]} 
                    min={0} 
                    max={2} 
                    step={0.1}
                    onValueChange={(val) => handleSliderChange(fw.frameworkId, val)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ignored (0)</span>
                    <span>Standard (1)</span>
                    <span>High Impact (2)</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-muted-foreground">No frameworks available.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Label } from "@/components/ui/label";
