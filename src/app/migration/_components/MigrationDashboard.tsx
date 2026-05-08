"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataPreview } from "./DataPreview";

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
    refetchInterval: 3000,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["migration-data", "logs"],
    queryFn: async () => {
      const res = await fetch("/api/migration/data?type=logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const logs = await res.json();
      return logs.slice(0, 5); // Just show the 5 most recent
    },
    refetchInterval: 3000,
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
      toast({
        title: "Extraction Started",
        description: "Fetching data from Brevo...",
      });
      queryClient.invalidateQueries({ queryKey: ["migration-stats"] });
      queryClient.invalidateQueries({ queryKey: ["migration-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Sync Started",
        description: "Pushing data to HubSpot...",
      });
      queryClient.invalidateQueries({ queryKey: ["migration-stats"] });
      queryClient.invalidateQueries({ queryKey: ["migration-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const wipeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/migration/wipe", { method: "DELETE" });
      if (!res.ok) throw new Error("Wipe failed");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Data Wiped",
        description: "Local staged data has been cleared.",
      });
      queryClient.invalidateQueries({ queryKey: ["migration-stats"] });
      queryClient.invalidateQueries({ queryKey: ["migration-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Wipe Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">
              Companies & Contacts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.companies || 0) + (stats?.contacts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Linked entities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes & Tasks</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.notes || 0) + (stats?.tasks || 0)}
            </div>
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

      <div className="flex flex-col gap-4">
        {recentLogs && recentLogs.length > 0 && (
          <Card className="border-muted bg-muted/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-3">
              <div className="space-y-2">
                {recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="px-1 py-0 h-4 text-[10px] capitalize"
                      >
                        {log.entityType}
                      </Badge>
                      <span className="text-muted-foreground truncate max-w-[200px]">
                        {log.status === "success" ? "Synced" : "Error"}:{" "}
                        {log.entityId}
                      </span>
                    </span>
                    <span
                      className={
                        log.status === "success"
                          ? "text-green-600"
                          : "text-destructive font-semibold"
                      }
                    >
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        "Failed"
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            onClick={() => extractMutation.mutate()}
            disabled={extractMutation.isPending}
            className="flex-1"
          >
            {extractMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Extract from Brevo
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || (stats?.deals || 0) === 0}
            className="flex-1"
            variant="secondary"
          >
            {syncMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Sync to HubSpot
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              disabled={
                wipeMutation.isPending ||
                (stats?.deals === 0 && stats?.notes === 0 && stats?.tasks === 0)
              }
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Wipe Local Staged Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all staged deals, notes, and tasks from your
                local database. This action cannot be undone and will not affect
                data in Brevo or HubSpot.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => wipeMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Wipe Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <DataPreview />
    </div>
  );
}
