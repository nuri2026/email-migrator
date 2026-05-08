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
          <TableHead>Contacts</TableHead>
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
            <TableCell>
              {deal.company?.name || deal.companyName || "-"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {deal.contacts?.map((c: any) => (
                  <Badge key={c.id} variant="outline" className="text-[10px]">
                    {c.email}
                  </Badge>
                ))}
                {!deal.contacts?.length && "-"}
              </div>
            </TableCell>
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
              colSpan={6}
              className="text-center py-8 text-muted-foreground"
            >
              No deals staged. Extract from Brevo to see data here.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderCompanies = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((company: any) => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">{company.name}</TableCell>
            <TableCell>{company.domain || "-"}</TableCell>
            <TableCell>
              {company.hubspotId ? (
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
      </TableBody>
    </Table>
  );

  const renderContacts = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((contact: any) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.email}</TableCell>
            <TableCell>
              {contact.firstName} {contact.lastName}
            </TableCell>
            <TableCell>
              {contact.hubspotId ? (
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
      </TableBody>
    </Table>
  );

  const renderLogs = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((log: any) => (
          <TableRow key={log.id}>
            <TableCell className="text-xs">
              {new Date(log.timestamp).toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {log.entityType}
              </Badge>
              <div className="text-[10px] text-muted-foreground mt-1">
                ID: {log.entityId}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={log.status === "success" ? "secondary" : "destructive"}
                className={
                  log.status === "success" ? "bg-green-100 text-green-800" : ""
                }
              >
                {log.status}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
              {log.message || "-"}
            </TableCell>
          </TableRow>
        ))}
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
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : (
            <>
              <TabsContent value="deals">{renderDeals()}</TabsContent>
              <TabsContent value="companies">{renderCompanies()}</TabsContent>
              <TabsContent value="contacts">{renderContacts()}</TabsContent>
              <TabsContent value="notes">{renderNotes()}</TabsContent>
              <TabsContent value="tasks">{renderTasks()}</TabsContent>
              <TabsContent value="logs">{renderLogs()}</TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
