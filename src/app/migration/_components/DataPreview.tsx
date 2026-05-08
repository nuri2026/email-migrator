"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function DataPreview() {
  const [activeTab, setActiveTab] = useState("deals");

  const { data, isLoading } = useQuery({
    queryKey: ["migration-data", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/migration/data?type=${activeTab}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      return res.json();
    },
  });

  const renderDeals = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((deal: any) => (
          <TableRow key={deal.id}>
            <TableCell className="font-medium">
              <div>{deal.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {deal.dealOwner || "No Owner"}
              </div>
            </TableCell>
            <TableCell>{deal.companyName || "-"}</TableCell>
            <TableCell>{deal.amount || "-"}</TableCell>
            <TableCell>{deal.dealStage || "N/A"}</TableCell>
            <TableCell>
              {deal.hubspotId ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Synced
                </Badge>
              ) : (
                <Badge variant="outline">Staged</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
        {data?.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center py-8 text-muted-foreground"
            >
              No deals staged. Extract from Brevo to see data here.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderNotes = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Note Content</TableHead>
          <TableHead>Associated Deal</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((note: any) => (
          <TableRow key={note.id}>
            <TableCell className="max-w-md truncate">{note.body}</TableCell>
            <TableCell>{note.deal?.name || "None"}</TableCell>
            <TableCell>
              {note.hubspotId ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Synced
                </Badge>
              ) : (
                <Badge variant="outline">Staged</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
        {data?.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center py-8 text-muted-foreground"
            >
              No notes staged.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderTasks = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task Name</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Associated Deal</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((task: any) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.name}</TableCell>
            <TableCell>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "No date"}
            </TableCell>
            <TableCell>{task.deal?.name || "None"}</TableCell>
            <TableCell>
              {task.hubspotId ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Synced
                </Badge>
              ) : (
                <Badge variant="outline">Staged</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
        {data?.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center py-8 text-muted-foreground"
            >
              No tasks staged.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Staged Data Preview</CardTitle>
        <CardDescription>
          Inspect records fetched from Brevo before syncing to HubSpot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deals" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="deals">{renderDeals()}</TabsContent>
              <TabsContent value="notes">{renderNotes()}</TabsContent>
              <TabsContent value="tasks">{renderTasks()}</TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
