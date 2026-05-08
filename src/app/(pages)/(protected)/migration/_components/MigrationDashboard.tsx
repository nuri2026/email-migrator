"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Upload, CheckCircle2 } from "lucide-react";

export function MigrationDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["migration-stats"],
    queryFn: async () => {
      const res = await fetch("/api/migration/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/migration/extract", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Extraction failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Extraction Started", description: "Fetching data from Brevo..." });
      queryClient.invalidateQueries({ queryKey: ["migration-stats"] });
    },
    onError: (error: Error) => {
      toast({ title: "Extraction Failed", description: error.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/migration/load", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Sync failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sync Started", description: "Pushing data to HubSpot..." });
      queryClient.invalidateQueries({ queryKey: ["migration-stats"] });
    },
    onError: (error: Error) => {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.deals || 0}</div>
            <p className="text-xs text-muted-foreground">Found in Brevo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes & Tasks</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.notes || 0) + (stats?.tasks || 0)}</div>
            <p className="text-xs text-muted-foreground">Associated records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.syncedDeals || 0}</div>
            <p className="text-xs text-muted-foreground">Deals in HubSpot</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={() => extractMutation.mutate()} 
          disabled={extractMutation.isPending}
          className="flex-1"
        >
          {extractMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Extract from Brevo
        </Button>
        <Button 
          onClick={() => syncMutation.mutate()} 
          disabled={syncMutation.isPending || (stats?.deals || 0) === 0}
          className="flex-1"
          variant="secondary"
        >
          {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Sync to HubSpot
        </Button>
      </div>
    </div>
  );
}
